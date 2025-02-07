import { Box, Typography, Grid, Card, CardMedia, Skeleton, Chip, TextField, InputAdornment } from '@mui/material'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'

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
    const [error, setError] = useState<string | null>(null)
    const [totalReviews, setTotalReviews] = useState(0)
    const [lastId, setLastId] = useState<number | undefined>(undefined)
    const [hasMore, setHasMore] = useState(true)
    const [isFetching, setIsFetching] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const { token } = useAuth()
    const navigate = useNavigate()

    // Filter reviews based on search query
    const filteredReviews = reviews.filter(review => {
        if (!searchQuery.trim()) return true
        const searchTerms = searchQuery.toLowerCase().split(' ')
        return searchTerms.every(term =>
            review.tags?.some(tag => tag.toLowerCase().includes(term))
        )
    })

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

            if (newReviews.length === 0 || newReviews.length < PAGE_SIZE) {
                setHasMore(false)
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
            }

            console.log('Fetched reviews:', {
                count: newReviews.length,
                lastId: lastId,
                hasMore: newReviews.length === PAGE_SIZE,
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
                <Card sx={{
                    height: 0,
                    paddingTop: '177.77%', // 9:16 aspect ratio (16/9 * 100)
                    position: 'relative',
                    bgcolor: 'rgba(0,0,0,0.1)'
                }}>
                    <Skeleton
                        variant="rectangular"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%'
                        }}
                    />
                </Card>
            </Grid>
        ))
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* Search Bar */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search by tags (e.g., technology gaming)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        sx: {
                            bgcolor: 'background.paper',
                            '&:hover': {
                                bgcolor: 'background.paper',
                            },
                        }
                    }}
                    sx={{
                        maxWidth: '600px',
                        mx: 'auto',
                        display: 'block',
                    }}
                />
            </Box>

            {/* Count indicator */}
            {filteredReviews.length > 0 && (
                <Box sx={{ width: '100%', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {isFetching ? 'Loading more reviews...' :
                            searchQuery.trim() ? `Found ${filteredReviews.length} matching reviews` :
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

            {!loading && !error && filteredReviews.length === 0 && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <Typography>
                        {searchQuery.trim() ? 'No reviews match your search' : 'No reviews available yet'}
                    </Typography>
                </Box>
            )}

            <Grid container spacing={2}>
                {filteredReviews.map((review) => (
                    <Grid item xs={12} sm={6} md={4} key={review.id}>
                        <Card
                            sx={{
                                height: 0,
                                paddingTop: '177.77%', // 9:16 aspect ratio (16/9 * 100)
                                position: 'relative',
                                cursor: 'pointer',
                                bgcolor: 'rgba(0,0,0,0.1)',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                    transition: 'transform 0.2s ease-in-out'
                                }
                            }}
                            onClick={() => handleReviewClick(review.id)}
                        >
                            {review.video?.thumbnailUrl ? (
                                <>
                                    <CardMedia
                                        component="img"
                                        image={review.video.thumbnailUrl}
                                        alt={review.title || 'Review thumbnail'}
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    {/* Title overlay at the top */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                                            padding: 2,
                                            color: 'white'
                                        }}
                                    >
                                        <Typography variant="subtitle1" noWrap>
                                            {review.title}
                                        </Typography>
                                    </Box>
                                    {/* Tags overlay at the bottom */}
                                    {review.tags && review.tags.length > 0 && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                                                padding: 2,
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 0.5
                                            }}
                                        >
                                            {review.tags.slice(0, 3).map((tag, index) => (
                                                <Chip
                                                    key={index}
                                                    label={tag}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                        color: 'white',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(255, 255, 255, 0.3)'
                                                        }
                                                    }}
                                                />
                                            ))}
                                            {review.tags.length > 3 && (
                                                <Chip
                                                    label={`+${review.tags.length - 3}`}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                        color: 'white',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(255, 255, 255, 0.3)'
                                                        }
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'background.paper'
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        No thumbnail available
                                    </Typography>
                                </Box>
                            )}
                        </Card>
                    </Grid>
                ))}
                {!searchQuery && renderSkeletons()}
            </Grid>
        </Box>
    )
} 