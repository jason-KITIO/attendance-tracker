"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

export function EmployeeRanking() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [rankings, setRankings] = useState<any[]>([])

  useEffect(() => {
    fetchEmployeeRankings()
  }, [])

  const fetchEmployeeRankings = async () => {
    try {
      const response = await fetch("/api/admin/employee-rankings")
      const data = await response.json()

      if (response.ok) {
        setRankings(data.rankings)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch employee rankings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching employee rankings:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Rankings</CardTitle>
        <CardDescription>Employees ranked by attendance and punctuality</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>On-Time Days</TableHead>
              <TableHead>Late Days</TableHead>
              <TableHead>Absent Days</TableHead>
              <TableHead>Average Work Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((employee, index) => (
              <TableRow key={employee._id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.onTimeDays}</TableCell>
                <TableCell>{employee.lateDays}</TableCell>
                <TableCell>{employee.absentDays}</TableCell>
                <TableCell>{employee.averageWorkHours.toFixed(2)} hours</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

