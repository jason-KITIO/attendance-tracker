"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Search, AlertTriangle, CheckCircle, Clock, Users, AlertCircle, Eye, Edit, Filter } from "lucide-react"
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
  employee: {
    _id: string
    name: string
    email: string
  }
}

interface ErrorStats {
  totalErrors: number
  pendingErrors: number
  inProgressErrors: number
  resolvedErrors: number
  highPriorityErrors: number
  mediumPriorityErrors: number
  lowPriorityErrors: number
  errorsByEmployee: Array<{
    _id: string
    name: string
    count: number
    pending: number
    resolved: number
  }>
}

export function AdminErrorManagement() {
  const { toast } = useToast()
  const [errors, setErrors] = useState<ErrorItem[]>([])
  const [filteredErrors, setFilteredErrors] = useState<ErrorItem[]>([])
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedError, setSelectedError] = useState<ErrorItem | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState("")
  const [adminNotes, setAdminNotes] = useState("")

  useEffect(() => {
    fetchErrors()
    fetchStats()
  }, [])

  useEffect(() => {
    filterErrors()
  }, [errors, searchQuery, statusFilter, priorityFilter, employeeFilter, categoryFilter, dateFilter])

  const fetchErrors = async () => {
    try {
      const response = await fetch("/api/errors")
      const data = await response.json()

      if (response.ok) {
        setErrors(data.errors || [])
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

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/errors/stats")
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const filterErrors = () => {
    let filtered = errors

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (error) =>
          error.title.toLowerCase().includes(query) ||
          error.description.toLowerCase().includes(query) ||
          error.employee?.name.toLowerCase().includes(query) ||
          error.category?.toLowerCase().includes(query),
      )
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((error) => error.status === statusFilter)
    }

    // Filtre par priorité
    if (priorityFilter !== "all") {
      filtered = filtered.filter((error) => error.priority === priorityFilter)
    }

    // Filtre par employé
    if (employeeFilter !== "all") {
      filtered = filtered.filter((error) => error.employee?._id === employeeFilter)
    }

    // Filtre par catégorie
    if (categoryFilter !== "all") {
      filtered = filtered.filter((error) => error.category === categoryFilter)
    }

    // Filtre par date
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((error) => new Date(error.createdAt) >= filterDate)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((error) => new Date(error.createdAt) >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((error) => new Date(error.createdAt) >= filterDate)
          break
      }
    }

    setFilteredErrors(filtered)
  }

  const updateErrorStatus = async (errorId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/errors/${errorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: notes,
          resolvedAt: newStatus === "resolved" ? new Date().toISOString() : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Statut de l'erreur mis à jour",
        })
        fetchErrors()
        fetchStats()
        setIsUpdateDialogOpen(false)
        setSelectedError(null)
        setUpdateStatus("")
        setAdminNotes("")
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Impossible de mettre à jour l'erreur",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating error:", error)
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

  const getUniqueEmployees = () => {
    const employees = errors.filter((error) => error.employee && error.employee._id).map((error) => error.employee)
    const unique = employees.filter((employee, index, self) => index === self.findIndex((e) => e._id === employee._id))
    return unique
  }

  const getUniqueCategories = () => {
    const categories = errors.filter((error) => error.category).map((error) => error.category!)
    return [...new Set(categories)]
  }

  const getErrorsByEmployee = () => {
    const employeeGroups = errors.reduce(
      (acc, error) => {
        if (!error.employee) return acc

        const employeeId = error.employee._id
        if (!acc[employeeId]) {
          acc[employeeId] = {
            employee: error.employee,
            errors: [],
            stats: {
              total: 0,
              pending: 0,
              inProgress: 0,
              resolved: 0,
            },
          }
        }

        acc[employeeId].errors.push(error)
        acc[employeeId].stats.total++

        switch (error.status) {
          case "pending":
            acc[employeeId].stats.pending++
            break
          case "in-progress":
            acc[employeeId].stats.inProgress++
            break
          case "resolved":
            acc[employeeId].stats.resolved++
            break
        }

        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(employeeGroups)
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
      <div>
        <h2 className="text-2xl font-bold">Gestion des erreurs</h2>
        <p className="text-muted-foreground">Vue d'ensemble et gestion des erreurs signalées par les employés</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des erreurs</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalErrors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.pendingErrors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.inProgressErrors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Résolues</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.resolvedErrors}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Erreurs par employé - Vue résumée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Erreurs par employé
          </CardTitle>
          <CardDescription>Résumé des erreurs signalées par chaque employé</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getErrorsByEmployee().map((employeeGroup: any) => (
              <Card key={employeeGroup.employee._id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{employeeGroup.employee.name}</h4>
                    <p className="text-sm text-muted-foreground">{employeeGroup.employee.email}</p>
                  </div>
                  <Badge variant="outline">{employeeGroup.stats.total} erreurs</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="text-destructive font-medium">{employeeGroup.stats.pending}</div>
                    <div className="text-muted-foreground">En attente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-orange-500 font-medium">{employeeGroup.stats.inProgress}</div>
                    <div className="text-muted-foreground">En cours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-500 font-medium">{employeeGroup.stats.resolved}</div>
                    <div className="text-muted-foreground">Résolues</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => setEmployeeFilter(employeeGroup.employee._id)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Voir les erreurs
                </Button>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtres avancés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Employé</Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les employés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {getUniqueEmployees().map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in-progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priorité</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les priorités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Catégorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {getUniqueCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Période</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les périodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(employeeFilter !== "all" ||
            statusFilter !== "all" ||
            priorityFilter !== "all" ||
            categoryFilter !== "all" ||
            dateFilter !== "all" ||
            searchQuery) && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEmployeeFilter("all")
                  setStatusFilter("all")
                  setPriorityFilter("all")
                  setCategoryFilter("all")
                  setDateFilter("all")
                  setSearchQuery("")
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste détaillée des erreurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des erreurs ({filteredErrors.length})</CardTitle>
          <CardDescription>
            {employeeFilter !== "all" && (
              <span className="text-primary">
                Filtré par employé: {getUniqueEmployees().find((e) => e._id === employeeFilter)?.name}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredErrors.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune erreur trouvée avec les filtres actuels</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Erreur</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredErrors.map((error) => (
                    <TableRow key={error._id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{error.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{error.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{error.employee?.name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{error.employee?.email || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(error.status)}>
                          {getStatusIcon(error.status)}
                          <span className="ml-1 capitalize">
                            {error.status === "pending"
                              ? "En attente"
                              : error.status === "in-progress"
                                ? "En cours"
                                : "Résolue"}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(error.priority)}>
                          {error.priority === "high" ? "Élevée" : error.priority === "medium" ? "Moyenne" : "Faible"}
                        </Badge>
                      </TableCell>
                      <TableCell>{error.category && <Badge variant="outline">{error.category}</Badge>}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(error.createdAt), "dd MMM yyyy", { locale: fr })}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(error.createdAt), "HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedError(error)
                              setIsDetailDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedError(error)
                              setUpdateStatus(error.status)
                              setIsUpdateDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour voir les détails */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'erreur</DialogTitle>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div>
                <Label className="font-medium">Titre</Label>
                <p className="text-sm mt-1">{selectedError.title}</p>
              </div>
              <div>
                <Label className="font-medium">Description</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedError.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Employé</Label>
                  <p className="text-sm mt-1">{selectedError.employee?.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p className="text-sm mt-1">{selectedError.employee?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="font-medium">Statut</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(selectedError.status)}>
                      {selectedError.status === "pending"
                        ? "En attente"
                        : selectedError.status === "in-progress"
                          ? "En cours"
                          : "Résolue"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Priorité</Label>
                  <div className="mt-1">
                    <Badge variant={getPriorityColor(selectedError.priority)}>
                      {selectedError.priority === "high"
                        ? "Élevée"
                        : selectedError.priority === "medium"
                          ? "Moyenne"
                          : "Faible"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Catégorie</Label>
                  <p className="text-sm mt-1">{selectedError.category || "Non spécifiée"}</p>
                </div>
              </div>
              <div>
                <Label className="font-medium">Date de création</Label>
                <p className="text-sm mt-1">
                  {format(new Date(selectedError.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>
              {selectedError.resolution && (
                <div>
                  <Label className="font-medium">Résolution</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedError.resolution}</p>
                </div>
              )}
              {selectedError.resolvedAt && (
                <div>
                  <Label className="font-medium">Date de résolution</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedError.resolvedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour mettre à jour le statut */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour l'erreur</DialogTitle>
            <DialogDescription>Modifier le statut de l'erreur et ajouter des notes administratives</DialogDescription>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div>
                <Label className="font-medium">Erreur</Label>
                <p className="text-sm mt-1">{selectedError.title}</p>
              </div>
              <div>
                <Label htmlFor="status">Nouveau statut</Label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in-progress">En cours</SelectItem>
                    <SelectItem value="resolved">Résolue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes administratives</Label>
                <Textarea
                  id="notes"
                  placeholder="Ajouter des notes sur cette erreur..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUpdateDialogOpen(false)
                    setSelectedError(null)
                    setUpdateStatus("")
                    setAdminNotes("")
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={() => updateErrorStatus(selectedError._id, updateStatus, adminNotes)}>
                  Mettre à jour
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
