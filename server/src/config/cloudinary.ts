import { v2 as cloudinary } from 'cloudinary'
import { config } from 'dotenv'

// Load environment variables
config()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

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

export default cloudinary 