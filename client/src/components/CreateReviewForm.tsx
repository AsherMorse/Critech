import { Box, TextField, Button, Typography, useMediaQuery, Paper } from '@mui/material'
import { useState } from 'react'

export default function CreateReviewForm() {
  const isMobile = useMediaQuery('(max-width:600px)')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Handle review submission
    console.log({ title, description })
  }

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ 
        width: '100%',
        maxWidth: '600px',
        mx: 'auto',
        p: isMobile ? 2 : 4
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
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          gutterBottom 
          sx={{ mb: 3, fontWeight: 600 }}
        >
          Create Review
        </Typography>

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
  )
} 