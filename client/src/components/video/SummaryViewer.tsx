import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Collapse,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface SummaryViewerProps {
    videoId: string;
}

interface TranscriptData {
    transcript: string;
    summary: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

export default function SummaryViewer({ videoId }: SummaryViewerProps) {
    const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                console.log('SummaryViewer: Starting fetch for videoId:', videoId);
                setLoading(true);
                const response = await fetch(`/api/videos/${videoId}/transcript`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                console.log('SummaryViewer: Response status:', response.status);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('SummaryViewer: Error response:', errorText);
                    throw new Error('Failed to fetch summary');
                }
                const data = await response.json();
                console.log('SummaryViewer: Successfully fetched data');
                setTranscriptData(data);
            } catch (err) {
                console.error('SummaryViewer: Fetch error:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [videoId, token]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!transcriptData || !transcriptData.summary) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                No summary available yet.
            </Alert>
        );
    }

    return (
        <Paper
            elevation={2}
            sx={{
                mt: 2,
                backgroundColor: theme => theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff'
            }}
        >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" component="div">
                        Review Summary
                    </Typography>
                    <IconButton
                        onClick={() => setIsExpanded(!isExpanded)}
                        size="small"
                    >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
            </Box>

            <Collapse in={isExpanded}>
                <Box
                    sx={{
                        p: 2,
                        '& p': {
                            mt: 1,
                            mb: 1,
                            '&:first-of-type': {
                                mt: 0
                            },
                            '&:last-child': {
                                mb: 0
                            }
                        }
                    }}
                >
                    <Typography
                        component="div"
                        sx={{
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            color: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : 'inherit'
                        }}
                    >
                        {transcriptData.summary.split('\n').map((paragraph, index) => (
                            <Typography
                                key={index}
                                component="div"
                                sx={{
                                    mt: index === 0 ? 0 : 1,
                                    mb: index === transcriptData.summary.split('\n').length - 1 ? 0 : 1
                                }}
                            >
                                {paragraph}
                            </Typography>
                        ))}
                    </Typography>
                </Box>
            </Collapse>
        </Paper>
    );
} 