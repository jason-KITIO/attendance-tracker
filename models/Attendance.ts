import mongoose, { Schema, type Document } from "mongoose"

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId
  checkIn: Date
  checkOut?: Date
  isLate: boolean
  makeupTime?: "evening" | "saturday" | "sunday"
  dailyReport?: string
  createdAt: Date
  updatedAt: Date
}

const AttendanceSchema: Schema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date },
    isLate: { type: Boolean, default: false },
    makeupTime: { type: String, enum: ["evening", "saturday", "sunday"] },
    dailyReport: { type: String },
  },
  { timestamps: true },
)

export default mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema)

