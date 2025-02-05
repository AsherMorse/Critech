import { Box, Button, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

export default function ProfileView() {
  const { user, signOut } = useAuth()

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      p: 2
    }}>
      <Typography variant="h5" gutterBottom>
        Profile
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {user?.email}
      </Typography>
      <Button 
        variant="contained" 
        color="primary"
        onClick={signOut}
        sx={{
          mt: 2,
          py: 1.5,
          px: 4,
          bgcolor: 'primary.dark',
          '&:hover': {
            bgcolor: 'primary.main'
          }
        }}
      >
        Sign Out
      </Button>
    </Box>
  )
} 