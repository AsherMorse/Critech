import { Router } from 'express'
import VideosController from '../controllers/videos.controller'
import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { verifyAuth } from '../middleware/auth'
import { RequestHandler } from 'express'

const router = Router()

// Configure multer with size limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB (Cloudinary free tier limit)
    files: 1 // Only allow 1 file per request
  },
  // Add error handling
  fileFilter: (req, file, cb) => {
    if (file.size && file.size > 8.4 * 1024 * 1024) {
      cb(new multer.MulterError('LIMIT_FILE_SIZE', 'video'))
      return
    }
    cb(null, true)
  }
}).single('video')

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

// Direct upload endpoint with custom error handling
router.post('/upload', (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err)
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: 'File size exceeds the maximum limit of 4.4MB'
          })
        }
        return res.status(400).json({
          error: `Upload error: ${err.message}`
        })
      }
      // Handle non-multer errors
      return res.status(500).json({
        error: 'File upload failed'
      })
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      })
    }

    return VideosController.uploadVideo(req, res, next)
  })
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