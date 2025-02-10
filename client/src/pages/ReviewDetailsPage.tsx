import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Typography, Container, Paper, Chip, List, ListItem, ListItemText, Divider, ThemeProvider, createTheme, IconButton, Grid } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import TranscriptViewer from '../components/video/TranscriptViewer'
import SummaryViewer from '../components/video/SummaryViewer'

const API_URL = import.meta.env.VITE_API_URL || ''

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#1e88e5',
            dark: '#1565c0',
            light: '#42a5f5'
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e'
        }
    }
})

interface Review {
    id: number
    videoId: number
    title: string
    description?: string
    pros?: string[]
    cons?: string[]
    altLinks?: Array<string | { url: string; name: string }>
    tags?: string[]
    status: 'video_uploaded' | 'draft' | 'in_review' | 'published' | 'archived' | 'deleted'
    statusHistory: Array<{
        status: string
        timestamp: string
    }>
    isVideoReady: boolean
    publishedAt?: string
    archivedAt?: string
    createdAt: string
    updatedAt: string
    video?: {
        videoUrl: string
        thumbnailUrl?: string
        cloudinaryId?: string
        metadata?: {
            aspectRatio?: string
        }
        transcript?: string
        summary?: string
        transcriptStatus?: 'pending' | 'processing' | 'completed' | 'failed'
    }
}

export default function ReviewDetailsPage() {
    const { reviewId } = useParams()
    const navigate = useNavigate()
    const [review, setReview] = useState<Review | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { token } = useAuth()

    useEffect(() => {
        const fetchReview = async () => {
            try {
                if (!token) {
                    setError('Please log in to view review details')
                    setLoading(false)
                    return
                }

                const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch review: ${response.statusText}`)
                }

                let data
                try {
                    const text = await response.text()
                    console.log('Raw review response:', text)
                    data = JSON.parse(text)
                } catch (parseError) {
                    console.error('Error parsing review response:', parseError)
                    throw new Error('Failed to parse review data')
                }

                // Fetch the video data
                if (data.videoId) {
                    try {
                        const videoResponse = await fetch(`${API_URL}/api/videos/${data.videoId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        })

                        if (videoResponse.ok) {
                            const videoText = await videoResponse.text()
                            console.log('Raw video response:', videoText)
                            const videoData = JSON.parse(videoText)
                            data.video = videoData
                        } else {
                            console.error('Failed to fetch video:', videoResponse.status, videoResponse.statusText)
                        }
                    } catch (videoError) {
                        console.error('Error fetching/parsing video:', videoError)
                    }
                }

                setReview(data)
            } catch (error) {
                console.error('Error fetching review:', error)
                setError(error instanceof Error ? error.message : 'Failed to load review')
            } finally {
                setLoading(false)
            }
        }

        fetchReview()
    }, [reviewId, token])

    if (loading) {
        return (
            <ThemeProvider theme={darkTheme}>
                <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
                    <Container>
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                            <Typography>Loading review...</Typography>
                        </Box>
                    </Container>
                </Box>
            </ThemeProvider>
        )
    }

    if (error || !review) {
        return (
            <ThemeProvider theme={darkTheme}>
                <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
                    <Container>
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                            <Typography color="error">{error || 'Review not found'}</Typography>
                        </Box>
                    </Container>
                </Box>
            </ThemeProvider>
        )
    }

    return (
        <ThemeProvider theme={darkTheme}>
            <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
                <Container maxWidth="lg">
                    <Box sx={{ py: 4 }}>
                        {/* Back Button */}
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <IconButton
                                onClick={() => navigate('/dashboard')}
                                sx={{
                                    color: 'white',
                                    mr: 1,
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                            >
                                <ArrowBack />
                            </IconButton>
                            <Typography variant="h6" component="span">
                                Back to Discover
                            </Typography>
                        </Box>

                        {/* Video Player and Transcript Section */}
                        <Grid container spacing={3}>
                            {/* Video Player Column */}
                            <Grid item xs={12} md={6}>
                                <Paper
                                    sx={{
                                        width: '100%',
                                        aspectRatio: '9/16',
                                        mb: { xs: 3, md: 0 },
                                        bgcolor: 'background.paper',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {review.video?.videoUrl ? (
                                        <Box
                                            component="video"
                                            autoPlay
                                            loop
                                            playsInline
                                            src={review.video.videoUrl}
                                            onClick={(e) => {
                                                const video = e.target as HTMLVideoElement
                                                video.currentTime = 0
                                                video.play()
                                            }}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                backgroundColor: '#000',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Typography sx={{ color: 'white', p: 2 }}>
                                                Your browser does not support the video tag.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box sx={{
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            gap: 1,
                                            p: 2
                                        }}>
                                            <Typography variant="h6">Video Unavailable</Typography>
                                            <Typography variant="body2" color="text.secondary" align="center">
                                                The video could not be loaded.
                                                {review.status === 'draft' && ' This review is still in draft mode.'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>

                            {/* Transcript and Summary Column */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {/* Summary Section */}
                                    {review.videoId && (
                                        <SummaryViewer videoId={review.videoId.toString()} />
                                    )}

                                    {/* Transcript Section */}
                                    {review.videoId && (
                                        <TranscriptViewer
                                            videoId={review.videoId.toString()}
                                            maxHeight="400px"
                                        />
                                    )}
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Review Details */}
                        <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
                            <Typography variant="h4" gutterBottom>
                                {review.title || 'Untitled Review'}
                            </Typography>

                            {review.description && (
                                <Typography variant="body1" paragraph>
                                    {review.description}
                                </Typography>
                            )}

                            {/* Tags */}
                            {review.tags && review.tags.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    {review.tags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            sx={{ mr: 1, mb: 1 }}
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            )}
                        </Paper>

                        {/* Pros & Cons */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                            {/* Pros */}
                            {review.pros && review.pros.length > 0 && (
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" color="success.main" gutterBottom>
                                        Pros
                                    </Typography>
                                    <List dense>
                                        {review.pros.map((pro, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={pro} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            )}

                            {/* Cons */}
                            {review.cons && review.cons.length > 0 && (
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" color="error.main" gutterBottom>
                                        Cons
                                    </Typography>
                                    <List dense>
                                        {review.cons.map((con, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={con} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            )}
                        </Box>

                        {/* Alternative Links */}
                        {review.altLinks && review.altLinks.length > 0 && (
                            <Paper sx={{ p: 2, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Alternative Links
                                </Typography>
                                <List dense>
                                    {review.altLinks.map((link, index) => (
                                        <ListItem key={index}>
                                            <ListItemText>
                                                <a
                                                    href={typeof link === 'string' ? link : link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#1e88e5' }}
                                                >
                                                    {typeof link === 'string' ? link : link.name || link.url}
                                                </a>
                                            </ListItemText>
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {/* Metadata */}
                        <Typography variant="caption" color="text.secondary">
                            Created: {new Date(review.createdAt).toLocaleDateString()}
                            {review.publishedAt && ` • Published: ${new Date(review.publishedAt).toLocaleDateString()}`}
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </ThemeProvider>
    )
} 