import { Router } from 'express'
import ReviewsController from '../controllers/reviews.controller'
import { CreateReviewFromVideoDto, UpdateReviewDto } from '../services/reviews.service'
import { Request, Response, NextFunction } from 'express'

const router = Router()

// Create a review from uploaded video
router.post('/from-video', (req: Request<{}, any, CreateReviewFromVideoDto>, res: Response, next: NextFunction) => {
  return ReviewsController.createFromVideo(req, res, next)
})

// Get all reviews
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  return ReviewsController.getAll(req, res, next)
})

// Get a single review
router.get('/:id', (req: Request<{id: string}>, res: Response, next: NextFunction) => {
  return ReviewsController.getById(req, res, next)
})

// Update a review
router.put('/:id', (req: Request<{id: string}, any, UpdateReviewDto>, res: Response, next: NextFunction) => {
  return ReviewsController.update(req, res, next)
})

// Delete a review
router.delete('/:id', (req: Request<{id: string}>, res: Response, next: NextFunction) => {
  return ReviewsController.delete(req, res, next)
})

export default router