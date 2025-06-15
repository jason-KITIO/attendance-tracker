import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCloudinaryUsage } from "@/lib/cloudinary"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Vérifier si l'utilisateur est un administrateur
    const isAdmin = session.user.role === "admin"

    // Obtenir les statistiques d'utilisation
    const usage = await getCloudinaryUsage(isAdmin ? undefined : session.user.id)

    return NextResponse.json(usage)
  } catch (error) {
    console.error("Error fetching storage usage:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
