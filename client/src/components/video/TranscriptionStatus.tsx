import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useVideoStatus } from '../../hooks/useVideoStatus';

interface TranscriptionStatusProps {
    videoId: string;
    onTranscriptionComplete?: () => void;
}

export default function TranscriptionStatus({ videoId, onTranscriptionComplete }: TranscriptionStatusProps) {
    const { status, error, loading } = useVideoStatus(videoId, {
        onComplete: onTranscriptionComplete
    });

    if (loading && !status) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <CircularProgress size={20} />
                <Typography>Checking transcription status...</Typography>
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

    if (!status) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                Unable to get transcription status.
            </Alert>
        );
    }

    const getStatusMessage = () => {
        const { transcription } = status.status;
        switch (transcription) {
            case 'pending':
                return 'Waiting to start transcription...';
            case 'processing':
                return 'Transcribing video...';
            case 'completed':
                return 'Transcription completed';
            case 'failed':
                return 'Transcription failed';
            default:
                return 'Unknown status';
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            {status.status.transcription !== 'completed' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography>{getStatusMessage()}</Typography>
                </Box>
            )}
            {status.status.transcription === 'completed' && (
                <Alert severity="success">
                    Transcription completed successfully
                </Alert>
            )}
            {status.status.transcription === 'failed' && (
                <Alert severity="error">
                    Failed to transcribe video. Please try again later.
                </Alert>
            )}
        </Box>
    );
} 