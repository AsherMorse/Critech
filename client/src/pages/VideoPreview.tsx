import { Box, Typography, Paper, ThemeProvider, createTheme, Button } from '@mui/material'
import { PlayArrow } from '@mui/icons-material'
import { useLocation, Navigate, useNavigate } from 'react-router-dom'

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
    videoId: string;
}

export default function VideoPreview() {
    const location = useLocation()
    const navigate = useNavigate()
    const state = location.state as LocationState

    // Redirect to dashboard if no video URL is provided
    if (!state?.videoUrl) {
        return <Navigate to="/dashboard" replace />
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
                    Video Preview
                </Typography>

                <Paper
                    elevation={3}
                    sx={{
                        width: '100%',
                        maxWidth: '1000px',
                        backgroundColor: 'background.paper',
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        component="video"
                        controls
                        autoPlay
                        src={state.videoUrl}
                        sx={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '560px',
                            backgroundColor: '#000'
                        }}
                    >
                        <Typography sx={{ color: 'white', p: 2 }}>
                            Your browser does not support the video tag.
                        </Typography>
                    </Box>

                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<PlayArrow />}
                            onClick={() => navigate('/review-options', { state: { videoId: state.videoId } })}
                            sx={{
                                minWidth: '200px',
                                fontSize: '1.1rem',
                                textTransform: 'none'
                            }}
                        >
                            Start Review
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/dashboard')}
                            sx={{
                                minWidth: '150px',
                                fontSize: '1.1rem',
                                textTransform: 'none'
                            }}
                        >
                            Back
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </ThemeProvider>
    )
}