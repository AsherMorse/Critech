export interface CloudinaryNotification {
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

export interface CloudinaryUploadResponse {
  asset_id: string
  public_id: string
  version: number
  version_id: string
  signature: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  bytes: number
  type: string
  url: string
  secure_url: string
  original_filename: string
} 