import { Box, Typography, Grid, Card, CardMedia, CardContent, Skeleton, LinearProgress } from '@mui/material'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || ''
const PAGE_SIZE = 1

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
}

export default function DiscoverView() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [totalReviews, setTotalReviews] = useState(0)
    const [lastId, setLastId] = useState<number | undefined>(undefined)
    const [hasMore, setHasMore] = useState(true)
    const [isFetching, setIsFetching] = useState(false)
    const { token } = useAuth()
    const navigate = useNavigate()

    // Fetch total count
    const fetchTotalCount = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/reviews/count`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            setTotalReviews(data.count)
        } catch (error) {
            console.error('Error fetching review count:', error)
        }
    }, [token])

    // Fetch next page of reviews
    const fetchNextPage = useCallback(async () => {
        if (isFetching || !hasMore) return

        try {
            setIsFetching(true)

            if (!token) {
                setError('Please log in to view reviews')
                setLoading(false)
                return
            }

            const url = new URL(`${API_URL}/api/reviews/page`)
            url.searchParams.append('pageSize', PAGE_SIZE.toString())
            if (lastId) url.searchParams.append('lastId', lastId.toString())

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const newReviews = await response.json()

            // Update progress before state changes
            const nextProgress = Math.min(100, ((reviews.length + newReviews.length) / totalReviews) * 100)

            if (newReviews.length === 0 || newReviews.length < PAGE_SIZE) {
                setHasMore(false)
                setProgress(100)
                if (newReviews.length > 0) {
                    setReviews(prev => {
                        // Create a Set of existing IDs
                        const existingIds = new Set(prev.map((r: Review) => r.id))
                        // Only add reviews that don't already exist
                        const uniqueNewReviews = newReviews.filter((r: Review) => !existingIds.has(r.id))
                        return [...prev, ...uniqueNewReviews]
                    })
                    setLastId(newReviews[newReviews.length - 1].id)
                }
            } else {
                setReviews(prev => {
                    // Create a Set of existing IDs
                    const existingIds = new Set(prev.map((r: Review) => r.id))
                    // Only add reviews that don't already exist
                    const uniqueNewReviews = newReviews.filter((r: Review) => !existingIds.has(r.id))
                    return [...prev, ...uniqueNewReviews]
                })
                setLastId(newReviews[newReviews.length - 1].id)
                setProgress(nextProgress)
            }

            console.log('Fetched reviews:', {
                count: newReviews.length,
                lastId: lastId,
                hasMore: newReviews.length === PAGE_SIZE,
                progress: nextProgress,
                total: totalReviews,
                current: reviews.length + newReviews.length,
                newReviewIds: newReviews.map((r: Review) => r.id)
            })
        } catch (error) {
            console.error('Error fetching reviews:', error)
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load reviews'
            )
        } finally {
            setIsFetching(false)
            setLoading(false)
        }
    }, [token, lastId, reviews.length, totalReviews, hasMore, isFetching])

    // Initial load
    useEffect(() => {
        const init = async () => {
            await fetchTotalCount()
            await fetchNextPage()
        }
        init()
    }, [fetchTotalCount, fetchNextPage])

    // Auto-fetch next page when scrolling near bottom
    useEffect(() => {
        if (!hasMore || loading || isFetching) return

        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
                fetchNextPage()
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [hasMore, loading, isFetching, fetchNextPage])

    const handleReviewClick = (reviewId: number) => {
        navigate(`/reviews/${reviewId}`)
    }

    // Show loading skeletons for the next batch
    const renderSkeletons = () => {
        if (!loading && !hasMore) return null

        return Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
                <Card sx={{ height: 200 }}>
                    <Skeleton variant="rectangular" height={200} />
                </Card>
            </Grid>
        ))
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* Count indicator */}
            {reviews.length > 0 && (
                <Box sx={{ width: '100%', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {isFetching ? 'Loading more reviews...' :
                            !hasMore ? `Loaded all ${reviews.length} reviews` :
                                `Loaded ${reviews.length} of ${totalReviews} reviews`}
                    </Typography>
                </Box>
            )}

            {error && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography color="error" gutterBottom>{error}</Typography>
                    {error === 'Please log in to view reviews' && (
                        <Typography variant="body2">
                            You need to be logged in to view reviews.
                        </Typography>
                    )}
                </Box>
            )}

            {!loading && !error && reviews.length === 0 && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <Typography>No reviews available yet</Typography>
                </Box>
            )}

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
                            {review.video?.thumbnailUrl ? (
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={review.video.thumbnailUrl}
                                    alt={review.title || 'Review thumbnail'}
                                    sx={{
                                        objectFit: 'cover',
                                        bgcolor: 'rgba(0,0,0,0.1)'
                                    }}
                                    onError={(e) => {
                                        if (review.video?.thumbnailUrl) {
                                            console.error('Failed to load thumbnail for review:', {
                                                reviewId: review.id,
                                                attemptedUrl: review.video.thumbnailUrl
                                            })
                                        }
                                        const img = e.target as HTMLImageElement
                                        img.src = '/placeholder-thumbnail.jpg'
                                    }}
                                />
                            ) : (
                                <Box sx={{ height: '100%', bgcolor: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Loading thumbnail...
                                    </Typography>
                                </Box>
                            )}
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
                {renderSkeletons()}
            </Grid>
        </Box>
    )
} 