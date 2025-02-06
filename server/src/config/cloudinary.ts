import { v2 as cloudinary } from 'cloudinary'
import { config } from 'dotenv'

config()

const requiredEnvVars = [
  'SERVER_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
] as const

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is required`)
  }
}

const ALLOWED_ORIGINS = [
  process.env.SERVER_URL!,
  process.env.SERVER_URL!.replace('http:', 'https:'),
].filter(Boolean) as string[]

export const VIDEO_PROFILES = {
  HLS: {
    format: 'm3u8',
    streaming_profile: 'hd',
    transformation: [
      { quality: 'auto' },
      { fetch_format: 'auto' },
      { video_codec: 'h264' },
      { audio_codec: 'aac' }
    ]
  },
  DASH: {
    format: 'mpd',
    streaming_profile: 'hd',
    transformation: [
      { quality: 'auto' },
      { fetch_format: 'auto' },
      { video_codec: 'h264' },
      { audio_codec: 'aac' }
    ]
  },
  HD: {
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
      { video_codec: 'h264' },
      { audio_codec: 'aac' }
    ]
  },
  SD: {
    transformation: [
      { width: 1280, height: 720, crop: 'limit' },
      { quality: 'auto:eco' },
      { fetch_format: 'auto' },
      { video_codec: 'h264' },
      { audio_codec: 'aac' }
    ]
  },
  MOBILE: {
    transformation: [
      { width: 854, height: 480, crop: 'limit' },
      { quality: 'auto:low' },
      { fetch_format: 'auto' },
      { video_codec: 'h264' },
      { audio_codec: 'aac' }
    ]
  },
  THUMBNAIL: {
    transformation: [
      { width: 1280, height: 720, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  },
  THUMBNAIL_PREVIEW: {
    transformation: [
      { width: 320, height: 180, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  }
} as const

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

export const initializeCloudinary = async () => {
  try {
    await ensureUploadPresets()
    await configureCors()
  } catch (error: any) {
    throw new Error('Failed to initialize Cloudinary: ' + error.message)
  }
}

export const configureCors = async () => {
  try {
    for (const preset of Object.values(UPLOAD_PRESETS)) {
      await cloudinary.api.update_upload_preset(preset, {
        allowed_origins: ALLOWED_ORIGINS
      })
    }
  } catch (error: any) {
    throw new Error('Failed to configure Cloudinary CORS: ' + error.message)
  }
}

export const ensureUploadPresets = async () => {
  try {
    const videoPresetConfig = {
      folder: 'reviews',
      resource_type: 'video',
      allowed_formats: 'mp4,webm,mov,avi',
      access_mode: 'authenticated',
      unique_filename: true,
      auto_tagging: true,
      allowed_origins: ALLOWED_ORIGINS,
      unsigned: true,
      notification_url: `${process.env.SERVER_URL}/api/videos/webhook`,
      eager: [
        VIDEO_PROFILES.HLS,
        VIDEO_PROFILES.DASH,
        VIDEO_PROFILES.HD,
        VIDEO_PROFILES.SD,
        VIDEO_PROFILES.MOBILE
      ],
      eager_async: true,
      eager_notification_url: `${process.env.SERVER_URL}/api/videos/webhook`,
      transformation: [
        ...VIDEO_PROFILES.HD.transformation,
        { duration: "initial" }
      ]
    }

    try {
      await cloudinary.api.create_upload_preset({
        name: UPLOAD_PRESETS.REVIEW_VIDEO,
        ...videoPresetConfig
      })
    } catch (error: any) {
      if (error.error?.http_code === 409) {
        await cloudinary.api.update_upload_preset(UPLOAD_PRESETS.REVIEW_VIDEO, videoPresetConfig)
      } else {
        throw error
      }
    }

    const thumbnailPresetConfig = {
      folder: 'reviews/thumbnails',
      resource_type: 'image',
      allowed_formats: 'jpg,png,webp',
      access_mode: 'authenticated',
      unique_filename: true,
      allowed_origins: ALLOWED_ORIGINS,
      transformation: VIDEO_PROFILES.THUMBNAIL.transformation
    }

    try {
      await cloudinary.api.create_upload_preset({
        name: UPLOAD_PRESETS.REVIEW_THUMBNAIL,
        ...thumbnailPresetConfig
      })
    } catch (error: any) {
      if (error.error?.http_code === 409) {
        await cloudinary.api.update_upload_preset(UPLOAD_PRESETS.REVIEW_THUMBNAIL, thumbnailPresetConfig)
      } else {
        throw error
      }
    }
  } catch (error: any) {
    throw new Error('Failed to configure presets: ' + error.message)
  }
}

export const defaultUploadOptions = {
  resource_type: 'video',
  folder: 'reviews',
  allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
  transformation: [
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ]
}

export const UPLOAD_PRESETS = {
  REVIEW_VIDEO: 'review_video_upload',
  REVIEW_THUMBNAIL: 'review_thumbnail_upload'
} as const

export default cloudinary