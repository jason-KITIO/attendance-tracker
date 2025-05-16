import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

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

      // Generate unique filename
      const uniqueId = uuidv4()
      const originalName = file.name
      const extension = originalName.split(".").pop() || ""
      const fileName = `${uniqueId}.${extension}`

      // Define upload path - in a real app, use a cloud storage service
      const uploadDir = join(process.cwd(), "public", "uploads")
      const filePath = join(uploadDir, fileName)

      // Ensure directory exists
      await writeFile(filePath, buffer)

      // Return the URL to the uploaded file
      const fileUrl = `/uploads/${fileName}`

      uploadResults.push({
        name: originalName,
        url: fileUrl,
        type: file.type,
      })
    }

    return NextResponse.json({ files: uploadResults })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
