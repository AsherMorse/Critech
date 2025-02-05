import { Box, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

export default function HomeView() {
  const { user } = useAuth()

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      p: 2
    }}>
      <Typography variant="h5" gutterBottom>
        Welcome, {user?.email}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Your dashboard content will go here
      </Typography>
    </Box>
  )
} 