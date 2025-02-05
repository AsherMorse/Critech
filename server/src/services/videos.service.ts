import { db } from '../db/client'
import { videos } from '../db/schema'
import { eq } from 'drizzle-orm'

interface CloudinaryNotification {
  notification_type: string
  asset_id: string
  public_id: string
  version: number
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  bytes: number
  type: string
  url: string
  secure_url: string
  eager?: Array<{
    transformation: string
    width: number
    height: number
    bytes: number
    format: string
    url: string
    secure_url: string
  }>
  status?: string
  error?: {
    message: string
  }
}

class VideosService {
  // Create a new video record
  async createVideo(data: CloudinaryNotification) {
    const [video] = await db.insert(videos).values({
      cloudinaryId: data.asset_id,
      publicId: data.public_id,
      duration: 0, // Will be updated when processing is complete
      videoUrl: data.secure_url,
      status: 'processing',
      metadata: {
        format: data.format,
        codec: null,
        bitRate: null,
        width: data.width,
        height: data.height,
        fps: null,
        audioCodec: null,
        audioFrequency: null,
        aspectRatio: `${data.width}:${data.height}`,
        rotation: null,
        quality: null
      }
    }).returning()

    return video
  }

  // Update video status and metadata
  async updateVideoStatus(data: CloudinaryNotification) {
    const [video] = await db.update(videos)
      .set({
        status: data.status === 'completed' ? 'ready' : 'error',
        metadata: {
          format: data.format,
          codec: null, // Add when available in notification
          bitRate: null,
          width: data.width,
          height: data.height,
          fps: null,
          audioCodec: null,
          audioFrequency: null,
          aspectRatio: `${data.width}:${data.height}`,
          rotation: null,
          quality: null
        },
        updatedAt: new Date()
      })
      .where(eq(videos.cloudinaryId, data.asset_id))
      .returning()

    return video
  }

  // Get a video by Cloudinary asset ID
  async getVideoByCloudinaryId(cloudinaryId: string) {
    return await db.query.videos.findFirst({
      where: eq(videos.cloudinaryId, cloudinaryId)
    })
  }
}

export default new VideosService() 