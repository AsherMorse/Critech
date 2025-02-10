import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Collapse,
    CircularProgress,
    Alert,
    InputAdornment,
} from '@mui/material';
import {
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface TranscriptViewerProps {
    videoId: string;
    maxHeight?: string | number;
}

interface TranscriptData {
    transcript: string;
    summary: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

export default function TranscriptViewer({ videoId, maxHeight = '500px' }: TranscriptViewerProps) {
    const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchTranscript = async () => {
            try {
                console.log('TranscriptViewer: Starting fetch for videoId:', videoId);
                setLoading(true);
                const response = await fetch(`/api/videos/${videoId}/transcript`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                console.log('TranscriptViewer: Response status:', response.status);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('TranscriptViewer: Error response:', errorText);
                    throw new Error('Failed to fetch transcript');
                }
                const data = await response.json();
                console.log('TranscriptViewer: Successfully fetched data');
                setTranscriptData(data);
            } catch (err) {
                console.error('TranscriptViewer: Fetch error:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchTranscript();
    }, [videoId, token]);

    const highlightSearchResults = (text: string) => {
        if (!searchQuery.trim()) return text;

        const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
                <mark key={i} style={{ backgroundColor: '#ffd54f', padding: 0 }}>{part}</mark>
            ) : part
        );
    };

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

    if (!transcriptData || !transcriptData.transcript) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                No transcript available yet.
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
                        Transcript
                    </Typography>
                    <IconButton
                        onClick={() => setIsExpanded(!isExpanded)}
                        size="small"
                    >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>

                <Collapse in={isExpanded}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search transcript..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ mt: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Collapse>
            </Box>

            <Collapse in={isExpanded}>
                <Box
                    sx={{
                        p: 2,
                        maxHeight,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#888',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: '#555',
                        },
                    }}
                >
                    <Typography
                        component="div"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                        }}
                    >
                        {highlightSearchResults(transcriptData.transcript)}
                    </Typography>
                </Box>
            </Collapse>
        </Paper>
    );
} 