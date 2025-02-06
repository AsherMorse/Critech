import { db } from '../db/client'
import { videos } from '../db/schema'
import { eq } from 'drizzle-orm'
import { CloudinaryNotification } from '../types/cloudinary'

class VideosService {
  // Create a new video record
  async createVideo(notification: CloudinaryNotification) {
    const [video] = await db.insert(videos).values({
      cloudinaryId: notification.asset_id,
      publicId: notification.public_id,
      videoUrl: notification.secure_url,
      thumbnailUrl: notification.thumbnailUrl,
      metadata: {
        format: notification.format,
        codec: null,
        bitRate: null,
        width: notification.width,
        height: notification.height,
        fps: null,
        audioCodec: null,
        audioFrequency: null,
        aspectRatio: null,
        rotation: null,
        quality: null
      }
    }).returning()

    return video
  }

  // Update video status and metadata
  async updateVideoStatus(notification: CloudinaryNotification) {
    const [video] = await db.update(videos)
      .set({
        status: 'ready',
        thumbnailUrl: notification.thumbnailUrl,
        metadata: {
          format: notification.format,
          codec: null,
          bitRate: null,
          width: notification.width,
          height: notification.height,
          fps: null,
          audioCodec: null,
          audioFrequency: null,
          aspectRatio: null,
          rotation: null,
          quality: null
        }
      })
      .where(eq(videos.cloudinaryId, notification.asset_id))
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