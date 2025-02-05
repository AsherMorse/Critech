import { Router } from 'express'
import VideosController from '../controllers/videos.controller'
import { Request, Response, NextFunction } from 'express'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// Direct upload endpoint
router.post('/upload', upload.single('video'), (req: Request, res: Response, next: NextFunction) => {
  return VideosController.uploadVideo(req, res, next)
})

// Create a video record
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  return VideosController.createVideo(req, res, next)
})

// Get upload signature for Cloudinary
router.get('/signature', (req: Request, res: Response, next: NextFunction) => {
  return VideosController.getUploadSignature(req, res, next)
})

// Webhook endpoint for Cloudinary notifications
router.post('/webhook', (req: Request, res: Response, next: NextFunction) => {
  return VideosController.handleWebhook(req, res, next)
})

export default router 