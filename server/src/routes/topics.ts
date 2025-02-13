import { Router } from 'express'
import { RequestHandler } from 'express'
import topicsController from '../controllers/topics.controller'
import { verifyAuth } from '../middleware/auth'

const router = Router()

// Apply auth middleware to all routes
// router.use(verifyAuth as RequestHandler)

// POST /topics - Create a new topic
router.post('/', topicsController.createTopic)

// GET /topics - Get all topics
router.get('/', topicsController.getAllTopics)

// GET /topics/:id - Get a single topic by ID
router.get('/:id', topicsController.getTopicById)

// PUT /topics/:id - Update a topic
router.put('/:id', topicsController.updateTopic)

// DELETE /topics/:id - Delete a topic
router.delete('/:id', topicsController.deleteTopic)

// POST /topics/initialize - Initialize topics from existing tags
router.post('/initialize', topicsController.initializeTopics)

export default router 