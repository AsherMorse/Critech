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
    Divider
} from '@mui/material'
import { useLocation, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

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

interface AltLink {
    name: string;
    url: string;
}

interface ReviewData {
    title: string;
    description: string;
    videoId: string;
    pros: string[];
    cons: string[];
    altLinks: AltLink[];
}

export default function ReviewOptionsPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useAuth()
    const state = location.state as LocationState
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<ReviewData>({
        title: '',
        description: '',
        videoId: state?.videoId || '',
        pros: [''],
        cons: [''],
        altLinks: [{ name: '', url: '' }]
    })

    // Redirect to dashboard if no videoId is provided
    if (!state?.videoId) {
        return <Navigate to="/dashboard" replace />
    }

    const handleInputChange =
        (field: keyof ReviewData) =>
            (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setFormData(prev => ({
                    ...prev,
                    [field]: event.target.value
                }))
            }

    const handleArrayChange = (
        field: 'pros' | 'cons',
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

    const addArrayItem = (field: 'pros' | 'cons') => () => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }))
    }

    const removeArrayItem = (field: 'pros' | 'cons', index: number) => () => {
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

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setIsLoading(true)

        // Filter out empty values
        const cleanedData = {
            ...formData,
            pros: formData.pros.filter(pro => pro.trim() !== ''),
            cons: formData.cons.filter(con => con.trim() !== ''),
            altLinks: formData.altLinks.filter(link => link.name.trim() !== '' && link.url.trim() !== '')
        }

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}/api/reviews/from-video`
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${user?.access_token}`
                },
                body: JSON.stringify({
                    videoId: Number(cleanedData.videoId),
                    title: cleanedData.title,
                    description: cleanedData.description,
                    pros: cleanedData.pros,
                    cons: cleanedData.cons,
                    altLinks: cleanedData.altLinks
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

            navigate(`/review/${data.id}`)
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

                        <Typography variant="h6" gutterBottom>
                            Pros
                        </Typography>
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
                        {formData.altLinks.map((link, index) => (
                            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                    label="Link Name"
                                    variant="outlined"
                                    sx={{ flex: 1 }}
                                    value={link.name}
                                    onChange={handleAltLinkChange(index, 'name')}
                                />
                                <TextField
                                    label="URL"
                                    variant="outlined"
                                    sx={{ flex: 2 }}
                                    value={link.url}
                                    onChange={handleAltLinkChange(index, 'url')}
                                />
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