import fs from "fs"
import path from "path"

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "public", "uploads")

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    console.log("Created uploads directory")
  }
} catch (err) {
  console.error("Error creating uploads directory:", err)
}
