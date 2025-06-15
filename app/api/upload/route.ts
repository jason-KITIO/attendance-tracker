import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ message: "No files provided" }, { status: 400 })
    }

    const uploadResults = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Déterminer le type de ressource pour Cloudinary
      const resourceType = file.type.startsWith("image/") ? "image" : "raw"

      // Télécharger vers Cloudinary
      const result = await uploadToCloudinary(buffer, {
        folder: `attendance-tracker/${session.user.id}`,
        resource_type: resourceType,
      })

      uploadResults.push({
        name: file.name,
        url: result.secure_url,
        type: file.type,
        publicId: result.public_id,
      })
    }

    return NextResponse.json({ files: uploadResults })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
