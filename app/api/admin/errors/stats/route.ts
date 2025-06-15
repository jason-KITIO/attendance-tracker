import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Error from "@/models/Error"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Statistiques générales
    const totalErrors = await Error.countDocuments()
    const pendingErrors = await Error.countDocuments({ status: "pending" })
    const inProgressErrors = await Error.countDocuments({ status: "in-progress" })
    const resolvedErrors = await Error.countDocuments({ status: "resolved" })

    // Erreurs par priorité
    const highPriorityErrors = await Error.countDocuments({ priority: "high", status: { $ne: "resolved" } })
    const mediumPriorityErrors = await Error.countDocuments({ priority: "medium", status: { $ne: "resolved" } })
    const lowPriorityErrors = await Error.countDocuments({ priority: "low", status: { $ne: "resolved" } })

    // Erreurs par employé (top 5)
    const errorsByEmployee = await Error.aggregate([
      {
        $group: {
          _id: "$employee",
          count: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      {
        $unwind: "$employee",
      },
      {
        $project: {
          name: "$employee.name",
          count: 1,
          pending: 1,
          resolved: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])

    return NextResponse.json({
      totalErrors,
      pendingErrors,
      inProgressErrors,
      resolvedErrors,
      highPriorityErrors,
      mediumPriorityErrors,
      lowPriorityErrors,
      errorsByEmployee,
    })
  } catch (error) {
    console.error("Error fetching error stats:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
