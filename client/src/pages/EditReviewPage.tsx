import { useState, useEffect } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { Box, Typography, TextField, Button, IconButton, Paper, ThemeProvider, createTheme, CircularProgress } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
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
}

export default function EditReviewPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<ReviewData>({
        title: '',
        description: '',
        pros: [''],
        cons: [''],
        altLinks: [{ name: '', url: '' }]
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
                        'Authorization': `Bearer ${user?.access_token}`,
                        'Accept': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch review data')
                }

                const data = await response.json()
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    pros: data.pros || [''],
                    cons: data.cons || [''],
                    altLinks: data.altLinks || [{ name: '', url: '' }]
                })
            } catch (error) {
                console.error('Error fetching review:', error)
                setError('Failed to load review data. Please try again.')
            } finally {
                setIsLoading(false)
            }
        }
        fetchReviewData()
    }, [id, user])

    const handleInputChange =
        (field: keyof ReviewData) =>
            (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setFormData(prev => ({
                    ...prev,
                    [field]: event.target.value
                }))
            }

    const handleArrayChange =
        (field: 'pros' | 'cons', index: number) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setFormData(prev => ({
                    ...prev,
                    [field]: prev[field].map((item, i) =>
                        i === index ? event.target.value : item
                    )
                }))
            }

    const addArrayItem = (field: 'pros' | 'cons') => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }))
    }

    const removeArrayItem = (field: 'pros' | 'cons', index: number) => {
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
            )
        }

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}/api/reviews/${id}`
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${user?.access_token}`
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                }}
            >
                <Paper
                    elevation={2}
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        width: '100%',
                        maxWidth: '800px',
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

                    <TextField
                        label="Title"
                        value={formData.title}
                        onChange={handleInputChange('title')}
                        required
                        fullWidth
                        error={!!error}
                    />

                    <TextField
                        label="Description"
                        value={formData.description}
                        onChange={handleInputChange('description')}
                        multiline
                        rows={4}
                        required
                        fullWidth
                        error={!!error}
                    />

                    {/* Pros Section */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Pros
                        </Typography>
                        {formData.pros.map((pro, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    mb: 1
                                }}
                            >
                                <TextField
                                    value={pro}
                                    onChange={handleArrayChange('pros', index)}
                                    fullWidth
                                    placeholder={`Pro ${index + 1}`}
                                    error={!!error}
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
                        >
                            Add Pro
                        </Button>
                    </Box>

                    {/* Cons Section */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Cons
                        </Typography>
                        {formData.cons.map((con, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    mb: 1
                                }}
                            >
                                <TextField
                                    value={con}
                                    onChange={handleArrayChange('cons', index)}
                                    fullWidth
                                    placeholder={`Con ${index + 1}`}
                                    error={!!error}
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
                        >
                            Add Con
                        </Button>
                    </Box>

                    {/* Alternative Links Section */}
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Alternative Links
                        </Typography>
                        {formData.altLinks.map((link, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    mb: 1
                                }}
                            >
                                <TextField
                                    value={link.name}
                                    onChange={handleAltLinkChange(index, 'name')}
                                    placeholder="Link Name"
                                    sx={{ flex: 1 }}
                                    error={!!error}
                                />
                                <TextField
                                    value={link.url}
                                    onChange={handleAltLinkChange(index, 'url')}
                                    placeholder="URL"
                                    sx={{ flex: 2 }}
                                    error={!!error}
                                />
                                <IconButton
                                    onClick={() => removeAltLink(index)}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                        <Button startIcon={<AddIcon />} onClick={addAltLink}>
                            Add Alternative Link
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/dashboard')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </ThemeProvider>
    )
}
