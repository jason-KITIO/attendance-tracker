import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Employee from "@/models/Employee"
import Attendance from "@/models/Attendance"
import { startOfDay, endOfDay } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Get total number of employees
    const totalEmployees = await Employee.countDocuments({ role: "employee" })

    // Get today's date
    const today = new Date()

    // Get number of employees present today
    const presentToday = await Attendance.countDocuments({
      checkIn: {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      },
    })

    // Get number of employees late today
    const lateToday = await Attendance.countDocuments({
      checkIn: {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      },
      isLate: true,
    })

    // Calculate number of employees absent today
    const absentToday = totalEmployees - presentToday

    return NextResponse.json({
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

