import { useState, useEffect } from 'react'
import { Add as AddIcon } from '@mui/icons-material'
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Snackbar,
  Alert
} from '@mui/material'

interface Topic {
  id: number
  name: string
  description: string
}

interface TopicSelectorProps {
  value?: number
  onChange: (topicId: number | undefined) => void
  className?: string
}

export function TopicSelector({ value, onChange }: TopicSelectorProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTopic, setNewTopic] = useState({ name: '', description: '' })
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics')
      if (!response.ok) {
        throw new Error('Failed to fetch topics')
      }
      const data = await response.json()
      setTopics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopics()
  }, [])

  const handleAddTopic = async () => {
    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTopic),
      })

      if (!response.ok) {
        throw new Error('Failed to create topic')
      }

      const createdTopic = await response.json()
      setTopics([...topics, createdTopic])
      onChange(createdTopic.id)
      setNewTopic({ name: '', description: '' })
      setIsDialogOpen(false)
      setSnackbar({
        open: true,
        message: `Successfully created topic "${createdTopic.name}"`,
        severity: 'success'
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to create topic',
        severity: 'error'
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  if (loading) {
    return <div>Loading topics...</div>
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Topic</InputLabel>
        <Select
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          label="Topic"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {topics.map((topic) => (
            <MenuItem key={topic.id} value={topic.id}>
              {topic.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <IconButton
        onClick={() => setIsDialogOpen(true)}
        size="small"
        sx={{ mt: 1 }}
      >
        <AddIcon />
      </IconButton>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Add New Topic</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={newTopic.name}
              onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
              placeholder="Enter topic name"
              fullWidth
            />
            <TextField
              label="Description"
              value={newTopic.description}
              onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
              placeholder="Enter topic description"
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddTopic}
            disabled={!newTopic.name}
            variant="contained"
          >
            Add Topic
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 