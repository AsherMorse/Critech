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
import { Visibility, VisibilityOff, PersonAddOutlined } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1e88e5',
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

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { signUp } = useAuth()
  const isMobile = useMediaQuery('(max-width:600px)')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      console.error('Passwords do not match')
      return
    }
    const { error } = await signUp(email, password)
    if (error) {
      console.error('Registration error:', error.message)
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
              <PersonAddOutlined sx={{ color: 'background.paper', fontSize: 28 }} />
            </Box>

            <Typography 
              component="h1" 
              variant={isMobile ? "h4" : "h5"} 
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Create Account
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
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                Sign Up
              </Button>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
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
                    Already have an account? Sign In
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