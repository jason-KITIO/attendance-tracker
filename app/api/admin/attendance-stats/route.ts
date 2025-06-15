import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Attendance from "@/models/Attendance"
import Employee from "@/models/Employee"
import {
  startOfDay,
  endOfDay,
  subDays,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInMinutes,
} from "date-fns"

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

    // Calculate lates by day (last 7 days)
    const latesByDay = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const count = await Attendance.countDocuments({
        checkIn: {
          $gte: startOfDay(date),
          $lte: endOfDay(date),
        },
        isLate: true,
      })

      latesByDay.push({
        label: format(date, "EEE"),
        count,
      })
    }

    // Calculate lates by week (last 4 weeks)
    const latesByWeek = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(today, i * 7))
      const weekEnd = endOfWeek(subDays(today, i * 7))

      const count = await Attendance.countDocuments({
        checkIn: {
          $gte: weekStart,
          $lte: weekEnd,
        },
        isLate: true,
      })

      latesByWeek.push({
        label: `Week ${4 - i}`,
        count,
      })
    }

    // Calculate lates by month (last 6 months)
    const latesByMonth = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)

      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)

      const count = await Attendance.countDocuments({
        checkIn: {
          $gte: monthStart,
          $lte: monthEnd,
        },
        isLate: true,
      })

      latesByMonth.push({
        label: format(date, "MMM"),
        count,
      })
    }

    // Calculate attendance distribution for today
    const presentOnTime = await Attendance.countDocuments({
      checkIn: {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      },
      isLate: false,
    })

    const presentLate = await Attendance.countDocuments({
      checkIn: {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      },
      isLate: true,
    })

    const absent = totalEmployees - (presentOnTime + presentLate)

    const attendanceDistribution = [
      { name: "On Time", value: presentOnTime },
      { name: "Late", value: presentLate },
      { name: "Absent", value: absent },
    ]

    // Calculate average work hours per employee (top 5)
    const employees = await Employee.find({ role: "employee" }).limit(5)

    const averageWorkHours = []

    for (const employee of employees) {
      const attendanceRecords = await Attendance.find({
        employee: employee._id,
        checkOut: { $exists: true },
      })
        .sort({ checkIn: -1 })
        .limit(10)

      if (attendanceRecords.length > 0) {
        let totalMinutes = 0

        for (const record of attendanceRecords) {
          if (record.checkIn && record.checkOut) {
            const minutes = differenceInMinutes(new Date(record.checkOut), new Date(record.checkIn))
            totalMinutes += minutes
          }
        }

        const avgHours = totalMinutes / attendanceRecords.length / 60

        averageWorkHours.push({
          name: employee.name,
          hours: avgHours,
        })
      }
    }

    // Calculate overtime statistics
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    const overtimeByEmployee = []

    for (const employee of employees) {
      const attendanceRecords = await Attendance.find({
        employee: employee._id,
        checkOut: { $exists: true },
        checkIn: {
          $gte: monthStart,
          $lte: monthEnd,
        },
      })

      let regularOvertimeHours = 0
      let weekendOvertimeHours = 0

      for (const record of attendanceRecords) {
        if (record.overtimeHours) {
          if (record.isWeekendOvertime) {
            weekendOvertimeHours += record.overtimeHours
          } else {
            regularOvertimeHours += record.overtimeHours
          }
        }
      }

      overtimeByEmployee.push({
        name: employee.name,
        regularHours: regularOvertimeHours,
        weekendHours: weekendOvertimeHours,
        totalHours: regularOvertimeHours + weekendOvertimeHours,
      })
    }

    // Sort by total overtime hours
    overtimeByEmployee.sort((a, b) => b.totalHours - a.totalHours)

    return NextResponse.json({
      latesByDay,
      latesByWeek,
      latesByMonth,
      attendanceDistribution,
      averageWorkHours,
      overtimeByEmployee,
    })
  } catch (error) {
    console.error("Error fetching attendance stats:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
