import { Box, Typography, Button, useMediaQuery } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export default function CreateView() {
  const isMobile = useMediaQuery('(max-width:600px)')
  const navigate = useNavigate()

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      p: isMobile ? 2 : 4
    }}>
      <Typography variant="h5" gutterBottom>
        Create New
      </Typography>
      
      <Button
        variant="contained"
        size="large"
        startIcon={<Add />}
        fullWidth={isMobile}
        onClick={() => navigate('/create-review')}
        sx={{
          py: 2,
          px: isMobile ? 3 : 6,
          borderRadius: '12px',
          fontSize: '1.1rem',
          textTransform: 'none',
          bgcolor: 'primary.dark',
          '&:hover': {
            bgcolor: 'primary.main'
          },
          maxWidth: isMobile ? 'none' : '400px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        Create Review
      </Button>
    </Box>
  )
} 