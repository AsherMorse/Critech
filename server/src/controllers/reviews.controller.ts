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
    this.getReviews = this.getReviews.bind(this)
    this.getReviewById = this.getReviewById.bind(this)
    this.updateReview = this.updateReview.bind(this)
    this.deleteReview = this.deleteReview.bind(this)
    this.getReviewsPage = this.getReviewsPage.bind(this)
    this.getReviewCount = this.getReviewCount.bind(this)
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

  // Get paginated reviews
  getReviewsPage = this.handleAsync(async (req: Request, res: Response) => {
    const pageSize = Math.max(1, Math.min(20, parseInt(req.query.pageSize as string) || 5))
    const lastId = req.query.lastId ? parseInt(req.query.lastId as string) : undefined
    const ownerId = req.query.ownerId as string

    const reviews = await ReviewsService.getReviewsPage(pageSize, lastId, ownerId)
    res.json(reviews)
  })

  // Get total review count
  getReviewCount = this.handleAsync(async (req: Request, res: Response) => {
    const ownerId = req.query.ownerId as string
    const count = await ReviewsService.getReviewCount(ownerId)
    res.json({ count })
  })

  // Legacy get all reviews
  getReviews = this.handleAsync(async (req: Request, res: Response) => {
    const ownerId = req.query.ownerId as string
    const reviews = await ReviewsService.getAllReviews(ownerId)
    res.json(reviews)
  })

  // Get review by ID
  getReviewById = this.handleAsync(async (req: Request<{ id: string }>, res: Response) => {
    const id = this.validateId(req.params.id)
    const review = await ReviewsService.getReviewById(id)

    if (!review) {
      throw new ApiError(404, 'Review not found')
    }

    res.json(review)
  })

  // Update review
  updateReview = this.handleAsync(async (req: Request<{ id: string }>, res: Response) => {
    const id = this.validateId(req.params.id)
    const review = await ReviewsService.updateReview(id, req.body)
    res.json(review)
  })

  // Delete review
  deleteReview = this.handleAsync(async (req: Request<{ id: string }>, res: Response) => {
    const id = this.validateId(req.params.id)
    const review = await ReviewsService.deleteReview(id)
    res.json(review)
  })

  protected validateId(id: string): number {
    const numId = parseInt(id)
    if (isNaN(numId)) {
      throw new ApiError(400, 'Invalid ID format')
    }
    return numId
  }
}

export default new ReviewsController() 