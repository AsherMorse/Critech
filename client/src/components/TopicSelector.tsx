import { useState, useEffect } from 'react'
import { Add as AddIcon } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
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
  Alert,
  SelectChangeEvent
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
  const { token } = useAuth()
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
      console.log('Fetching topics with token:', token ? `${token.substring(0, 10)}...` : 'missing')
      const response = await fetch('/api/topics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      console.log('Topics fetch response status:', response.status)

      // Log response headers
      const headers = Object.fromEntries(response.headers.entries());
      console.log('Response headers:', headers);

      // Get the raw response text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status} ${response.statusText}\nResponse: ${responseText}`)
      }

      // Try to parse the response text as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed topics data:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      setTopics(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching topics:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
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

  const handleAddTopic = async () => {
    try {
      console.log('Adding new topic:', newTopic)
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTopic),
      })

      console.log('Add topic response status:', response.status)
      if (!response.ok) {
        throw new Error('Failed to create topic')
      }

      const createdTopic = await response.json()
      console.log('Created topic:', createdTopic)
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
      console.error('Error creating topic:', err)
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

  const handleChange = (event: SelectChangeEvent<number | ''>) => {
    console.log('Select change event:', {
      value: event.target.value,
      type: typeof event.target.value
    })

    const newValue = event.target.value;
    // Convert empty string to undefined, otherwise use the number value
    const topicId = newValue === '' ? undefined : Number(newValue)
    console.log('Converted topicId:', topicId)
    onChange(topicId)
  }

  console.log('TopicSelector render:', {
    currentValue: value,
    topicsCount: topics.length,
    loading,
    error
  })

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
          onChange={handleChange}
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