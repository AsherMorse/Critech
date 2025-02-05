export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
}

if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
  throw new Error('Missing Cloudinary configuration. Please check your environment variables.')
} 