import { Request, Response } from 'express'
import { BaseController } from './base.controller'
import { ApiError } from '../middleware/error-handler'
import cloudinary, { UPLOAD_PRESETS } from '../config/cloudinary'
import crypto from 'crypto'
import VideosService from '../services/videos.service'

interface CreateVideoDto {
  cloudinaryId: string
  publicId: string
  duration: number
  videoUrl: string
  metadata: {
    format: string
    codec: string | null
    bitRate: number | null
    width: number | null
    height: number | null
    fps: number | null
    audioCodec: string | null
    audioFrequency: number | null
    aspectRatio: string | null
    rotation: number | null
    quality: number | null
  }
}

class VideosController extends BaseController {
  constructor() {
    super()
    this.createVideo = this.createVideo.bind(this)
    this.getUploadSignature = this.getUploadSignature.bind(this)
    this.handleWebhook = this.handleWebhook.bind(this)
  }

  // Create a video record manually
  createVideo = this.handleAsync(async (req: Request<{}, any, CreateVideoDto>, res: Response) => {
    const video = await VideosService.createVideo({
      notification_type: 'upload',
      asset_id: req.body.cloudinaryId,
      public_id: req.body.publicId,
      version: Date.now(),
      width: req.body.metadata.width || 0,
      height: req.body.metadata.height || 0,
      format: req.body.metadata.format,
      resource_type: 'video',
      created_at: new Date().toISOString(),
      bytes: 0,
      type: 'upload',
      url: req.body.videoUrl,
      secure_url: req.body.videoUrl
    })
    res.status(201).json(video)
  })

  // Generate signature for client-side upload
  getUploadSignature = this.handleAsync(async (req: Request, res: Response) => {
    const timestamp = Math.round(new Date().getTime() / 1000)
    const params = {
      timestamp,
      upload_preset: UPLOAD_PRESETS.REVIEW_VIDEO
    }

    // Generate signature
    const signature = this.generateSignature(params)

    res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      uploadPreset: UPLOAD_PRESETS.REVIEW_VIDEO
    })
  })

  // Handle Cloudinary webhook notifications
  handleWebhook = this.handleAsync(async (req: Request, res: Response) => {
    // Verify webhook signature
    const signature = req.headers['x-cld-signature']
    const timestamp = req.headers['x-cld-timestamp']
    if (!this.verifyWebhookSignature(signature as string, timestamp as string, req.body)) {
      throw new ApiError(401, 'Invalid webhook signature')
    }

    const notification = req.body

    try {
      // Handle different notification types
      switch (notification.notification_type) {
        case 'upload':
          // Create new video record on initial upload
          await VideosService.createVideo(notification)
          break

        case 'eager':
          // Update video status when processing is complete
          await VideosService.updateVideoStatus(notification)
          break

        default:
          console.log('Unhandled notification type:', notification.notification_type)
      }

      res.json({ received: true })
    } catch (error: any) {
      console.error('Error processing webhook:', error)
      throw new ApiError(500, 'Error processing webhook: ' + error.message)
    }
  })

  private generateSignature(params: Record<string, any>): string {
    // Sort parameters
    const sortedKeys = Object.keys(params).sort()
    const sortedParams = sortedKeys.map(key => `${key}=${params[key]}`).join('&')
    
    // Add API secret
    const signatureString = sortedParams + process.env.CLOUDINARY_API_SECRET

    // Generate SHA-256 signature
    return crypto.createHash('sha256').update(signatureString).digest('hex')
  }

  private verifyWebhookSignature(signature: string, timestamp: string, body: any): boolean {
    if (!signature || !timestamp || !body) return false

    const expectedSignature = this.generateSignature({
      timestamp,
      ...body
    })

    return signature === expectedSignature
  }
}

export default new VideosController() 