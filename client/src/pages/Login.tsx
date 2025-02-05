import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper,
  IconButton,
  InputAdornment,
  ThemeProvider,
  createTheme,
  useMediaQuery
} from '@mui/material'
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1e88e5', // Darker blue
      dark: '#1565c0',
      light: '#42a5f5'
    },
    secondary: {
      main: '#f48fb1'
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1.1rem',
          padding: '10px 0',
          borderRadius: '8px'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    }
  }
})

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn } = useAuth()
  const isMobile = useMediaQuery('(max-width:600px)')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await signIn(email, password)
    if (error) {
      console.error('Login error:', error.message)
    }
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Container component="main" maxWidth="xs" disableGutters={isMobile}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: isMobile ? 2 : 0
          }}
        >
          <Paper
            elevation={6}
            sx={{
              width: '100%',
              p: isMobile ? 3 : 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'background.paper',
              borderRadius: isMobile ? '16px' : 2,
              boxShadow: isMobile ? 'none' : undefined
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.main',
                borderRadius: '50%',
                mb: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              <LockOutlined sx={{ color: 'background.paper', fontSize: 28 }} />
            </Box>

            <Typography 
              component="h1" 
              variant={isMobile ? "h4" : "h5"} 
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Sign In
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 2,
                  mb: 3,
                  py: 1.5,
                  bgcolor: 'primary.dark',
                  '&:hover': {
                    bgcolor: 'primary.main'
                  }
                }}
              >
                Sign In
              </Button>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography 
                    variant="body1" 
                    color="primary.light"
                    sx={{ 
                      '&:hover': { 
                        color: 'primary.main' 
                      },
                      transition: 'color 0.2s'
                    }}
                  >
                    Don't have an account? Sign Up
                  </Typography>
                </Link>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  )
} 