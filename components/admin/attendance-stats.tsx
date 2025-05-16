"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function AttendanceStats() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>({
    latesByDay: [],
    latesByWeek: [],
    latesByMonth: [],
    attendanceDistribution: [],
    averageWorkHours: [],
    overtimeByEmployee: [],
  })
  const [timeRange, setTimeRange] = useState("day")

  useEffect(() => {
    fetchAttendanceStats()
  }, [])

  const fetchAttendanceStats = async () => {
    try {
      const response = await fetch("/api/admin/attendance-stats")
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch attendance statistics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching attendance statistics:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Late Arrivals</CardTitle>
          <CardDescription>Number of late arrivals over time</CardDescription>
          <TabsList>
            <TabsTrigger value="day" onClick={() => setTimeRange("day")}>
              Daily
            </TabsTrigger>
            <TabsTrigger value="week" onClick={() => setTimeRange("week")}>
              Weekly
            </TabsTrigger>
            <TabsTrigger value="month" onClick={() => setTimeRange("month")}>
              Monthly
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  timeRange === "day" ? stats.latesByDay : timeRange === "week" ? stats.latesByWeek : stats.latesByMonth
                }
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
            <CardDescription>Distribution of on-time, late, and absent employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.attendanceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.attendanceDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Work Hours</CardTitle>
            <CardDescription>Average hours worked per employee</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.averageWorkHours}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" scale="band" width={50} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overtime Hours (Current Month)</CardTitle>
          <CardDescription>Regular and weekend overtime hours by employee</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Regular Hours</TableHead>
                <TableHead>Weekend Hours</TableHead>
                <TableHead>Total Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.overtimeByEmployee &&
                stats.overtimeByEmployee.map((employee: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.regularHours.toFixed(1)}</TableCell>
                    <TableCell>{employee.weekendHours.toFixed(1)}</TableCell>
                    <TableCell className="font-bold">{employee.totalHours.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              {(!stats.overtimeByEmployee || stats.overtimeByEmployee.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No overtime data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
