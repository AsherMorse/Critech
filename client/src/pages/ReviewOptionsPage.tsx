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

const API_URL = import.meta.env.VITE_API_URL

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
    videoId: string;
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
        altLinks: [{ name: '', url: '' }]
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
            console.log('Generation skipped:', {
                hasTranscript: !!videoData?.transcript,
                hasToken: !!token
            })
            return
        }

        console.log('Starting pros/cons generation...', {
            transcriptLength: videoData.transcript.length,
            transcriptPreview: videoData.transcript.substring(0, 100) + '...'
        })

        setIsGenerating(true)
        try {
            console.log('Making API request to generate pros/cons...')
            const requestBody = {
                transcript: videoData.transcript
            }
            console.log('Request payload:', requestBody)

            const response = await fetch(`${API_URL}/api/openai/generate-pros-cons`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })

            const responseText = await response.text()
            console.log('Raw API response:', responseText)

            if (!response.ok) {
                console.error('API request failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    response: responseText
                })
                throw new Error('Failed to generate pros and cons')
            }

            let data
            try {
                data = JSON.parse(responseText)
                console.log('Parsed API response:', data)
            } catch (parseError) {
                console.error('Failed to parse API response:', {
                    error: parseError,
                    responseText
                })
                throw new Error('Invalid response format from server')
            }

            if (!data.data?.pros || !data.data?.cons) {
                console.error('Invalid response structure:', data)
                throw new Error('Invalid response structure from server')
            }

            console.log('Received generation results:', {
                prosCount: data.data.pros.length,
                consCount: data.data.cons.length,
                pros: data.data.pros,
                cons: data.data.cons,
                rawData: data
            })

            // Update form data with generated pros and cons, ensuring at least one empty field
            setFormData(prev => {
                const newPros = data.data.pros.length > 0 ? data.data.pros : ['']
                const newCons = data.data.cons.length > 0 ? data.data.cons : ['']

                // Add an empty field at the end if all fields are filled
                if (!newPros.includes('')) {
                    newPros.push('')
                }
                if (!newCons.includes('')) {
                    newCons.push('')
                }

                console.log('Updating form data with:', {
                    prosFields: newPros.length,
                    consFields: newCons.length,
                    hasEmptyPro: newPros.includes(''),
                    hasEmptyCon: newCons.includes(''),
                    newPros,
                    newCons
                })

                return {
                    ...prev,
                    pros: newPros,
                    cons: newCons
                }
            })

            console.log('Generation completed successfully')
        } catch (error) {
            console.error('Error in pros/cons generation:', {
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
                transcript: videoData.transcript.substring(0, 100) + '...'
            })
            alert('Failed to generate pros and cons. Please try again or add them manually.')
        } finally {
            setIsGenerating(false)
            console.log('Generation process finished')
        }
    }

    const handleGenerateTags = async () => {
        if (!videoData?.transcript || !token) {
            console.log('Tag generation skipped:', {
                hasTranscript: !!videoData?.transcript,
                hasToken: !!token
            })
            return
        }

        console.log('Starting tag generation...')
        setIsGenerating(true)
        try {
            const requestBody = {
                transcript: videoData.transcript,
                title: formData.title,
                description: formData.description
            }
            console.log('Request payload:', requestBody)

            const response = await fetch(`${API_URL}/api/openai/generate-tags`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })

            const responseText = await response.text()
            console.log('Raw API response:', responseText)

            if (!response.ok) {
                throw new Error('Failed to generate tags')
            }

            const data = JSON.parse(responseText)
            console.log('Parsed API response:', data)

            if (!data.data?.tags) {
                throw new Error('Invalid response structure from server')
            }

            // Update form data with generated tags, ensuring at least one empty field
            setFormData(prev => {
                const newTags = data.data.tags.length > 0 ? data.data.tags : ['']
                if (!newTags.includes('')) {
                    newTags.push('')
                }
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
        if (!videoData?.transcript || !token) {
            console.log('Alt links generation skipped:', {
                hasTranscript: !!videoData?.transcript,
                hasToken: !!token
            })
            return
        }

        console.log('Starting alt links generation...')
        setIsGenerating(true)
        try {
            const requestBody = {
                transcript: videoData.transcript,
                title: formData.title,
                description: formData.description
            }
            console.log('Request payload:', requestBody)

            const response = await fetch(`${API_URL}/api/openai/generate-alt-links`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })

            const responseText = await response.text()
            console.log('Raw API response:', responseText)

            if (!response.ok) {
                throw new Error('Failed to generate alternative links')
            }

            const data = JSON.parse(responseText)
            console.log('Parsed API response:', data)

            if (!data.data?.altLinks) {
                throw new Error('Invalid response structure from server')
            }

            // Update form data with generated alt links, ensuring at least one empty field
            setFormData(prev => {
                // Keep the full URLs from the response and ensure they have http/https
                const newAltLinks = data.data.altLinks.map((link: { name: string; url: string }) => ({
                    name: link.name,
                    url: link.url.startsWith('http') ? link.url : `https://${link.url}` // Add https if missing
                }))

                // Add an empty field if all fields are filled
                if (newAltLinks.length === 0 || !newAltLinks.some(link => link.name === '' && link.url === '')) {
                    newAltLinks.push({ name: '', url: '' })
                }

                return {
                    ...prev,
                    altLinks: newAltLinks
                }
            })
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

        // Filter out empty values
        const cleanedData = {
            ...formData,
            pros: formData.pros.filter(pro => pro.trim() !== ''),
            cons: formData.cons.filter(con => con.trim() !== ''),
            altLinks: formData.altLinks.filter(link => link.name.trim() !== '' && link.url.trim() !== ''),
            tags: formData.tags.filter(tag => tag.trim() !== '')
        }

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}/api/reviews/from-video`
            const response = await fetch(apiUrl, {
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
                    tags: cleanedData.tags
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('Server error:', errorData)
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            console.log('Review created:', data)
            if (!data.id) {
                throw new Error('Invalid response format from server')
            }

            navigate(`/reviews/${data.id}`)
        } catch (error) {
            console.error('Error creating review:', error)
            alert(`Error creating review: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <ThemeProvider theme={darkTheme}>
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 4,
                    backgroundColor: 'background.default'
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', mb: 4 }}>
                    Review Options
                </Typography>

                <Paper
                    elevation={3}
                    sx={{
                        width: '100%',
                        maxWidth: '800px',
                        backgroundColor: 'background.paper',
                        borderRadius: 2,
                        p: 4
                    }}
                >
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Review Title"
                            variant="outlined"
                            fullWidth
                            required
                            value={formData.title}
                            onChange={handleInputChange('title')}
                        />

                        <TextField
                            label="Description"
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={4}
                            required
                            value={formData.description}
                            onChange={handleInputChange('description')}
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
                                            const newUrl = e.target.value;
                                            handleAltLinkChange(index, 'url')({
                                                ...e,
                                                target: {
                                                    ...e.target,
                                                    value: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`
                                                }
                                            });
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
                    </Box>
                </Paper>
            </Box>
        </ThemeProvider>
    )
}