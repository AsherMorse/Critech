import { Box, Typography, Paper, ThemeProvider, createTheme, Button, Divider } from '@mui/material'
import { PlayArrow } from '@mui/icons-material'
import { useLocation, Navigate, useNavigate } from 'react-router-dom'
import TranscriptionStatus from '../components/video/TranscriptionStatus'
import SummaryViewer from '../components/video/SummaryViewer'
import { useState } from 'react'

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
    const [isTranscriptionComplete, setIsTranscriptionComplete] = useState(false)

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

                    <Box sx={{ p: 3 }}>
                        {/* Transcription Status */}
                        <TranscriptionStatus
                            videoId={state.videoId}
                            onTranscriptionComplete={() => setIsTranscriptionComplete(true)}
                        />

                        {/* Summary (only show when transcription is complete) */}
                        {isTranscriptionComplete && (
                            <>
                                <Divider sx={{ my: 3 }} />
                                <SummaryViewer videoId={state.videoId} />
                            </>
                        )}

                        {/* Action Buttons */}
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<PlayArrow />}
                                onClick={() => navigate('/review-options', { state: { videoId: state.videoId } })}
                                disabled={!isTranscriptionComplete}
                                sx={{
                                    minWidth: '200px',
                                    fontSize: '1.1rem',
                                    textTransform: 'none',
                                    '&.Mui-disabled': {
                                        backgroundColor: 'rgba(30, 136, 229, 0.3)',
                                        color: 'rgba(255, 255, 255, 0.5)'
                                    }
                                }}
                            >
                                {isTranscriptionComplete ? 'Start Review' : 'Waiting for Transcription...'}
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
                    </Box>
                </Paper>
            </Box>
        </ThemeProvider>
    )
}