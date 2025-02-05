import { Box, Typography, ThemeProvider, createTheme, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    }
  }
})

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <ThemeProvider theme={darkTheme}>
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          bgcolor: 'background.default'
        }}
      >
        <Typography 
          variant="h1" 
          sx={{ 
            fontWeight: 700,
            color: 'text.primary'
          }}
        >
          404
        </Typography>
        <Button 
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
          sx={{
            py: 1.5,
            px: 4,
            bgcolor: 'primary.dark',
            '&:hover': {
              bgcolor: 'primary.main'
            }
          }}
        >
          Go Home
        </Button>
      </Box>
    </ThemeProvider>
  )
} 