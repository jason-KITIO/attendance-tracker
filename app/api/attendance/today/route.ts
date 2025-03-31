import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Attendance from "@/models/Attendance"
import { startOfDay, endOfDay } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Get today's attendance record
    const today = new Date()
    const attendance = await Attendance.findOne({
      employee: session.user.id,
      checkIn: {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      },
    })

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Error fetching today's attendance:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

