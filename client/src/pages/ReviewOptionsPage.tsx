import {
  Box,
  Typography,
  Paper,
  ThemeProvider,
  createTheme,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
  CircularProgress
} from '@mui/material'
import { useLocation, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { AutoAwesome } from '@mui/icons-material'
import { TopicSelector } from '../components/TopicSelector'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is not set')
}

interface AltLink {
  name: string;
  url: string;
}

interface FormData {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  tags: string[];
  altLinks: AltLink[];
  topicId?: number;
}

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

interface LocationState {
  videoUrl: string;
  videoId: number;
}

export default function ReviewOptionsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token } = useAuth()
  const state = location.state as LocationState
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoData, setVideoData] = useState<{ transcript?: string } | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    pros: [''],
    cons: [''],
    tags: [''],
    altLinks: [{ name: '', url: '' }],
    topicId: undefined
  })

  // Redirect to dashboard if no videoId is provided
  if (!state?.videoId) {
    return <Navigate to="/dashboard" replace />
  }

  // Add useEffect to fetch video data (for transcript)
  useEffect(() => {
    const fetchVideoData = async () => {
      if (!token || !state?.videoId) return

      try {
        const response = await fetch(`${API_URL}/api/videos/${state.videoId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch video data')
        }

        const data = await response.json()
        setVideoData(data)
      } catch (error) {
        console.error('Error fetching video data:', error)
      }
    }

    fetchVideoData()
  }, [token, state?.videoId])

  const handleInputChange =
    (field: keyof FormData) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
          ...prev,
          [field]: event.target.value
        }))
      }

  const handleArrayChange = (
    field: 'pros' | 'cons' | 'tags',
    index: number
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === index ? event.target.value : item
      )
    }))
  }

  const handleAltLinkChange = (
    index: number,
    field: keyof AltLink
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      altLinks: prev.altLinks.map((link, i) =>
        i === index ? { ...link, [field]: event.target.value } : link
      )
    }))
  }

  const addArrayItem = (field: 'pros' | 'cons' | 'tags') => () => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'pros' | 'cons' | 'tags', index: number) => () => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const addAltLink = () => {
    setFormData(prev => ({
      ...prev,
      altLinks: [...prev.altLinks, { name: '', url: '' }]
    }))
  }

  const removeAltLink = (index: number) => () => {
    setFormData(prev => ({
      ...prev,
      altLinks: prev.altLinks.filter((_, i) => i !== index)
    }))
  }

  const handleGenerateProsCons = async () => {
    if (!videoData?.transcript || !token) {
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(`${API_URL}/api/openai/generate-pros-cons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          transcript: videoData.transcript
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate pros and cons')
      }

      const data = await response.json()

      if (!data.data?.pros || !data.data?.cons) {
        throw new Error('Invalid response structure from server')
      }

      setFormData(prev => {
        const newPros = data.data.pros.length > 0 ? data.data.pros : ['']
        const newCons = data.data.cons.length > 0 ? data.data.cons : ['']

        if (!newPros.includes('')) newPros.push('')
        if (!newCons.includes('')) newCons.push('')

        return {
          ...prev,
          pros: newPros,
          cons: newCons
        }
      })
    } catch (error) {
      console.error('Error in pros/cons generation:', error)
      alert('Failed to generate pros and cons. Please try again or add them manually.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateTags = async () => {
    if (!videoData?.transcript || !token) return

    setIsGenerating(true)
    try {
      const response = await fetch(`${API_URL}/api/openai/generate-tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          transcript: videoData.transcript,
          title: formData.title,
          description: formData.description
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate tags')
      }

      const data = await response.json()

      if (!data.data?.tags) {
        throw new Error('Invalid response structure from server')
      }

      setFormData(prev => {
        const newTags = data.data.tags.length > 0 ? data.data.tags : ['']
        if (!newTags.includes('')) newTags.push('')
        return {
          ...prev,
          tags: newTags
        }
      })
    } catch (error) {
      console.error('Error in tag generation:', error)
      alert('Failed to generate tags. Please try again or add them manually.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateAltLinks = async () => {
    if (!videoData?.transcript || !token) return

    setIsGenerating(true)
    try {
      const response = await fetch(`${API_URL}/api/openai/generate-alt-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          transcript: videoData.transcript,
          title: formData.title,
          description: formData.description
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate alternative links')
      }

      const data = await response.json()

      if (!data.data?.altLinks) {
        throw new Error('Invalid response structure from server')
      }

      const newAltLinks = data.data.altLinks.map((link: { name: string; url: string }) => ({
        name: link.name,
        url: link.url.startsWith('http') ? link.url : `https://${link.url}`
      }))

      if (newAltLinks.length === 0 || !newAltLinks.some((link: AltLink) => link.name === '' && link.url === '')) {
        newAltLinks.push({ name: '', url: '' })
      }

      setFormData(prev => ({
        ...prev,
        altLinks: newAltLinks
      }))
    } catch (error) {
      console.error('Error in alt links generation:', error)
      alert('Failed to generate alternative links. Please try again or add them manually.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    const cleanedData = {
      ...formData,
      pros: formData.pros.filter(pro => pro.trim() !== ''),
      cons: formData.cons.filter(con => con.trim() !== ''),
      altLinks: formData.altLinks.filter(link => link.name.trim() !== '' && link.url.trim() !== ''),
      tags: formData.tags.filter(tag => tag.trim() !== '')
    }

    try {
      const response = await fetch(`${API_URL}/api/reviews/from-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoId: Number(state.videoId),
          title: cleanedData.title,
          description: cleanedData.description,
          pros: cleanedData.pros,
          cons: cleanedData.cons,
          altLinks: cleanedData.altLinks,
          tags: cleanedData.tags,
          topicId: cleanedData.topicId
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData
        })

        let errorMessage: string
        try {
          const parsedError = JSON.parse(errorData)
          errorMessage = parsedError.error || parsedError.message || `HTTP error! status: ${response.status}`
        } catch {
          // If the error isn't JSON, use the raw text or status
          errorMessage = errorData || `HTTP error! status: ${response.status}`
          if (response.status === 504) {
            errorMessage = 'Request timed out. Please try again.'
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data.id) {
        throw new Error('Invalid response format from server')
      }

      navigate(`/reviews/${data.id}`)
    } catch (error) {
      console.error('Error creating review:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      alert(`Error creating review: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTopicChange = (topicId: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      topicId
    }))
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          p: 3
        }}
      >
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: 3 }}
        >
          <Typography variant="h5" gutterBottom>
            Create Review
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Topic
            </Typography>
            <TopicSelector
              value={formData.topicId}
              onChange={handleTopicChange}
            />
          </Box>

          <TextField
            label="Title"
            value={formData.title}
            onChange={handleInputChange('title')}
            fullWidth
            required
            sx={{ mb: 3 }}
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={handleInputChange('description')}
            fullWidth
            multiline
            rows={4}
            required
            sx={{ mb: 3 }}
          />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Pros
            </Typography>
            {/* Generate Button - show only if there's a transcript */}
            {videoData?.transcript && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
                onClick={handleGenerateProsCons}
                disabled={isGenerating}
                sx={{ mb: 1 }}
              >
                {isGenerating ? 'Generating...' : 'Auto-Generate Pros & Cons'}
              </Button>
            )}
          </Box>
          {formData.pros.map((pro, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label={`Pro ${index + 1}`}
                variant="outlined"
                fullWidth
                value={pro}
                onChange={handleArrayChange('pros', index)}
              />
              <Button
                variant="outlined"
                color="error"
                onClick={removeArrayItem('pros', index)}
                disabled={formData.pros.length === 1}
              >
                Remove
              </Button>
            </Box>
          ))}
          <Button variant="outlined" onClick={addArrayItem('pros')}>
            Add Pro
          </Button>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Cons
          </Typography>
          {formData.cons.map((con, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label={`Con ${index + 1}`}
                variant="outlined"
                fullWidth
                value={con}
                onChange={handleArrayChange('cons', index)}
              />
              <Button
                variant="outlined"
                color="error"
                onClick={removeArrayItem('cons', index)}
                disabled={formData.cons.length === 1}
              >
                Remove
              </Button>
            </Box>
          ))}
          <Button variant="outlined" onClick={addArrayItem('cons')}>
            Add Con
          </Button>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Alternative Links
          </Typography>
          {/* Add Generate Alt Links button */}
          {videoData?.transcript && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
              onClick={handleGenerateAltLinks}
              disabled={isGenerating}
              sx={{ mb: 2 }}
            >
              {isGenerating ? 'Generating...' : 'Auto-Generate Links'}
            </Button>
          )}
          {formData.altLinks.map((link: AltLink, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Link Name"
                variant="outlined"
                sx={{ flex: 1 }}
                value={link.name}
                onChange={handleAltLinkChange(index, 'name')}
              />
              <Box sx={{ flex: 2, display: 'flex', gap: 1 }}>
                <TextField
                  label="URL"
                  variant="outlined"
                  fullWidth
                  value={link.url}
                  onChange={(e) => {
                    const input = e.target as HTMLInputElement;
                    const newUrl = input.value;
                    setFormData(prev => ({
                      ...prev,
                      altLinks: prev.altLinks.map((l, i) =>
                        i === index
                          ? {
                            ...l,
                            url: newUrl.startsWith('http')
                              ? newUrl
                              : `https://${newUrl}`
                          }
                          : l
                      )
                    }));
                  }}
                  placeholder="https://example.com"
                />
                {link.url && (
                  <Button
                    variant="outlined"
                    component="a"
                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ minWidth: 'auto' }}
                  >
                    Open
                  </Button>
                )}
              </Box>
              <Button
                variant="outlined"
                color="error"
                onClick={removeAltLink(index)}
                disabled={formData.altLinks.length === 1}
              >
                Remove
              </Button>
            </Box>
          ))}
          <Button variant="outlined" onClick={addAltLink}>
            Add Alternative Link
          </Button>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Tags
          </Typography>
          {/* Add Generate Tags button */}
          {videoData?.transcript && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />}
              onClick={handleGenerateTags}
              disabled={isGenerating}
              sx={{ mb: 2 }}
            >
              {isGenerating ? 'Generating...' : 'Auto-Generate Tags'}
            </Button>
          )}
          {formData.tags.map((tag, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label={`Tag ${index + 1}`}
                variant="outlined"
                fullWidth
                value={tag}
                onChange={handleArrayChange('tags', index)}
                placeholder="Enter a tag (e.g., technology, gaming, tutorial)"
              />
              <Button
                variant="outlined"
                color="error"
                onClick={removeArrayItem('tags', index)}
                disabled={formData.tags.length === 1}
              >
                Remove
              </Button>
            </Box>
          ))}
          <Button variant="outlined" onClick={addArrayItem('tags')}>
            Add Tag
          </Button>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Additional Options
          </Typography>

          <FormControlLabel
            control={<Switch disabled />}
            label="Allow Comments (Coming Soon)"
          />

          <FormControlLabel
            control={<Switch disabled />}
            label="Make Review Public (Coming Soon)"
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
              sx={{
                minWidth: '150px',
                fontSize: '1.1rem',
                textTransform: 'none'
              }}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                minWidth: '200px',
                fontSize: '1.1rem',
                textTransform: 'none'
              }}
            >
              {isLoading ? 'Creating...' : 'Start Review'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  )
}