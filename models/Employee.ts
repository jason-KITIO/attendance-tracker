import mongoose, { Schema, type Document } from "mongoose"

export interface IEmployee extends Document {
  name: string
  email: string
  password: string
  role: "employee" | "admin"
  createdAt: Date
  updatedAt: Date
}

const EmployeeSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["employee", "admin"], default: "employee" },
  },
  { timestamps: true },
)

export default mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema)

