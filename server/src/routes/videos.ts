import { Router } from 'express'
import VideosController from '../controllers/videos.controller'
import { Request, Response, NextFunction } from 'express'

const router = Router()

// Get upload signature for Cloudinary
router.get('/signature', (req: Request, res: Response, next: NextFunction) => {
  return VideosController.getUploadSignature(req, res, next)
})

// Webhook endpoint for Cloudinary notifications
router.post('/webhook', (req: Request, res: Response, next: NextFunction) => {
  return VideosController.handleWebhook(req, res, next)
})

export default router 