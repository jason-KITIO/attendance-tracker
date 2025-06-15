import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Error from "@/models/Error"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const priority = url.searchParams.get("priority")
    const employeeId = url.searchParams.get("employee")

    const query: any = {}

    // Si c'est un employé, ne montrer que ses erreurs
    if (session.user.role === "employee") {
      query.employee = session.user.id
    }

    // Si c'est un admin et qu'un employé spécifique est demandé
    if (session.user.role === "admin" && employeeId) {
      query.employee = employeeId
    }

    // Filtres
    if (status && status !== "all") {
      query.status = status
    }

    if (priority && priority !== "all") {
      query.priority = priority
    }

    const errors = await Error.find(query).populate("employee", "name email").sort({ createdAt: -1 })

    return NextResponse.json({ errors })
  } catch (error) {
    console.error("Error fetching errors:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { title, description, priority, category } = await req.json()

    if (!title || !description) {
      return NextResponse.json({ message: "Title and description are required" }, { status: 400 })
    }

    await dbConnect()

    const newError = await Error.create({
      employee: session.user.id,
      title,
      description,
      priority: priority || "medium",
      category,
    })

    const populatedError = await Error.findById(newError._id).populate("employee", "name email")

    return NextResponse.json({ error: populatedError }, { status: 201 })
  } catch (error) {
    console.error("Error creating error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
