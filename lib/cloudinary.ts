import { v2 as cloudinary } from "cloudinary"

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(
  file: Buffer,
  options: { folder?: string; resource_type?: "auto" | "video" | "image" | "raw" } = {}
) {
  return new Promise<{ secure_url: string; public_id: string; resource_type: string }>((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || "attendance-tracker",
      resource_type: options.resource_type || "auto",
    }

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          return reject(error)
        }
        if (!result) {
          return reject(new Error("Upload failed"))
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
        })
      })
      .end(file)
  })
}

export async function deleteFromCloudinary(publicId: string, resourceType = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

export function getPublicIdFromUrl(url: string): string | null {
  const regex = /\/v\d+\/(.+?)\.\w+$/
  const match = url.match(regex)
  return match ? match[1] : null
}
