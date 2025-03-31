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

    const { makeupTime } = await req.json()

    if (!makeupTime || !["evening", "saturday", "sunday"].includes(makeupTime)) {
      return NextResponse.json({ message: "Invalid makeup time" }, { status: 400 })
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

    if (!attendance.isLate) {
      return NextResponse.json({ message: "Makeup time is only required for late check-ins" }, { status: 400 })
    }

    // Update attendance record
    attendance.makeupTime = makeupTime
    await attendance.save()

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Makeup time error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

