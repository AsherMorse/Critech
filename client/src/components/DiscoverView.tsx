import { Box, Typography, Grid, Card, CardMedia, Skeleton, Chip, TextField, InputAdornment, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import TitleIcon from '@mui/icons-material/Title'

const API_URL = import.meta.env.VITE_API_URL || ''
const PAGE_SIZE = 1
const SEARCH_ENABLED = false // Hardcoded flag to disable search

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
  const [searchMode, setSearchMode] = useState<'tags' | 'content'>('content')
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null)
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({})
  const { token } = useAuth()
  const navigate = useNavigate()

  // Filter reviews based on search query and mode
  const filteredReviews = SEARCH_ENABLED ? reviews.filter(review => {
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
  }) : reviews

  const handleSearchModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'tags' | 'content' | null) => {
    if (newMode !== null) {
      setSearchMode(newMode)
      setSearchQuery('') // Clear search when changing modes
    }
  }

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

  // Handle video visibility change
  const handleVideoIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      const videoId = parseInt(entry.target.getAttribute('data-video-id') || '0')
      if (entry.isIntersecting) {
        setActiveVideoId(videoId)
        const video = videoRefs.current[videoId]
        if (video) {
          video.play().catch(error => {
            console.error('Error playing video:', error)
          })
        }
      } else {
        const video = videoRefs.current[videoId]
        if (video) {
          video.pause()
          video.currentTime = 0
        }
      }
    })
  }, [])

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleVideoIntersection, {
      threshold: 0.5 // Trigger when video is 50% visible
    })

    // Observe all video containers
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        observer.observe(video.parentElement!)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [handleVideoIntersection, reviews])

  // Handle video loading
  const handleVideoLoad = useCallback((videoId: number) => {
    const video = videoRefs.current[videoId]
    if (video && activeVideoId === videoId) {
      video.play().catch(error => {
        console.error('Error playing video:', error)
      })
    }
  }, [activeVideoId])

  // Handle video error
  const handleVideoError = useCallback((videoId: number) => {
    console.error(`Error loading video ${videoId}`)
    // Could add error state handling here if needed
  }, [])

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
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        overflow: 'auto',
        position: 'fixed',
        top: 0,
        left: 0,
        bgcolor: 'background.default',
        scrollSnapType: 'y mandatory' // Enable smooth snapping
      }}
    >
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
            No reviews available yet
          </Typography>
        </Box>
      )}

      {/* Video Container */}
      <Box sx={{ width: '100%', height: '100%' }}>
        {filteredReviews.map((review) => (
          <Box
            key={review.id}
            sx={{
              height: '100vh',
              width: '100%',
              position: 'relative',
              bgcolor: 'black',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
              overflow: 'hidden'
            }}
            onClick={() => handleReviewClick(review.id)}
          >
            {review.video?.videoUrl ? (
              <>
                <video
                  ref={el => {
                    if (el) videoRefs.current[review.id] = el
                  }}
                  data-video-id={review.id}
                  src={review.video.videoUrl}
                  playsInline
                  muted
                  loop
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onLoadedData={() => handleVideoLoad(review.id)}
                  onError={() => handleVideoError(review.id)}
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
                    color: 'white',
                    zIndex: 1
                  }}
                >
                  <Typography variant="h6" noWrap>
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
                      gap: 0.5,
                      zIndex: 1
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
                  bgcolor: 'black'
                }}
              >
                <Typography variant="body1" color="white">
                  Video not available
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Loading indicator */}
      {(loading || isFetching) && (
        <Box
          sx={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'black'
          }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
          />
        </Box>
      )}
    </Box>
  )
} 