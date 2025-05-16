import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Attendance from "@/models/Attendance"
import { startOfDay, endOfDay, differenceInHours, isWeekend } from "date-fns"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { dailyReport, attachments } = await req.json()

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

    // Calculate overtime hours
    const checkOutTime = new Date()
    const isWeekendDay = isWeekend(checkOutTime)
    let overtimeHours = 0

    // Regular workday ends at 17:00 (5:00 PM)
    const workdayEnd = new Date(checkOutTime)
    workdayEnd.setHours(17, 0, 0, 0)

    // If checkout is after 5:00 PM on a weekday, calculate overtime
    if (!isWeekendDay && checkOutTime > workdayEnd) {
      overtimeHours = differenceInHours(checkOutTime, workdayEnd)
      if (overtimeHours < 0) overtimeHours = 0
    }

    // If it's a weekend, all hours are overtime
    if (isWeekendDay) {
      const checkInTime = new Date(attendance.checkIn)
      overtimeHours = differenceInHours(checkOutTime, checkInTime)
      if (overtimeHours < 0) overtimeHours = 0
    }

    // Update attendance record
    attendance.checkOut = checkOutTime
    attendance.dailyReport = dailyReport
    attendance.overtimeHours = overtimeHours
    attendance.isWeekendOvertime = isWeekendDay

    // Add attachments if provided
    if (attachments && Array.isArray(attachments)) {
      // Ensure each attachment has the correct structure
      const validAttachments = attachments.map((attachment) => ({
        name: String(attachment.name || ""),
        url: String(attachment.url || ""),
        type: String(attachment.type || ""),
      }))

      attendance.attachments = validAttachments
    }

    await attendance.save()

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Check-out error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
