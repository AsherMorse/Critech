import { Box, Typography, Grid, Card, CardMedia, CardContent, Button } from '@mui/material'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Add } from '@mui/icons-material'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Review {
    id: number
    videoId: number
    title: string
    description?: string
    pros?: string[]
    cons?: string[]
    altLinks?: string[]
    tags?: string[]
    status: 'video_uploaded' | 'dralift' | 'in_review' | 'published' | 'archived' | 'deleted'
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
    }
    ownerId: string
}

export default function LibraryView() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { token, user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                if (!token) {
                    setError('Please log in to view your reviews')
                    setLoading(false)
                    return
                }

                const response = await fetch(`${API_URL}/api/reviews`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                let reviewsData
                try {
                    const text = await response.text()
                    console.log('Raw response:', text)
                    const data = text ? JSON.parse(text) : []
                    reviewsData = Array.isArray(data) ? data : data.data || []
                } catch (parseError) {
                    console.error('Error parsing response:', parseError)
                    reviewsData = []
                }

                // Filter for user's own reviews and exclude deleted ones
                const userReviews = reviewsData.filter((review: Review) =>
                    review &&
                    review.ownerId === user?.id &&
                    review.status !== 'deleted'
                )
                console.log('User reviews:', userReviews)
                setReviews(userReviews)
            } catch (error) {
                console.error('Error fetching reviews:', error)
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load reviews'
                )
            } finally {
                setLoading(false)
            }
        }

        fetchReviews()
    }, [token, user?.id])

    const handleReviewClick = (reviewId: number) => {
        navigate(`/review/${reviewId}/edit`)
    }

    const handleCreateReview = () => {
        navigate('/create-review')
    }

    if (loading) {
        return (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Typography>Loading your reviews...</Typography>
            </Box>
        )
    }

    if (error) {
        return (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                <Typography color="error" gutterBottom>{error}</Typography>
                {error === 'Please log in to view your reviews' && (
                    <Typography variant="body2">
                        You need to be logged in to view your reviews.
                    </Typography>
                )}
            </Box>
        )
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* Create Review Button */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateReview}
                    sx={{ textTransform: 'none' }}
                >
                    Create Review
                </Button>
            </Box>

            {reviews.length === 0 ? (
                <Box sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    textAlign: 'center'
                }}>
                    <Typography variant="h6">No reviews yet</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Start creating reviews to build your library
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {reviews.map((review) => (
                        <Grid item xs={12} sm={6} md={4} key={review.id}>
                            <Card
                                sx={{
                                    position: 'relative',
                                    height: 200,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                        transition: 'transform 0.2s ease-in-out'
                                    }
                                }}
                                onClick={() => handleReviewClick(review.id)}
                            >
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={review.video?.thumbnailUrl || ``}
                                    alt={review.title || 'Review thumbnail'}
                                    sx={{ objectFit: 'cover' }}
                                />
                                <CardContent
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        width: '100%',
                                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                        p: 1,
                                        '&:last-child': { pb: 1 }
                                    }}
                                >
                                    <Typography variant="subtitle1" sx={{ color: 'white', mb: 0.5 }}>
                                        {review.title || 'Untitled Review'}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'rgba(255,255,255,0.7)',
                                            display: 'block',
                                            mb: 0.5
                                        }}
                                    >
                                        Status: {review.status.replace(/_/g, ' ').toUpperCase()}
                                    </Typography>
                                    {review.description && (
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }} noWrap>
                                            {review.description}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    )
} 