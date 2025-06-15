import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Error from "@/models/Error"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { status, resolution, adminNotes, resolvedAt } = await req.json()
    const errorId = params.id

    const updateData: any = {}

    if (status) updateData.status = status
    if (resolution) updateData.resolution = resolution
    if (adminNotes) updateData.adminNotes = adminNotes
    if (resolvedAt) updateData.resolvedAt = new Date(resolvedAt)

    const updatedError = await Error.findByIdAndUpdate(errorId, updateData, { new: true }).populate(
      "employee",
      "name email",
    )

    if (!updatedError) {
      return NextResponse.json({ message: "Error not found" }, { status: 404 })
    }

    return NextResponse.json({ error: updatedError })
  } catch (error) {
    console.error("Error updating error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const errorId = params.id
    const deletedError = await Error.findByIdAndDelete(errorId)

    if (!deletedError) {
      return NextResponse.json({ message: "Error not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Error deleted successfully" })
  } catch (error) {
    console.error("Error deleting error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
