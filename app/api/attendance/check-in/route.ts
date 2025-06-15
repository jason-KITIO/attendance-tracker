import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Attendance from "@/models/Attendance"
import { startOfDay, endOfDay, setHours, setMinutes } from "date-fns"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Check if already checked in today
    const today = new Date()
    const existingAttendance = await Attendance.findOne({
      employee: session.user.id,
      checkIn: {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      },
    })

    if (existingAttendance) {
      return NextResponse.json({ message: "Already checked in today" }, { status: 400 })
    }

    // Check if late (after 8:15 AM)
    const now = new Date()
    const lateThreshold = setMinutes(setHours(today, 8), 15)
    const isLate = now > lateThreshold

    // Create new attendance record
    const attendance = await Attendance.create({
      employee: session.user.id,
      checkIn: now,
      isLate,
    })

    return NextResponse.json({ attendance }, { status: 201 })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

