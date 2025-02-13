import { Request, Response } from 'express'
import { BaseController } from './base.controller'
import { topicsService, CreateTopicDto, UpdateTopicDto } from '../services/topics.service'
import { ApiError } from '../middleware/error-handler'

class TopicsController extends BaseController {
  constructor() {
    super()
    // Bind methods to maintain correct 'this' context
    this.createTopic = this.createTopic.bind(this)
    this.getAllTopics = this.getAllTopics.bind(this)
    this.getTopicById = this.getTopicById.bind(this)
    this.updateTopic = this.updateTopic.bind(this)
    this.deleteTopic = this.deleteTopic.bind(this)
    this.initializeTopics = this.initializeTopics.bind(this)
  }

  // Create a new topic
  createTopic = this.handleAsync(async (req: Request<{}, any, CreateTopicDto>, res: Response) => {
    // Validate required fields
    this.validateRequiredFields(req.body, ['name'])

    // Create topic
    const topic = await topicsService.createTopic(req.body)
    res.status(201).json(topic)
  })

  // Get all topics
  getAllTopics = this.handleAsync(async (req: Request, res: Response) => {
    const topics = await topicsService.getAllTopics()
    res.json(topics)
  })

  // Get a single topic by ID
  getTopicById = this.handleAsync(async (req: Request<{ id: string }>, res: Response) => {
    const id = this.validateId(req.params.id)
    const topic = await topicsService.getTopicById(id)

    if (!topic) {
      throw new ApiError(404, 'Topic not found')
    }

    res.json(topic)
  })

  // Update a topic
  updateTopic = this.handleAsync(async (req: Request<{ id: string }, any, UpdateTopicDto>, res: Response) => {
    const id = this.validateId(req.params.id)
    const topic = await topicsService.updateTopic(id, req.body)

    if (!topic) {
      throw new ApiError(404, 'Topic not found')
    }

    res.json(topic)
  })

  // Delete a topic
  deleteTopic = this.handleAsync(async (req: Request<{ id: string }>, res: Response) => {
    const id = this.validateId(req.params.id)
    const topic = await topicsService.deleteTopic(id)

    if (!topic) {
      throw new ApiError(404, 'Topic not found')
    }

    res.json({ message: 'Topic deleted successfully' })
  })

  // Initialize topics from existing tags
  initializeTopics = this.handleAsync(async (req: Request, res: Response) => {
    try {
      const createdTopics = await topicsService.createTopicsFromExistingTags()
      res.status(201).json({
        message: 'Topics initialized successfully',
        createdTopics,
        count: createdTopics.length
      })
    } catch (error) {
      throw new ApiError(500, 'Failed to initialize topics', error)
    }
  })
}

// Export singleton instance
export default new TopicsController() 