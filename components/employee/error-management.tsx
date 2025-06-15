"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus, AlertTriangle, CheckCircle, Clock, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ErrorItem {
  _id: string
  title: string
  description: string
  status: "pending" | "in-progress" | "resolved"
  priority: "low" | "medium" | "high"
  category?: string
  resolution?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export function ErrorManagement() {
  const { toast } = useToast()
  const [errors, setErrors] = useState<ErrorItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedError, setSelectedError] = useState<ErrorItem | null>(null)
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false)

  // Formulaire nouvelle erreur
  const [newError, setNewError] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
  })

  // Résolution d'erreur
  const [resolution, setResolution] = useState("")

  useEffect(() => {
    fetchErrors()
  }, [])

  const fetchErrors = async () => {
    try {
      const response = await fetch("/api/errors")
      const data = await response.json()

      if (response.ok) {
        setErrors(data.errors)
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Impossible de récupérer les erreurs",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching errors:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitError = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newError.title.trim() || !newError.description.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre et la description sont requis",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newError),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Erreur signalée avec succès",
        })
        setNewError({ title: "", description: "", priority: "medium", category: "" })
        setIsDialogOpen(false)
        fetchErrors()
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Impossible de signaler l'erreur",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting error:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (errorId: string, status: string) => {
    try {
      const response = await fetch(`/api/errors/${errorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Statut mis à jour",
        })
        fetchErrors()
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Impossible de mettre à jour le statut",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      })
    }
  }

  const handleResolveError = async () => {
    if (!selectedError || !resolution.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez décrire comment l'erreur a été résolue",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/errors/${selectedError._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "resolved",
          resolution,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Erreur marquée comme résolue",
        })
        setIsResolveDialogOpen(false)
        setSelectedError(null)
        setResolution("")
        fetchErrors()
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Impossible de résoudre l'erreur",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error resolving error:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      })
    }
  }

  const handleDeleteError = async (errorId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette erreur ?")) {
      return
    }

    try {
      const response = await fetch(`/api/errors/${errorId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Erreur supprimée",
        })
        fetchErrors()
      } else {
        const data = await response.json()
        toast({
          title: "Erreur",
          description: data.message || "Impossible de supprimer l'erreur",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting error:", error)
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertTriangle className="h-4 w-4" />
      case "in-progress":
        return <Clock className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "destructive"
      case "in-progress":
        return "default"
      case "resolved":
        return "secondary"
      default:
        return "default"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const filteredErrors = (status: string) => {
    if (status === "all") return errors
    return errors.filter((error) => error.status === status)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des erreurs</h2>
          <p className="text-muted-foreground">Signalez et suivez vos erreurs techniques</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Signaler une erreur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Signaler une nouvelle erreur</DialogTitle>
              <DialogDescription>Décrivez l'erreur rencontrée pour qu'elle puisse être traitée</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitError} className="space-y-4">
              <div>
                <Label htmlFor="title">Titre de l'erreur</Label>
                <Input
                  id="title"
                  value={newError.title}
                  onChange={(e) => setNewError({ ...newError, title: e.target.value })}
                  placeholder="Résumé court de l'erreur"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description détaillée</Label>
                <Textarea
                  id="description"
                  value={newError.description}
                  onChange={(e) => setNewError({ ...newError, description: e.target.value })}
                  placeholder="Décrivez l'erreur en détail, les étapes pour la reproduire, etc."
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={newError.priority}
                    onValueChange={(value) => setNewError({ ...newError, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Catégorie (optionnel)</Label>
                  <Input
                    id="category"
                    value={newError.category}
                    onChange={(e) => setNewError({ ...newError, category: e.target.value })}
                    placeholder="Ex: Interface, Performance, Bug"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Envoi..." : "Signaler"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Toutes ({errors.length})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({filteredErrors("pending").length})</TabsTrigger>
          <TabsTrigger value="in-progress">En cours ({filteredErrors("in-progress").length})</TabsTrigger>
          <TabsTrigger value="resolved">Résolues ({filteredErrors("resolved").length})</TabsTrigger>
        </TabsList>

        {["all", "pending", "in-progress", "resolved"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filteredErrors(status).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Aucune erreur trouvée</p>
                </CardContent>
              </Card>
            ) : (
              filteredErrors(status).map((error) => (
                <Card key={error._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{error.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(error.status)}>
                            {getStatusIcon(error.status)}
                            <span className="ml-1 capitalize">{error.status}</span>
                          </Badge>
                          <Badge variant={getPriorityColor(error.priority)}>Priorité {error.priority}</Badge>
                          {error.category && <Badge variant="outline">{error.category}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {error.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(error._id, "in-progress")}
                          >
                            Commencer
                          </Button>
                        )}
                        {error.status === "in-progress" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedError(error)
                              setIsResolveDialogOpen(true)
                            }}
                          >
                            Marquer comme résolu
                          </Button>
                        )}
                        {error.status === "pending" && (
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteError(error._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{error.description}</p>
                    {error.resolution && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Résolution :</p>
                        <p className="text-sm text-green-700 dark:text-green-300">{error.resolution}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                      <span>Créée le {format(new Date(error.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}</span>
                      {error.resolvedAt && (
                        <span>
                          Résolue le {format(new Date(error.resolvedAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog de résolution */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer l'erreur comme résolue</DialogTitle>
            <DialogDescription>Expliquez comment vous avez résolu cette erreur</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution">Solution appliquée</Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Décrivez les étapes que vous avez suivies pour résoudre l'erreur..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleResolveError}>Marquer comme résolu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
