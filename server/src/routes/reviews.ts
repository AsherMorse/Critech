import { Router } from 'express'
import ReviewsController from '../controllers/reviews.controller'
import { CreateReviewFromVideoDto, UpdateReviewDto } from '../services/reviews.service'
import { Request, Response, NextFunction } from 'express'
import { verifyAuth, verifyReviewOwnership } from '../middleware/auth'
import { RequestHandler } from 'express'

const router = Router()

// Apply auth middleware to all routes
router.use(verifyAuth as RequestHandler)

// Create a review from uploaded video
router.post('/from-video', (req: Request<{}, any, CreateReviewFromVideoDto>, res: Response, next: NextFunction) => {
  ReviewsController.createFromVideo(req, res, next)
})

// Get all reviews (optionally filtered by owner)
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  ReviewsController.getAll(req, res, next)
})

// Get a single review (no ownership verification needed)
router.get('/:id', (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  ReviewsController.getById(req, res, next)
})

// Update a review (requires ownership)
router.put('/:id',
  verifyReviewOwnership as RequestHandler,
  (req: Request<{ id: string }, any, UpdateReviewDto>, res: Response, next: NextFunction) => {
    ReviewsController.update(req, res, next)
  })

// Delete a review (requires ownership)
router.delete('/:id',
  verifyReviewOwnership as RequestHandler,
  (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    ReviewsController.delete(req, res, next)
  })

export default router