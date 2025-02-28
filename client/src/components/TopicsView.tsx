import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Analytics as AnalyticsIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

interface Topic {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export function TopicsView() {
  const { token } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const navigate = useNavigate()
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const fetchTopics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/topics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch topics')
      const data = await response.json()
      setTopics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchTopics()
    }
  }, [token])

  const handleOpenDialog = (topic?: Topic) => {
    if (topic) {
      setEditingTopic(topic)
      setFormData({ name: topic.name, description: topic.description })
    } else {
      setEditingTopic(null)
      setFormData({ name: '', description: '' })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTopic(null)
    setFormData({ name: '', description: '' })
  }

  const handleSubmit = async () => {
    try {
      const url = editingTopic
        ? `${API_URL}/api/topics/${editingTopic.id}`
        : `${API_URL}/api/topics`

      const response = await fetch(url, {
        method: editingTopic ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save topic')

      await fetchTopics()
      handleCloseDialog()
      setSnackbar({
        open: true,
        message: `Topic successfully ${editingTopic ? 'updated' : 'created'}`,
        severity: 'success'
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to save topic',
        severity: 'error'
      })
    }
  }

  const handleDelete = async (topic: Topic) => {
    if (!window.confirm(`Are you sure you want to delete "${topic.name}"?`)) return

    try {
      const response = await fetch(`${API_URL}/api/topics/${topic.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete topic')

      await fetchTopics()
      setSnackbar({
        open: true,
        message: 'Topic successfully deleted',
        severity: 'success'
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to delete topic',
        severity: 'error'
      })
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mb: 3
      }}>
        <Typography variant="h5" component="h1">
          Topics
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          fullWidth={false}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Topic
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          maxWidth: '100%',
          overflowX: 'auto',
          '& .MuiTableCell-root': {
            px: { xs: 1, sm: 2 },
            py: { xs: 1.5, sm: 2 },
            whiteSpace: { xs: 'normal', sm: 'nowrap' },
            minWidth: {
              xs: '80px',
              sm: 'auto'
            }
          }
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Created</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topics.map((topic) => (
              <TableRow key={topic.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {topic.name}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: { xs: 'block', md: 'none' },
                        fontSize: '0.75rem'
                      }}
                    >
                      {topic.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: { xs: 'block', sm: 'none' } }}
                    >
                      Created: {new Date(topic.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {topic.description}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {new Date(topic.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {new Date(topic.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'flex-end',
                    flexWrap: 'nowrap'
                  }}>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/topics/${topic.id}`)}
                      title="View Summary"
                      color="primary"
                    >
                      <AnalyticsIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(topic)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(topic)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {topics.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No topics found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingTopic ? 'Edit Topic' : 'Add New Topic'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleCloseDialog}
            fullWidth
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name}
            fullWidth
          >
            {editingTopic ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}