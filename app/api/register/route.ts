import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/db"
import Employee from "@/models/Employee"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    await dbConnect()

    // Check if user already exists
    const existingEmployee = await Employee.findOne({ email })
    if (existingEmployee) {
      return NextResponse.json({ message: "Email already in use" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new employee
    const employee = await Employee.create({
      name,
      email,
      password: hashedPassword,
      role: "employee", // Default role
    })

    // Remove password from response
    const newEmployee = {
      id: employee._id.toString(),
      name: employee.name,
      email: employee.email,
      role: employee.role,
    }

    return NextResponse.json({ message: "User created successfully", user: newEmployee }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

