import mongoose, { Schema, type Document } from "mongoose"

export interface IError extends Document {
  employee: mongoose.Types.ObjectId
  title: string
  description: string
  status: "pending" | "in-progress" | "resolved"
  priority: "low" | "medium" | "high"
  category?: string
  resolution?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ErrorSchema: Schema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    category: { type: String },
    resolution: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
)

export default mongoose.models.Error || mongoose.model<IError>("Error", ErrorSchema)
