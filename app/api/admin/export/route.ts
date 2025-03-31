import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Employee from "@/models/Employee"
import Attendance from "@/models/Attendance"
import { format } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Get all employees
    const employees = await Employee.find().select("-password").lean()

    // Get all attendance records
    const attendanceRecords = await Attendance.find().lean()

    // Create CSV data
    let csvData =
      "Employee ID,Employee Name,Employee Email,Date,Check-in Time,Check-out Time,Is Late,Makeup Time,Daily Report\n"

    for (const record of attendanceRecords) {
      const employee = employees.find((e) => e._id.toString() === record.employee.toString())

      if (employee) {
        const checkInDate = format(new Date(record.checkIn), "yyyy-MM-dd")
        const checkInTime = format(new Date(record.checkIn), "HH:mm:ss")
        const checkOutTime = record.checkOut ? format(new Date(record.checkOut), "HH:mm:ss") : ""

        // Escape quotes in the daily report
        const dailyReport = record.dailyReport ? `"${record.dailyReport.replace(/"/g, '""')}"` : ""

        csvData += `${employee._id},${employee.name},${employee.email},${checkInDate},${checkInTime},${checkOutTime},${record.isLate},${record.makeupTime || ""},${dailyReport}\n`
      }
    }

    // Return CSV file
    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance-export-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

