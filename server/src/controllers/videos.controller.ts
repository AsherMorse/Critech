import { Request, Response } from 'express'
import { BaseController } from './base.controller'
import { ApiError } from '../middleware/error-handler'
import cloudinary, { UPLOAD_PRESETS } from '../config/cloudinary'
import crypto from 'crypto'

class VideosController extends BaseController {
  constructor() {
    super()
    this.getUploadSignature = this.getUploadSignature.bind(this)
    this.handleWebhook = this.handleWebhook.bind(this)
  }

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

    // TODO: Update video status based on webhook notification
    console.log('Webhook notification:', req.body)

    res.json({ received: true })
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