import { Request, Response } from 'express'
import { BaseController } from './base.controller'
import { ApiError } from '../middleware/error-handler'
import cloudinary, { UPLOAD_PRESETS } from '../config/cloudinary'
import crypto from 'crypto'
import videosService from '../services/videos.service'
import reviewsService from '../services/reviews.service'
import { CloudinaryNotification, CloudinaryUploadResponse } from '../types/cloudinary'
import { Readable } from 'stream'
import { v2 as cloudinaryV2 } from 'cloudinary'
import { db } from '../db/client'
import { videos } from '../db/schema'
import { eq } from 'drizzle-orm'

// Helper function to generate thumbnail URL
const generateThumbnailUrl = (publicId: string): string | undefined => {
  if (!publicId) {
    console.error('No public ID provided for thumbnail generation')
    return undefined
  }

  console.log('Starting thumbnail generation for public ID:', publicId)
  try {
    // Generate a high-quality image thumbnail from the video
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const transformations = 'c_fill,f_auto,g_center,h_640,q_auto:best,vs_1,w_360'
    const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${transformations}/v1/${publicId}.jpg`

    console.log('Successfully generated thumbnail URL:', thumbnailUrl)
    return thumbnailUrl
  } catch (error) {
    console.error('Error generating thumbnail URL:', error)
    return undefined
  }
}

interface CreateVideoDto {
  cloudinaryId: string
  publicId: string
  duration: number
  videoUrl: string
  thumbnailUrl?: string
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
    this.handleUploadComplete = this.handleUploadComplete.bind(this)
    this.handleDirectUpload = this.handleDirectUpload.bind(this)
    this.getVideoById = this.getVideoById.bind(this)
  }

  // Get video by ID
  getVideoById = this.handleAsync(async (req: Request<{ id: string }>, res: Response) => {
    const id = this.validateId(req.params.id)

    const video = await db.query.videos.findFirst({
      where: eq(videos.id, id)
    })

    if (!video) {
      throw new ApiError(404, 'Video not found')
    }

    res.json(video)
  })

  // Upload video and create records
  uploadVideo = this.handleAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'No video file provided')
    }

    try {
      console.log('Starting video upload process...')
      const stream = Readable.from(req.file.buffer)

      console.log('Uploading to Cloudinary...')
      const uploadResponse = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'reviews',
            upload_preset: UPLOAD_PRESETS.REVIEW_VIDEO,
            eager: [
              {
                width: 320,
                height: 180,
                crop: 'fill',
                format: 'jpg'
              }
            ],
            eager_async: false
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error)
              reject(error)
            } else {
              console.log('Cloudinary upload successful. Full response:', JSON.stringify(result, null, 2))
              resolve(result as unknown as CloudinaryUploadResponse)
            }
          }
        )

        stream.pipe(uploadStream)
      })

      // Generate thumbnail URL
      console.log('Generating thumbnail for uploaded video...')
      console.log('Public ID from upload:', uploadResponse.public_id)
      const thumbnailUrl = generateThumbnailUrl(uploadResponse.public_id)

      if (!thumbnailUrl) {
        console.warn('Failed to generate thumbnail URL, proceeding without thumbnail')
      }

      // Create video record with thumbnail
      console.log('Creating video record with data:', {
        cloudinaryId: uploadResponse.asset_id,
        publicId: uploadResponse.public_id,
        videoUrl: uploadResponse.secure_url,
        thumbnailUrl
      })

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
        secure_url: uploadResponse.secure_url,
        thumbnailUrl
      })
      console.log('Video record created:', {
        id: video.id,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: video.videoUrl
      })

      // Create initial review entry
      console.log('Creating initial review entry...')
      if (!req.user?.id) {
        console.error('No user ID found in request')
        throw new ApiError(401, 'User not authenticated')
      }

      const review = await reviewsService.createFromVideo({
        videoId: video.id,
        ownerId: req.user.id
      })
      console.log('Review created:', {
        id: review.id,
        videoId: review.videoId,
        ownerId: review.ownerId
      })

      res.status(201).json({
        message: 'Video uploaded successfully',
        video,
        review
      })
    } catch (error) {
      console.error('Video upload process failed:', error)
      if (error instanceof Error) {
        throw new ApiError(500, `Failed to upload video: ${error.message}`, error)
      } else {
        throw new ApiError(500, 'Failed to upload video: Unknown error', error)
      }
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
    console.log('Received Cloudinary webhook notification:', {
      type: notification.notification_type,
      publicId: notification.public_id,
      resourceType: notification.resource_type
    })

    if (notification.resource_type !== 'video') {
      throw new ApiError(400, 'Invalid resource type')
    }

    let video

    if (notification.notification_type === 'upload') {
      // Generate thumbnail URL for the uploaded video
      console.log('Generating thumbnail for webhook upload...')
      const thumbnailUrl = generateThumbnailUrl(notification.public_id)

      // Add thumbnail URL to the notification data
      const notificationWithThumbnail = {
        ...notification,
        thumbnailUrl
      }
      console.log('Creating video record from webhook with thumbnail:', thumbnailUrl)

      video = await videosService.createVideo(notificationWithThumbnail)
      console.log('Video record created from webhook:', {
        id: video.id,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: video.videoUrl
      })

      const review = await reviewsService.createFromVideo({
        videoId: video.id,
        ownerId: 'system'
      })
      console.log('Review created from webhook:', {
        id: review.id,
        videoId: review.videoId,
        ownerId: review.ownerId
      })

      res.json({
        message: 'Video upload processed',
        video,
        review
      })
      return
    }

    if (notification.notification_type === 'eager') {
      console.log('Processing eager transformation notification...')
      video = await videosService.updateVideoStatus(notification)
      console.log('Video status updated:', {
        id: video.id,
        thumbnailUrl: video.thumbnailUrl,
        status: video.status
      })

      const review = await reviewsService.updateReviewByVideoId(video.id, {
        isVideoReady: true
      })
      console.log('Review updated:', {
        id: review.id,
        isVideoReady: review.isVideoReady
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

  // Handle video upload completion
  handleUploadComplete = this.handleAsync(async (req: Request, res: Response) => {
    const { videoId } = req.params
    const id = this.validateId(videoId)

    // Get video from database
    const video = await db.query.videos.findFirst({
      where: eq(videos.id, id)
    })

    if (!video) {
      throw new ApiError(404, 'Video not found')
    }

    // Create initial review entry
    try {
      const review = await reviewsService.createFromVideo({
        videoId: video.id,
        ownerId: req.user!.id
      })
      res.json(review)
    } catch (error) {
      console.error('Error creating review:', error)
      throw new ApiError(500, 'Failed to create review')
    }
  })

  // Handle direct video upload
  handleDirectUpload = this.handleAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'No video file provided')
    }

    try {
      console.log('Starting direct video upload...')
      // Upload to Cloudinary
      console.log('Uploading to Cloudinary...')
      const result = await cloudinaryV2.uploader.upload(req.file.path, {
        resource_type: 'video',
        folder: 'video-reviews'
      })
      console.log('Cloudinary upload successful:', result.public_id)

      // Create video record
      console.log('Creating video record...')
      const [video] = await db.insert(videos).values({
        cloudinaryId: result.public_id,
        publicId: result.public_id,
        duration: result.duration,
        videoUrl: result.secure_url,
        metadata: {
          format: result.format,
          codec: result.video?.codec,
          bitRate: result.bit_rate,
          width: result.width,
          height: result.height,
          fps: result.fps,
          audioCodec: result.audio?.codec,
          audioFrequency: result.audio?.frequency,
          aspectRatio: result.aspect_ratio,
          rotation: result.rotation,
          quality: null
        }
      }).returning()
      console.log('Video record created:', video.id)

      // Create initial review entry
      console.log('Creating initial review entry...')
      if (!req.user?.id) {
        console.error('No user ID found in request')
        throw new ApiError(401, 'User not authenticated')
      }

      const review = await reviewsService.createFromVideo({
        videoId: video.id,
        ownerId: req.user.id
      })
      console.log('Review created:', review.id)

      res.status(201).json({ video, review })
    } catch (error) {
      console.error('Direct upload process failed:', error)
      if (error instanceof Error) {
        throw new ApiError(500, `Failed to upload video: ${error.message}`, error)
      } else {
        throw new ApiError(500, 'Failed to upload video: Unknown error', error)
      }
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