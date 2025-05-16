import mongoose, { Schema, type Document } from "mongoose"

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId
  checkIn: Date
  checkOut?: Date
  isLate: boolean
  makeupTime?: "evening" | "saturday" | "sunday"
  dailyReport?: string
  overtimeHours?: number
  isWeekendOvertime?: boolean
  attachments?: Array<{
    name: string
    url: string
    type: string
    publicId?: string
  }>
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
    overtimeHours: { type: Number, default: 0 },
    isWeekendOvertime: { type: Boolean, default: false },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        publicId: { type: String },
      },
    ],
  },
  { timestamps: true },
)

export default mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema)
