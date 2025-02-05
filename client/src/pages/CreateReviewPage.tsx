import { Box, TextField, Button, Typography, useMediaQuery, Paper, ThemeProvider, createTheme } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

export default function CreateReviewPage() {
  const isMobile = useMediaQuery('(max-width:600px)')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Handle review submission
    console.log({ title, description })
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: 'background.default',
          overflow: 'auto'
        }}
      >
        <Box 
          component="form" 
          onSubmit={handleSubmit}
          sx={{ 
            width: '100%',
            maxWidth: '600px',
            mx: 'auto',
            p: isMobile ? 2 : 4,
            boxSizing: 'border-box'
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: isMobile ? 3 : 4,
              borderRadius: isMobile ? '16px' : '8px',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button
                onClick={() => navigate(-1)}
                sx={{ 
                  mr: 2,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'transparent' }
                }}
              >
                Cancel
              </Button>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                sx={{ fontWeight: 600 }}
              >
                Create Review
              </Typography>
            </Box>

            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              sx={{ mb: 3 }}
              InputProps={{
                sx: {
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-input': {
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    p: isMobile ? '14px' : '16px'
                  }
                }
              }}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              required
              multiline
              rows={6}
              sx={{ mb: 4 }}
              InputProps={{
                sx: {
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-input': {
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    lineHeight: '1.5'
                  }
                }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                py: 1.5,
                borderRadius: '8px',
                fontSize: isMobile ? '1rem' : '1.1rem',
                textTransform: 'none',
                bgcolor: 'primary.dark',
                '&:hover': {
                  bgcolor: 'primary.main'
                }
              }}
            >
              Create Review
            </Button>
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  )
} 