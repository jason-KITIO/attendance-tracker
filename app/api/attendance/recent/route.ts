import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Attendance from "@/models/Attendance"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Get recent attendance records (last 7 days)
    const attendance = await Attendance.find({
      employee: session.user.id,
    })
      .sort({ checkIn: -1 })
      // .limit(7)

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Error fetching recent attendance:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

