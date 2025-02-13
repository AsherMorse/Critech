import { useState, useEffect } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { Box, Typography, TextField, Button, IconButton, Paper, ThemeProvider, createTheme, CircularProgress, Grid, Divider } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuth } from '../contexts/AuthContext'
import TranscriptViewer from '../components/video/TranscriptViewer'
import SummaryViewer from '../components/video/SummaryViewer'
import { TopicSelector } from '../components/TopicSelector'

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

interface AltLink {
  name: string
  url: string
}

interface ReviewData {
  title: string
  description: string
  pros: string[]
  cons: string[]
  altLinks: AltLink[]
  tags: string[]
  topicId?: number
  videoId?: number
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

export default function EditReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ReviewData>({
    title: '',
    description: '',
    pros: [''],
    cons: [''],
    altLinks: [{ name: '', url: '' }],
    tags: [''],
    topicId: undefined
  })

  // Redirect to dashboard if no id is provided
  if (!id) {
    return <Navigate to="/dashboard" replace />
  }

  // Load review data when component mounts
  useEffect(() => {
    const fetchReviewData = async () => {
      if (!id) return
      setIsLoading(true)
      setError(null)
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL}/api/reviews/${id}`
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          if (response.status === 403) {
            alert('You do not have permission to edit this review')
            navigate('/dashboard')
            return
          }
          throw new Error('Failed to fetch review data')
        }

        const data = await response.json()

        // If we have a videoId, fetch the transcript data
        if (data.videoId) {
          try {
            const transcriptResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/videos/${data.videoId}/transcript`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            })

            if (transcriptResponse.ok) {
              const transcriptData = await transcriptResponse.json()
              data.video = {
                ...data.video,
                transcript: transcriptData.transcript,
                summary: transcriptData.summary,
                transcriptStatus: transcriptData.status
              }
            }
          } catch (transcriptError) {
            console.error('Error fetching transcript:', transcriptError)
          }
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          pros: data.pros || [''],
          cons: data.cons || [''],
          altLinks: data.altLinks || [{ name: '', url: '' }],
          tags: data.tags || [''],
          topicId: data.topicId,
          videoId: data.videoId,
          video: data.video
        })
      } catch (error) {
        console.error('Error fetching review:', error)
        setError('Failed to load review data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchReviewData()
  }, [id, token, navigate])

  const handleInputChange =
    (field: keyof ReviewData) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
          ...prev,
          [field]: event.target.value
        }))
      }

  const handleArrayChange =
    (field: 'pros' | 'cons' | 'tags', index: number) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
          ...prev,
          [field]: prev[field].map((item, i) =>
            i === index ? event.target.value : item
          )
        }))
      }

  const addArrayItem = (field: 'pros' | 'cons' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'pros' | 'cons' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleAltLinkChange =
    (index: number, field: keyof AltLink) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
          ...prev,
          altLinks: prev.altLinks.map((link, i) =>
            i === index
              ? { ...link, [field]: event.target.value }
              : link
          )
        }))
      }

  const addAltLink = () => {
    setFormData(prev => ({
      ...prev,
      altLinks: [...prev.altLinks, { name: '', url: '' }]
    }))
  }

  const removeAltLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      altLinks: prev.altLinks.filter((_, i) => i !== index)
    }))
  }

  const handleTopicChange = (topicId: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      topicId
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    // Filter out empty values
    const cleanedData = {
      ...formData,
      pros: formData.pros.filter(pro => pro.trim() !== ''),
      cons: formData.cons.filter(con => con.trim() !== ''),
      altLinks: formData.altLinks.filter(
        link => link.name.trim() !== '' && link.url.trim() !== ''
      ),
      tags: formData.tags.filter(tag => tag.trim() !== '')
    }

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/reviews/${id}`
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanedData)
      })

      if (!response.ok) {
        throw new Error('Failed to update review')
      }

      navigate('/dashboard')
    } catch (error) {
      console.error('Error updating review:', error)
      setError('Failed to update review. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          p: 4
        }}
      >
        <Paper
          elevation={2}
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: '100%',
            maxWidth: '1200px',
            mx: 'auto',
            p: 4,
            borderRadius: '16px',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}
          >
            Edit Review
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Grid container spacing={4}>
            {/* Form Fields Column */}
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Topic
                </Typography>
                <TopicSelector
                  value={formData.topicId}
                  onChange={handleTopicChange}
                />
              </Box>

              {/* Title */}
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={handleInputChange('title')}
                sx={{ mb: 3 }}
              />

              {/* Description */}
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange('description')}
                sx={{ mb: 3 }}
              />

              {/* Pros */}
              <Typography variant="h6" gutterBottom>
                Pros
              </Typography>
              {formData.pros.map((pro, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    value={pro}
                    onChange={handleArrayChange('pros', index)}
                    placeholder={`Pro ${index + 1}`}
                  />
                  <IconButton
                    onClick={() => removeArrayItem('pros', index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => addArrayItem('pros')}
                sx={{ mb: 3 }}
              >
                Add Pro
              </Button>

              {/* Cons */}
              <Typography variant="h6" gutterBottom>
                Cons
              </Typography>
              {formData.cons.map((con, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    value={con}
                    onChange={handleArrayChange('cons', index)}
                    placeholder={`Con ${index + 1}`}
                  />
                  <IconButton
                    onClick={() => removeArrayItem('cons', index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => addArrayItem('cons')}
                sx={{ mb: 3 }}
              >
                Add Con
              </Button>

              {/* Alternative Links */}
              <Typography variant="h6" gutterBottom>
                Alternative Links
              </Typography>
              {formData.altLinks.map((link, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    label="Name"
                    value={link.name}
                    onChange={handleAltLinkChange(index, 'name')}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="URL"
                    value={link.url}
                    onChange={handleAltLinkChange(index, 'url')}
                    sx={{ flex: 2 }}
                  />
                  <IconButton
                    onClick={() => removeAltLink(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addAltLink}
                sx={{ mb: 3 }}
              >
                Add Link
              </Button>

              {/* Tags */}
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              {formData.tags.map((tag, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    value={tag}
                    onChange={handleArrayChange('tags', index)}
                    placeholder={`Tag ${index + 1}`}
                  />
                  <IconButton
                    onClick={() => removeArrayItem('tags', index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => addArrayItem('tags')}
                sx={{ mb: 3 }}
              >
                Add Tag
              </Button>
            </Grid>

            {/* Transcript and Summary Column */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  bgcolor: 'background.paper',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Video Analysis
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {formData.videoId ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <SummaryViewer videoId={formData.videoId.toString()} />
                    <TranscriptViewer
                      videoId={formData.videoId.toString()}
                      maxHeight="400px"
                    />
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    No video associated with this review.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  )
}
