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

    // Get all employees
    const employees = await Employee.find({}).select("-password").lean()

    // Get today's date
    const today = new Date()

    // Get today's attendance for all employees
    const todayAttendance = await Attendance.find({
      checkIn: {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      },
    }).lean()

    // Map attendance to employees
    const employeesWithAttendance = employees.map((employee) => {
      const attendance = todayAttendance.find((a) => a.employee.toString() === employee._id.toString())

      return {
        ...employee,
        todayAttendance: attendance || null,
      }
    })

    return NextResponse.json({ employees: employeesWithAttendance })
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

