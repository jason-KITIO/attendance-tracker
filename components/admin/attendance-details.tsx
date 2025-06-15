"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, FileText, ImageIcon, Paperclip } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MarkdownDisplay } from "@/components/markdown-display"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"

interface AttendanceDetailsProps {
  employeeId: string
}

export function AttendanceDetails({ employeeId }: AttendanceDetailsProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchAttendanceRecords()
  }, [employeeId])

  const fetchAttendanceRecords = async () => {
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}/attendance`)
      const data = await response.json()

      if (response.ok) {
        setAttendanceRecords(data.attendance)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch attendance records",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewReport = (record: any) => {
    setSelectedRecord(record)
    setIsDialogOpen(true)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (attendanceRecords.length === 0) {
    return <p className="py-4">No attendance records found for this employee.</p>
  }

  return (
    <div className="lg:space-y-4 lg:w-full lg:px-0 sm:w-screen sm:px-2 overflow-auto max-h-[80vh] overflow-y-auto">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Makeup Time</TableHead>
              <TableHead>Overtime</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceRecords.map((record) => (
              <TableRow key={record._id}>
                <TableCell>{format(new Date(record.checkIn), "MMM d, yyyy")}</TableCell>
                <TableCell>{format(new Date(record.checkIn), "h:mm a")}</TableCell>
                <TableCell>{record.checkOut ? format(new Date(record.checkOut), "h:mm a") : "-"}</TableCell>
                <TableCell>
                  {record.isLate ? (
                    <span className="text-amber-600">Late</span>
                  ) : (
                    <span className="text-green-600">On Time</span>
                  )}
                </TableCell>
                <TableCell className="capitalize">{record.makeupTime || "-"}</TableCell>
                <TableCell>
                  {record.overtimeHours ? (
                    <span className="text-blue-600">
                      {record.overtimeHours.toFixed(1)}h{record.isWeekendOvertime ? " (weekend)" : ""}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReport(record)}
                    disabled={!record.dailyReport && (!record.attachments || record.attachments.length === 0)}
                  >
                    View Report
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Daily Report</DialogTitle>
            <DialogDescription>
              {selectedRecord && format(new Date(selectedRecord.checkIn), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh] rounded-md">
            {selectedRecord && (
              <div className="space-y-4 p-4">
                {selectedRecord.dailyReport ? (
                  <MarkdownDisplay content={selectedRecord.dailyReport} className="prose-sm" />
                ) : (
                  <p className="text-muted-foreground">No report submitted</p>
                )}

                {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRecord.attachments.map((attachment: any, index: number) => (
                        <Card key={index} className="overflow-hidden">
                          <CardContent className="p-3">
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                              {getFileIcon(attachment.type)}
                              <span className="truncate">{attachment.name}</span>
                            </a>

                            {attachment.type.startsWith("image/") && (
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                                <img
                                  src={attachment.url || "/placeholder.svg"}
                                  alt={attachment.name}
                                  className="max-h-40 object-contain rounded-md mx-auto"
                                />
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
