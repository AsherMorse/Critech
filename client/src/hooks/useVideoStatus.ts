import { useState, useEffect } from 'react';

export interface VideoStatus {
    status: {
        video: string;
        transcription: 'pending' | 'processing' | 'completed' | 'failed';
        overall: 'processing' | 'completed';
    };
    urls: {
        video: string;
        thumbnail?: string;
    };
}

interface UseVideoStatusOptions {
    pollingInterval?: number;
    onComplete?: () => void;
    stopPollingOn?: ('completed' | 'failed')[];
}

interface UseVideoStatusResult {
    status: VideoStatus | null;
    error: string | null;
    loading: boolean;
    refetch: () => Promise<void>;
}

export function useVideoStatus(
    videoId: string,
    options: UseVideoStatusOptions = {}
): UseVideoStatusResult {
    const {
        pollingInterval = 5000,
        onComplete,
        stopPollingOn = ['completed', 'failed']
    } = options;

    const [status, setStatus] = useState<VideoStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const response = await fetch(`/api/videos/${videoId}/status`);
            if (!response.ok) {
                throw new Error('Failed to fetch video status');
            }
            const data = await response.json();
            setStatus(data);

            // Call onComplete callback if status is completed
            if (data.status.overall === 'completed' && onComplete) {
                onComplete();
            }

            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An error occurred';
            setError(message);
            throw err;
        }
    };

    const refetch = async () => {
        setLoading(true);
        try {
            await fetchStatus();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        let pollTimer: NodeJS.Timeout | null = null;

        const pollStatus = async () => {
            try {
                const data = await fetchStatus();

                if (!mounted) return;

                // Check if we should stop polling
                const shouldStopPolling = stopPollingOn.includes(data.status.transcription);

                // Schedule next poll if needed
                if (!shouldStopPolling) {
                    pollTimer = setTimeout(pollStatus, pollingInterval);
                }
            } catch (err) {
                if (mounted) {
                    // On error, retry after the polling interval
                    pollTimer = setTimeout(pollStatus, pollingInterval);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        // Start polling
        pollStatus();

        // Cleanup
        return () => {
            mounted = false;
            if (pollTimer) {
                clearTimeout(pollTimer);
            }
        };
    }, [videoId, pollingInterval, onComplete, stopPollingOn.join(',')]);

    return {
        status,
        error,
        loading,
        refetch
    };
} 