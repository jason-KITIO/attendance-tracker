import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Attendance from "@/models/Attendance"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const employeeId = params.id

    await dbConnect()

    // Get attendance records for the employee
    const attendance = await Attendance.find({
      employee: employeeId,
    })
      .sort({ checkIn: -1 })
      .limit(30)

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Error fetching employee attendance:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

