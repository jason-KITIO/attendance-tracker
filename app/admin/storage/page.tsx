"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, RefreshCw, FileIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function StorageManagementPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isCleaning, setIsCleaning] = useState(false)
  const [usage, setUsage] = useState<any>(null)

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/storage/usage")
      const data = await response.json()

      if (response.ok) {
        setUsage(data)
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Impossible de récupérer les statistiques d'utilisation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching usage:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la récupération des statistiques",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const cleanupUnusedFiles = async () => {
    setIsCleaning(true)
    try {
      const response = await fetch("/api/storage/cleanup", {
        method: "POST",
      })
      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Nettoyage terminé",
          description: data.message,
        })
        // Rafraîchir les statistiques
        fetchUsage()
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Impossible de nettoyer les fichiers inutilisés",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cleaning up files:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du nettoyage des fichiers",
        variant: "destructive",
      })
    } finally {
      setIsCleaning(false)
    }
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion du stockage</h1>
        <Button onClick={fetchUsage} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Utilisation totale</CardTitle>
            <CardDescription>Espace utilisé sur Cloudinary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {usage?.globalUsage?.credits?.usage?.storage
                ? formatBytes(usage.globalUsage.credits.usage.storage)
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Nombre de fichiers</CardTitle>
            <CardDescription>Total des fichiers stockés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{usage?.globalUsage?.resources?.total || "N/A"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Bande passante</CardTitle>
            <CardDescription>Utilisation ce mois-ci</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {usage?.globalUsage?.bandwidth ? formatBytes(usage.globalUsage.bandwidth.usage) : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {usage?.userUsage && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Fichiers par utilisateur</CardTitle>
            <CardDescription>
              {usage.userUsage.fileCount} fichiers, {formatBytes(usage.userUsage.totalBytes)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usage.userUsage.resources.map((resource: any) => (
                <div key={resource.public_id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {resource.resource_type === "image" ? (
                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img
                          src={resource.secure_url || "/placeholder.svg"}
                          alt={resource.public_id.split("/").pop()}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                        <FileIcon className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium truncate max-w-xs">{resource.public_id.split("/").pop()}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(resource.bytes)} •{" "}
                        {format(new Date(resource.created_at), "dd MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
          <CardDescription>Nettoyer les fichiers inutilisés</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Cette opération supprimera tous les fichiers qui ne sont plus référencés dans les rapports des employés.
            Cette action est irréversible.
          </p>
          <Button onClick={cleanupUnusedFiles} variant="destructive" disabled={isCleaning}>
            {isCleaning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Nettoyage en cours...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Nettoyer les fichiers inutilisés
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
