import { Request, Response } from 'express'
import { BaseController } from './base.controller'
import { ApiError } from '../middleware/error-handler'
import cloudinary, { UPLOAD_PRESETS } from '../config/cloudinary'
import crypto from 'crypto'
import videosService from '../services/videos.service'
import reviewsService from '../services/reviews.service'
import { CloudinaryNotification, CloudinaryUploadResponse } from '../types/cloudinary'
import { Readable } from 'stream'

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
    this.uploadVideo = this.uploadVideo.bind(this)
  }

  // Upload video and create records
  uploadVideo = this.handleAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'No video file provided')
    }

    try {
      // Create a readable stream from the buffer
      const stream = Readable.from(req.file.buffer)

      // Upload to Cloudinary
      const uploadResponse = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'reviews',
            upload_preset: UPLOAD_PRESETS.REVIEW_VIDEO,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result as unknown as CloudinaryUploadResponse)
          }
        )

        stream.pipe(uploadStream)
      })

      // Create video record
      const video = await videosService.createVideo({
        notification_type: 'upload',
        asset_id: uploadResponse.asset_id,
        public_id: uploadResponse.public_id,
        version: uploadResponse.version,
        width: uploadResponse.width,
        height: uploadResponse.height,
        format: uploadResponse.format,
        resource_type: 'video',
        created_at: new Date().toISOString(),
        bytes: uploadResponse.bytes,
        type: 'upload',
        url: uploadResponse.url,
        secure_url: uploadResponse.secure_url
      })

      // Create initial review entry
      const review = await reviewsService.createFromVideo({ videoId: video.id })

      res.status(201).json({
        message: 'Video uploaded successfully',
        video,
        review
      })
    } catch (error) {
      throw new ApiError(500, 'Failed to upload video', error)
    }
  })

  // Create a video record manually
  createVideo = this.handleAsync(async (req: Request<{}, any, CreateVideoDto>, res: Response) => {
    const video = await videosService.createVideo({
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
    const notification = req.body as CloudinaryNotification

    // Only process video notifications
    if (notification.resource_type !== 'video') {
      throw new ApiError(400, 'Invalid resource type')
    }

    let video

    // Handle initial upload notification
    if (notification.notification_type === 'upload') {
      video = await videosService.createVideo(notification)
      
      // Create initial review entry
      const review = await reviewsService.createFromVideo({ videoId: video.id })
      
      res.json({ 
        message: 'Video upload processed',
        video,
        review
      })
      return
    }

    // Handle video processing completion
    if (notification.notification_type === 'eager') {
      video = await videosService.updateVideoStatus(notification)
      
      // Find associated review and mark video as ready
      const review = await reviewsService.updateReviewByVideoId(video.id, {
        isVideoReady: true
      })

      res.json({ 
        message: 'Video processing completed',
        video,
        review
      })
      return
    }

    throw new ApiError(400, 'Unsupported notification type')
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