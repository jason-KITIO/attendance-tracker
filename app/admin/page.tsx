"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Users, Clock, Calendar, Download } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { EmployeeList } from "@/components/admin/employee-list"
import { AttendanceStats } from "@/components/admin/attendance-stats"
import { EmployeeRanking } from "@/components/admin/employee-ranking"
import { AdminErrorManagement } from "@/components/admin/error-management"

export default function AdminDashboard() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
  })

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch dashboard stats",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/admin/export")

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Export failed")
      }

      // Create a blob from the response
      const blob = await response.blob()

      // Create a link to download the file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `attendance-export-${format(new Date(), "yyyy-MM-dd")}.csv`

      // Append to the document and trigger the download
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Data exported successfully",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Export failed",
        variant: "destructive",
      })
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lateToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absentToday}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees">
        <TabsList className="mb-4">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="ranking">Employee Ranking</TabsTrigger>
          <TabsTrigger value="errors">Error Management</TabsTrigger>
        </TabsList>
        <TabsContent value="employees">
          <EmployeeList />
        </TabsContent>
        <TabsContent value="statistics">
          <AttendanceStats />
        </TabsContent>
        <TabsContent value="ranking">
          <EmployeeRanking />
        </TabsContent>
        <TabsContent value="errors">
          <AdminErrorManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
