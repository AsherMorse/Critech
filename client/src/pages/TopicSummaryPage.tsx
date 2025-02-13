import { Box, Typography, Paper, ThemeProvider, createTheme, CircularProgress, IconButton, Chip, Divider } from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'

interface MarketTrend {
  trend: string;
  description: string;
}

interface MarketSummary {
  summary: string;
  overallPros: string[];
  overallCons: string[];
  marketTrends: MarketTrend[];
  recommendedAudience: string[];
  lastUpdated: string;
}

interface Topic {
  id: number;
  name: string;
  description: string;
  marketSummary: MarketSummary | null;
  createdAt: string;
  updatedAt: string;
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

export default function TopicSummaryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopic = async () => {
      if (!id || !token) return

      try {
        const response = await fetch(`/api/topics/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch topic')
        }

        const data = await response.json()
        setTopic(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch topic')
      } finally {
        setLoading(false)
      }
    }

    fetchTopic()
  }, [id, token])

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    )
  }

  if (error || !topic) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          p: 2
        }}>
          <Typography color="error" variant="h6">
            {error || 'Topic not found'}
          </Typography>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 4
      }}>
        {/* Header */}
        <Paper
          elevation={2}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            borderRadius: 0,
            mb: 2
          }}
        >
          <Box sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <IconButton
              onClick={() => navigate(-1)}
              edge="start"
              aria-label="back"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="h1" noWrap>
              {topic.name}
            </Typography>
          </Box>
        </Paper>

        {/* Content */}
        <Box sx={{ px: 2, maxWidth: 800, mx: 'auto' }}>
          {/* Description */}
          {topic.description && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="body1" color="text.secondary">
                {topic.description}
              </Typography>
            </Paper>
          )}

          {/* Market Summary */}
          {topic?.marketSummary?.lastUpdated ? (
            <>
              {/* Overview */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Market Overview
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {topic.marketSummary?.summary}
                </Typography>
              </Paper>

              {/* Pros & Cons */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Overall Analysis
                </Typography>
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                  <Box>
                    <Typography variant="subtitle1" color="success.main" gutterBottom>
                      Pros
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {topic.marketSummary?.overallPros.map((pro, index) => (
                        <Chip
                          key={index}
                          label={pro}
                          color="success"
                          variant="outlined"
                          sx={{ justifyContent: 'flex-start', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 1 } }}
                        />
                      ))}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" color="error.main" gutterBottom>
                      Cons
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {topic.marketSummary?.overallCons.map((con, index) => (
                        <Chip
                          key={index}
                          label={con}
                          color="error"
                          variant="outlined"
                          sx={{ justifyContent: 'flex-start', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 1 } }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Market Trends */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Market Trends
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {topic.marketSummary?.marketTrends.map((trend, index) => (
                    <Box key={index}>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        {trend.trend}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {trend.description}
                      </Typography>
                      {index < (topic.marketSummary?.marketTrends.length || 0) - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Target Audience */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recommended For
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {topic.marketSummary?.recommendedAudience.map((audience, index) => (
                    <Chip
                      key={index}
                      label={audience}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>

              {/* Last Updated */}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                Last updated: {new Date(topic.marketSummary.lastUpdated).toLocaleDateString()}
              </Typography>
            </>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No market summary available yet.
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  )
} 