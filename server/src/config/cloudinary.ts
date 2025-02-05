import { v2 as cloudinary } from 'cloudinary'
import { config } from 'dotenv'

// Load environment variables
config()

// Ensure required environment variables are set
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

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  process.env.SERVER_URL!,           // API server URL
  process.env.SERVER_URL!.replace('http:', 'https:'), // HTTPS version
].filter(Boolean) as string[]

// Video transformation profiles
export const VIDEO_PROFILES = {
  // Adaptive streaming profiles
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
  // Quality-specific profiles
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
  // Thumbnail profiles
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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

// Initialize Cloudinary settings
export const initializeCloudinary = async () => {
  try {
    // Create upload presets first
    await ensureUploadPresets()
    console.log('Upload presets created successfully')

    // Then configure CORS
    await configureCors()
    console.log('Cloudinary CORS settings updated successfully')
  } catch (error: any) {
    console.error('Error initializing Cloudinary:', error)
    throw new Error('Failed to initialize Cloudinary: ' + error.message)
  }
}

// Configure CORS settings for Cloudinary
export const configureCors = async () => {
  try {
    // Set CORS settings in upload presets
    for (const preset of Object.values(UPLOAD_PRESETS)) {
      await cloudinary.api.update_upload_preset(preset, {
        allowed_origins: ALLOWED_ORIGINS
      })
    }
  } catch (error: any) {
    console.error('Error configuring Cloudinary CORS:', error)
    throw new Error('Failed to configure Cloudinary CORS: ' + error.message)
  }
}

// Create or update upload presets
export const ensureUploadPresets = async () => {
  try {
    // Review video preset
    try {
      const videoPresetConfig = {
        folder: 'reviews',
        resource_type: 'video',
        allowed_formats: 'mp4,webm,mov,avi',
        access_mode: 'authenticated',
        unique_filename: true,
        auto_tagging: true,
        allowed_origins: ALLOWED_ORIGINS,
        notification_url: `${process.env.SERVER_URL}/api/videos/webhook`,
        eager: [
          VIDEO_PROFILES.HLS,    // HLS streaming
          VIDEO_PROFILES.DASH,   // DASH streaming
          VIDEO_PROFILES.HD,     // HD quality
          VIDEO_PROFILES.SD,     // SD quality
          VIDEO_PROFILES.MOBILE  // Mobile quality
        ],
        eager_async: true,
        eager_notification_url: `${process.env.SERVER_URL}/api/videos/webhook`,
        transformation: [
          ...VIDEO_PROFILES.HD.transformation,
          { duration: "initial" }  // Preserve original duration
        ]
      }

      try {
        // Try to create first
        await cloudinary.api.create_upload_preset({
          name: UPLOAD_PRESETS.REVIEW_VIDEO,
          ...videoPresetConfig
        })
        console.log('Created video upload preset')
      } catch (error: any) {
        if (error.error?.http_code === 409) {
          // Preset exists, update it
          await cloudinary.api.update_upload_preset(UPLOAD_PRESETS.REVIEW_VIDEO, videoPresetConfig)
          console.log('Updated video upload preset')
        } else {
          throw error
        }
      }

      // Review thumbnail preset
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
        // Try to create first
        await cloudinary.api.create_upload_preset({
          name: UPLOAD_PRESETS.REVIEW_THUMBNAIL,
          ...thumbnailPresetConfig
        })
        console.log('Created thumbnail upload preset')
      } catch (error: any) {
        if (error.error?.http_code === 409) {
          // Preset exists, update it
          await cloudinary.api.update_upload_preset(UPLOAD_PRESETS.REVIEW_THUMBNAIL, thumbnailPresetConfig)
          console.log('Updated thumbnail upload preset')
        } else {
          throw error
        }
      }
    } catch (error: any) {
      console.error('Error creating/updating upload presets:', error)
      throw new Error('Failed to create/update upload presets: ' + error.message)
    }
  } catch (error: any) {
    console.error('Error in preset configuration:', error)
    throw new Error('Failed to configure presets: ' + error.message)
  }
}

// Default upload options
export const defaultUploadOptions = {
  resource_type: 'video',
  folder: 'reviews',
  allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
  transformation: [
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ]
}

// Upload preset names
export const UPLOAD_PRESETS = {
  REVIEW_VIDEO: 'review_video_upload',
  REVIEW_THUMBNAIL: 'review_thumbnail_upload'
} as const

export default cloudinary 