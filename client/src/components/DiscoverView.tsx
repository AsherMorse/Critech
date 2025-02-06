import { Box, Typography, Grid, Card, CardMedia, CardContent } from '@mui/material'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

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
    }
}

export default function DiscoverView() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { token } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                if (!token) {
                    setError('Please log in to view reviews')
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
                    const text = await response.text() // Get response as text first
                    console.log('Raw response:', text) // Debug log
                    const data = text ? JSON.parse(text) : []
                    reviewsData = Array.isArray(data) ? data : data.data || []
                } catch (parseError) {
                    console.error('Error parsing response:', parseError)
                    reviewsData = []
                }

                // Show all active reviews (not deleted or archived)
                const activeReviews = reviewsData.filter((review: Review) =>
                    review &&
                    review.status !== 'deleted' &&
                    review.status !== 'archived' &&
                    (review.title || review.description) // Only show reviews with content
                )
                console.log('Active reviews:', activeReviews)
                setReviews(activeReviews)
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
    }, [token])

    const handleReviewClick = (reviewId: number) => {
        navigate(`/reviews/${reviewId}`)
    }

    if (loading) {
        return (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Typography>Loading reviews...</Typography>
            </Box>
        )
    }

    if (error) {
        return (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                <Typography color="error" gutterBottom>{error}</Typography>
                {error === 'Please log in to view reviews' && (
                    <Typography variant="body2">
                        You need to be logged in to view reviews.
                    </Typography>
                )}
            </Box>
        )
    }

    if (reviews.length === 0) {
        return (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Typography>No reviews available yet</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 2 }}>
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
                                image={review.video?.thumbnailUrl || `https://img.youtube.com/vi/${review.videoId}/maxresdefault.jpg`}
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
        </Box>
    )
} 