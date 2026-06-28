import { v2 as cloudinary } from "cloudinary"

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET

if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
  console.warn("Cloudinary env vars are missing. Upload route will fail until configured.")
}

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
  secure: true,
})

export async function uploadImageToCloudinary(
  buffer: Buffer,
  options?: {
    folder?: string
    publicId?: string
  },
) {
  return new Promise<{
    secureUrl: string
    publicId: string
    format: string
    width?: number
    height?: number
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder ?? "pfe-csf",
        public_id: options?.publicId,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"))
          return
        }
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        })
      },
    )

    uploadStream.end(buffer)
  })
}
