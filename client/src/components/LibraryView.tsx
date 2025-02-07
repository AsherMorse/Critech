import { Box, Typography, Button, Skeleton, Chip, List, ListItem, ListItemText, Paper, TextField, InputAdornment, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Add, Edit } from '@mui/icons-material'
import SearchIcon from '@mui/icons-material/Search'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import TitleIcon from '@mui/icons-material/Title'

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
    ownerId: string
}

export default function LibraryView() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalReviews, setTotalReviews] = useState(0)
    const [lastId, setLastId] = useState<number | undefined>(undefined)
    const [hasMore, setHasMore] = useState(true)
    const [isFetching, setIsFetching] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchMode, setSearchMode] = useState<'tags' | 'content'>('content')
    const { token, user } = useAuth()
    const navigate = useNavigate()

    // Filter reviews based on search query and mode
    const filteredReviews = reviews.filter(review => {
        if (!searchQuery.trim()) return true
        const searchTerms = searchQuery.toLowerCase().split(' ')

        if (searchMode === 'tags') {
            return searchTerms.every(term =>
                review.tags?.some(tag => tag.toLowerCase().includes(term))
            )
        } else {
            // Search in title and description
            return searchTerms.every(term => {
                const titleMatch = review.title?.toLowerCase().includes(term)
                const descMatch = review.description?.toLowerCase().includes(term)
                return titleMatch || descMatch
            })
        }
    })

    const handleSearchModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'tags' | 'content' | null) => {
        if (newMode !== null) {
            setSearchMode(newMode)
            setSearchQuery('') // Clear search when changing modes
        }
    }

    // Fetch total count
    const fetchTotalCount = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/reviews/count?ownerId=${user?.id}`, {
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
    }, [token, user?.id])

    // Fetch next page of reviews
    const fetchNextPage = useCallback(async () => {
        if (isFetching || !hasMore) return

        try {
            setIsFetching(true)

            if (!token) {
                setError('Please log in to view your reviews')
                setLoading(false)
                return
            }

            const url = new URL(`${API_URL}/api/reviews/page`)
            url.searchParams.append('pageSize', PAGE_SIZE.toString())
            url.searchParams.append('ownerId', user?.id || '')
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
    }, [token, lastId, user?.id, reviews.length, totalReviews, hasMore, isFetching])

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
        navigate(`/review/${reviewId}/edit`)
    }

    const handleCreateReview = () => {
        navigate('/create-review')
    }

    // Show loading skeletons for the next batch
    const renderSkeletons = () => {
        if (!loading && !hasMore) return null

        return Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <ListItem key={`skeleton-${index}`}>
                <ListItemText primary={<Skeleton variant="text" />} />
            </ListItem>
        ))
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* Create Review Button and Search Section */}
            <Box sx={{ mb: 3 }}>
                {/* Search Section */}
                <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {/* Search Mode Toggle */}
                    <ToggleButtonGroup
                        value={searchMode}
                        exclusive
                        onChange={handleSearchModeChange}
                        aria-label="search mode"
                        size="small"
                        sx={{ mb: 1 }}
                    >
                        <ToggleButton value="content" aria-label="search in title and description">
                            <TitleIcon sx={{ mr: 1 }} />
                            Title & Description
                        </ToggleButton>
                        <ToggleButton value="tags" aria-label="search by tags">
                            <LocalOfferIcon sx={{ mr: 1 }} />
                            Tags
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Search Input */}
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder={searchMode === 'tags'
                            ? "Search by tags (e.g., technology gaming)"
                            : "Search in titles and descriptions"}
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
                            width: '100%',
                        }}
                    />
                </Box>

                {/* Create Review Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreateReview}
                        sx={{ textTransform: 'none' }}
                    >
                        Create Review
                    </Button>
                </Box>
            </Box>

            {/* Count indicator */}
            {filteredReviews.length > 0 && (
                <Box sx={{ width: '100%', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
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
                    {error === 'Please log in to view your reviews' && (
                        <Typography variant="body2">
                            You need to be logged in to view your reviews.
                        </Typography>
                    )}
                </Box>
            )}

            {!loading && !error && reviews.length === 0 && (
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
            )}

            <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1 }}>
                {filteredReviews.map((review) => (
                    <Paper
                        key={review.id}
                        sx={{
                            mb: 2,
                            overflow: 'hidden'
                        }}
                    >
                        <ListItem
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'stretch', sm: 'center' },
                                gap: 2,
                                p: 2
                            }}
                        >
                            {/* Thumbnail */}
                            {review.video?.thumbnailUrl && (
                                <Box
                                    sx={{
                                        width: { xs: '100%', sm: '180px' },
                                        height: { xs: '200px', sm: '100px' },
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: 1,
                                        flexShrink: 0
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={review.video.thumbnailUrl}
                                        alt={review.title}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </Box>
                            )}

                            {/* Content */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                    {review.title || 'Untitled Review'}
                                </Typography>

                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Status: {review.status.replace(/_/g, ' ').toUpperCase()}
                                </Typography>

                                {review.description && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            mb: 1
                                        }}
                                    >
                                        {review.description}
                                    </Typography>
                                )}

                                {/* Tags */}
                                {review.tags && review.tags.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                        {review.tags.map((tag, index) => (
                                            <Chip
                                                key={index}
                                                label={tag}
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </Box>

                            {/* Edit Button */}
                            <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                onClick={() => handleReviewClick(review.id)}
                                sx={{
                                    alignSelf: { xs: 'stretch', sm: 'flex-start' },
                                    mt: { xs: 1, sm: 0 }
                                }}
                            >
                                Edit
                            </Button>
                        </ListItem>
                    </Paper>
                ))}
                {!searchQuery && renderSkeletons()}
            </List>
        </Box>
    )
}