import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Attendance from "@/models/Attendance"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const monthParam = url.searchParams.get("month")
    const yearParam = url.searchParams.get("year")

    // Default to current month if not specified
    const month = monthParam ? Number.parseInt(monthParam) : new Date().getMonth()
    const year = yearParam ? Number.parseInt(yearParam) : new Date().getFullYear()

    const startDate = startOfMonth(new Date(year, month))
    const endDate = endOfMonth(new Date(year, month))

    await dbConnect()

    // Get attendance records for the specified month
    const attendance = await Attendance.find({
      employee: session.user.id,
      checkIn: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ checkIn: -1 })

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Error fetching monthly attendance:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
