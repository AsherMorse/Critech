import { Request, Response } from 'express'
import ReviewsService, { CreateReviewFromVideoDto, UpdateReviewDto } from '../services/reviews.service'
import { BaseController } from './base.controller'
import { ApiError } from '../middleware/error-handler'

class ReviewsController extends BaseController {
  constructor() {
    super()
    // Bind methods to maintain correct 'this' context
    this.createFromVideo = this.createFromVideo.bind(this)
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
  }

  // Create a review from uploaded video
  createFromVideo = this.handleAsync(async (req: Request<{}, any, CreateReviewFromVideoDto>, res: Response) => {
    this.validateRequiredFields(req.body, ['videoId'])

    // Add owner ID from authenticated user
    const reviewData = {
      ...req.body,
      ownerId: req.user!.id
    }

    const review = await ReviewsService.createFromVideo(reviewData)
    res.status(201).json(review)
  })

  // Get all reviews with optional filters
  getAll = this.handleAsync(async (req: Request, res: Response) => {
    // Get owner ID from query params if provided
    const ownerId = req.query.owner as string | undefined
    const reviews = await ReviewsService.getAllReviews(ownerId)
    res.json(reviews)
  })

  // Get a single review by ID
  getById = this.handleAsync(async (req: Request<{ id: string }>, res: Response) => {
    const id = this.validateId(req.params.id)
    const review = await ReviewsService.getReviewById(id)

    if (!review) {
      throw new ApiError(404, 'Review not found')
    }

    res.json(review)
  })

  // Update a review
  update = this.handleAsync(async (req: Request<{ id: string }, any, UpdateReviewDto>, res: Response) => {
    const id = this.validateId(req.params.id)
    const updated = await ReviewsService.updateReview(id, req.body)
    res.json(updated)
  })

  // Delete a review
  delete = this.handleAsync(async (req: Request<{ id: string }>, res: Response) => {
    const id = this.validateId(req.params.id)
    const deleted = await ReviewsService.deleteReview(id)

    if (!deleted) {
      throw new ApiError(404, 'Review not found')
    }

    res.json({ message: 'Review deleted successfully' })
  })
}

export default new ReviewsController() 