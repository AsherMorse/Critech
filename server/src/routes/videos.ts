import { Router } from 'express'
import VideosController from '../controllers/videos.controller'
import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { verifyAuth } from '../middleware/auth'
import { RequestHandler } from 'express'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// Apply auth middleware to all routes except webhook
router.use((req: Request, res: Response, next: NextFunction) => {
  // Skip auth for webhook endpoint
  if (req.path === '/webhook') {
    return next()
  }
  return (verifyAuth as RequestHandler)(req, res, next)
})

// Get video by ID
router.get('/:id', (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  return VideosController.getVideoById(req, res, next)
})

// Get video status (including transcription status)
router.get('/:id/status', (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  return VideosController.getStatus(req, res, next)
})

// Get video transcript (with optional status-only parameter)
router.get('/:id/transcript', (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  return VideosController.getTranscript(req, res, next)
})

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

// Webhook endpoint for Cloudinary notifications (no auth required)
router.post('/webhook', (req: Request, res: Response, next: NextFunction) => {
  return VideosController.handleWebhook(req, res, next)
})

export default router 