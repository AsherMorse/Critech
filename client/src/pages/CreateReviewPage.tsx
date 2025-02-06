import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Paper, ThemeProvider, createTheme, CircularProgress } from '@mui/material'
import { CloudUpload } from '@mui/icons-material'

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
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!['video/mp4', 'video/quicktime', 'video/x-msvideo'].includes(file.type)) {
      setError('Please select a valid video file (MP4, MOV, or AVI)')
      return
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('video', file)

      const xhr = new XMLHttpRequest()
      const apiUrl = '/api/videos/upload'
      const fullUrl = import.meta.env.VITE_API_URL + apiUrl

      xhr.open('POST', fullUrl, true)
      xhr.setRequestHeader('Accept', 'application/json')

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Upload is 50% of the total progress
          const progress = Math.round((event.loaded * 50) / event.total)
          setUploadProgress(progress)
        }
      }

      xhr.onload = () => {
        try {
          // Handle empty response
          if (!xhr.responseText) {
            setError('Server returned an empty response. Please try again.')
            setIsUploading(false)
            setUploadProgress(0)
            return
          }

          // Handle 405 Method Not Allowed specifically
          if (xhr.status === 405) {
            setError('Server configuration error: Upload method not allowed. Please contact support.')
            setIsUploading(false)
            setUploadProgress(0)
            return
          }

          const response = JSON.parse(xhr.responseText)

          if (xhr.status === 201) {
            // Set to 100% when complete
            setUploadProgress(100)

            // Wait a moment to show 100% before navigating
            setTimeout(() => {
              const videoData = {
                videoUrl: response.video.videoUrl,
                videoId: response.video.id
              }

              navigate('/video-preview', {
                state: videoData
              })
            }, 500)
          } else {
            const errorMessage = response.error || 'Upload failed. Please try again.'
            setError(errorMessage)
            setIsUploading(false)
            setUploadProgress(0)
          }
        } catch (parseError) {
          setError('Server response error. Please try again.')
          setIsUploading(false)
          setUploadProgress(0)
        }
      }

      xhr.onerror = () => {
        setError('Network error. Please check your connection and try again.')
        setIsUploading(false)
        setUploadProgress(0)
      }

      xhr.send(formData)
    } catch (err) {
      setError('Failed to upload video. Please try again.')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Paper
          elevation={2}
          sx={{
            width: '100%',
            maxWidth: '600px',
            p: 4,
            borderRadius: '16px',
            bgcolor: 'background.paper'
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}
          >
            Upload Video
          </Typography>

          <label htmlFor="video-upload">
            <Box
              sx={{
                border: '2px dashed',
                borderColor: error ? 'error.main' : 'primary.main',
                borderRadius: '12px',
                p: 4,
                mb: 2,
                textAlign: 'center',
                cursor: isUploading ? 'default' : 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                '&:hover': {
                  borderColor: error ? 'error.main' : 'primary.light',
                  bgcolor: error ? 'error.dark' : 'rgba(30, 136, 229, 0.04)'
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                id="video-upload"
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={isUploading}
              />

              {isUploading ? (
                <>
                  <CircularProgress
                    variant="determinate"
                    value={uploadProgress}
                    size={60}
                    thickness={4}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Uploading... {uploadProgress}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please don't close this window
                  </Typography>
                </>
              ) : (
                <>
                  <CloudUpload
                    sx={{
                      fontSize: 48,
                      color: error ? 'error.main' : 'primary.main',
                      mb: 2
                    }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Drag and drop your video here
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or click to select a file
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Supported formats: MP4, MOV, AVI (max 100MB)
                  </Typography>
                </>
              )}
            </Box>
          </label>

          {error && (
            <Typography
              color="error"
              variant="body2"
              sx={{ textAlign: 'center', mt: 2 }}
            >
              {error}
            </Typography>
          )}
        </Paper>
      </Box>
    </ThemeProvider>
  )
}