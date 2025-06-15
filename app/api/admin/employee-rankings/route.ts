import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Employee from "@/models/Employee"
import Attendance from "@/models/Attendance"
import { differenceInMinutes } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Get all employees
    const employees = await Employee.find({ role: "employee" }).select("-password").lean()

    // Calculate rankings
    const rankings = []

    for (const employee of employees) {
      // Get all attendance records for the employee
      const attendanceRecords = await Attendance.find({
        employee: employee._id,
      }).lean()

      // Calculate metrics
      const onTimeDays = attendanceRecords.filter((record) => !record.isLate).length
      const lateDays = attendanceRecords.filter((record) => record.isLate).length

      // Calculate average work hours
      let totalWorkMinutes = 0
      let completeDays = 0

      for (const record of attendanceRecords) {
        if (record.checkIn && record.checkOut) {
          const minutes = differenceInMinutes(new Date(record.checkOut), new Date(record.checkIn))
          totalWorkMinutes += minutes
          completeDays++
        }
      }

      const averageWorkHours = completeDays > 0 ? totalWorkMinutes / completeDays / 60 : 0

      // Calculate absent days (assuming 30 working days)
      const absentDays = 30 - (onTimeDays + lateDays)

      rankings.push({
        _id: employee._id,
        name: employee.name,
        onTimeDays,
        lateDays,
        absentDays: absentDays > 0 ? absentDays : 0,
        averageWorkHours,
        // Calculate a score for sorting (higher is better)
        score: onTimeDays * 2 - lateDays - absentDays * 2 + averageWorkHours / 2,
      })
    }

    // Sort by score (descending)
    rankings.sort((a, b) => b.score - a.score)

    return NextResponse.json({ rankings })
  } catch (error) {
    console.error("Error fetching employee rankings:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

