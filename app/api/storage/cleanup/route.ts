import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cleanupUnusedFiles } from "@/lib/cloudinary"
import Attendance from "@/models/Attendance"
import { connectToDatabase } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Connecter à la base de données
    await connectToDatabase()

    // Récupérer tous les publicIds utilisés dans les pièces jointes
    const attendances = await Attendance.find({ "attachments.publicId": { $exists: true } })

    const usedPublicIds = attendances.reduce((ids: string[], attendance) => {
      if (attendance.attachments && attendance.attachments.length > 0) {
        const attachmentIds = attendance.attachments.filter((a: any) => a.publicId).map((a: any) => a.publicId)
        return [...ids, ...attachmentIds]
      }
      return ids
    }, [])

    // Nettoyer les fichiers inutilisés
    const cleanupResult = await cleanupUnusedFiles(usedPublicIds)

    return NextResponse.json({
      message: `${cleanupResult.totalDeleted} fichiers inutilisés ont été supprimés`,
      details: cleanupResult,
    })
  } catch (error) {
    console.error("Error cleaning up unused files:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
