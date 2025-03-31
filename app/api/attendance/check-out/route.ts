import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Attendance from "@/models/Attendance"
import { startOfDay, endOfDay } from "date-fns"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { dailyReport } = await req.json()

    if (!dailyReport || !dailyReport.trim()) {
      return NextResponse.json({ message: "Daily report is required" }, { status: 400 })
    }

    await dbConnect()

    // Find today's attendance record
    const today = new Date()
    const attendance = await Attendance.findOne({
      employee: session.user.id,
      checkIn: {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      },
    })

    if (!attendance) {
      return NextResponse.json({ message: "No check-in record found for today" }, { status: 400 })
    }

    if (attendance.checkOut) {
      return NextResponse.json({ message: "Already checked out today" }, { status: 400 })
    }

    // If late but no makeup time specified
    if (attendance.isLate && !attendance.makeupTime) {
      return NextResponse.json({ message: "Please specify makeup time before checking out" }, { status: 400 })
    }

    // Update attendance record
    attendance.checkOut = new Date()
    attendance.dailyReport = dailyReport
    await attendance.save()

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Check-out error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

