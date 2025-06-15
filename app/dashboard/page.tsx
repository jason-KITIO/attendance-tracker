"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { format, startOfMonth, endOfMonth, getMonth, getYear, parseISO, getDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { MarkdownEditor } from "@/components/markdown-editor"
import { MarkdownDisplay } from "@/components/markdown-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorManagement } from "@/components/employee/error-management"

export default function DashboardPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [dailyReport, setDailyReport] = useState("")
  const [makeupTime, setMakeupTime] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([])
  const [workingDaysInMonth, setWorkingDaysInMonth] = useState(0)

  useEffect(() => {
    if (session?.user?.id) {
      fetchTodayAttendance()
      fetchMonthlyAttendance(currentMonth)
    }
  }, [session, currentMonth])

  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch("/api/attendance/today")
      const data = await response.json()

      if (response.ok && data.attendance) {
        setTodayAttendance(data.attendance)
        if (data.attendance.dailyReport) {
          setDailyReport(data.attendance.dailyReport)
        }
        if (data.attendance.makeupTime) {
          setMakeupTime(data.attendance.makeupTime)
        }
        if (data.attendance.attachments) {
          setAttachments(data.attendance.attachments)
        }
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
      toast({
        title: "Error",
        description: "Failed to fetch today's attendance",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMonthlyAttendance = async (date: Date) => {
    try {
      const month = getMonth(date)
      const year = getYear(date)

      const response = await fetch(`/api/attendance/monthly?month=${month}&year=${year}`)
      const data = await response.json()

      if (response.ok) {
        setMonthlyAttendance(data.attendance)

        // Calculate working days in month (Monday to Friday)
        const start = startOfMonth(date)
        const end = endOfMonth(date)
        let days = 0
        const current = new Date(start)

        while (current <= end) {
          // getDay returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
          const dayOfWeek = getDay(current)
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            days++
          }
          current.setDate(current.getDate() + 1)
        }

        setWorkingDaysInMonth(days)
      }
    } catch (error) {
      console.error("Error fetching monthly attendance:", error)
      toast({
        title: "Error",
        description: "Failed to fetch monthly attendance",
        variant: "destructive",
      })
    }
  }

  const handleCheckIn = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setTodayAttendance(data.attendance)
        toast({
          title: "Success",
          description: "Check-in recorded successfully",
        })

        // Check if late
        if (data.attendance.isLate) {
          toast({
            title: "Late Check-in",
            description: "Please select when you'll make up the time",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to check in",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Check-in error:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAttachmentUpload = async (files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    const data = await response.json()
    setAttachments((prev) => [...prev, ...data.files])
    return data.files.map((file: any) => file.url)
  }

  const handleCheckOut = async () => {
    if (!dailyReport.trim()) {
      toast({
        title: "Error",
        description: "Please provide a daily report before checking out",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailyReport,
          attachments,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTodayAttendance(data.attendance)
        toast({
          title: "Success",
          description: "Check-out recorded successfully",
        })

        // Show overtime notification if applicable
        if (data.attendance.overtimeHours > 0) {
          toast({
            title: "Overtime Recorded",
            description: `You've worked ${data.attendance.overtimeHours} hours of overtime today.`,
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to check out",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Check-out error:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMakeupTimeSubmit = async () => {
    if (!makeupTime) {
      toast({
        title: "Error",
        description: "Please select when you'll make up the time",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/attendance/makeup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          makeupTime,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTodayAttendance(data.attendance)
        toast({
          title: "Success",
          description: "Makeup time recorded successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to record makeup time",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Makeup time error:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const changeMonth = (increment: number) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + increment)
    setCurrentMonth(newMonth)
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
      <h1 className="text-3xl font-bold mb-6">Employee Dashboard</h1>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          {/* <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="ranking">Employee Ranking</TabsTrigger> */}
          <TabsTrigger value="errors">Error Management</TabsTrigger>
        </TabsList>
        <TabsContent value="employees">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance</CardTitle>
                <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
              </CardHeader>
              <CardContent>
                {todayAttendance ? (
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Check-in Time:</p>
                      <p>{format(new Date(todayAttendance.checkIn), "h:mm a")}</p>
                    </div>

                    {todayAttendance.isLate && !todayAttendance.makeupTime && (
                      <div className="space-y-2">
                        <p className="text-destructive font-medium">
                          You checked in late. Please select when you'll make up the time:
                        </p>
                        <RadioGroup value={makeupTime || ""} onValueChange={setMakeupTime}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="evening" id="evening" />
                            <Label htmlFor="evening">This Evening</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="saturday" id="saturday" />
                            <Label htmlFor="saturday">Saturday</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sunday" id="sunday" />
                            <Label htmlFor="sunday">Sunday</Label>
                          </div>
                        </RadioGroup>
                        <Button onClick={handleMakeupTimeSubmit} disabled={isSubmitting || !makeupTime}>
                          {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                      </div>
                    )}

                    {todayAttendance.isLate && todayAttendance.makeupTime && (
                      <div>
                        <p className="font-medium">Makeup Time:</p>
                        <p className="capitalize">{todayAttendance.makeupTime}</p>
                      </div>
                    )}

                    {todayAttendance.checkOut && (
                      <div>
                        <p className="font-medium">Check-out Time:</p>
                        <p>{format(new Date(todayAttendance.checkOut), "h:mm a")}</p>

                        {todayAttendance.overtimeHours > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-green-600">
                              Overtime Hours: {todayAttendance.overtimeHours} hours
                              {todayAttendance.isWeekendOvertime && " (Weekend)"}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!todayAttendance.checkOut && (
                      <div className="space-y-2">
                        <p className="font-medium">Daily Report:</p>
                        <MarkdownEditor
                          value={dailyReport}
                          onChange={setDailyReport}
                          onAttachmentUpload={handleAttachmentUpload}
                        />

                        {attachments.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Attachments:</p>
                            <ul className="list-disc pl-5">
                              {attachments.map((attachment, index) => (
                                <li key={index}>
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 underline"
                                  >
                                    {attachment.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No attendance recorded for today.</p>
                )}
              </CardContent>
              <CardFooter>
                {!todayAttendance ? (
                  <Button onClick={handleCheckIn} disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Processing..." : "Check In"}
                  </Button>
                ) : !todayAttendance.checkOut ? (
                  <Button
                    onClick={handleCheckOut}
                    disabled={
                      isSubmitting || !dailyReport.trim() || (todayAttendance.isLate && !todayAttendance.makeupTime)
                    }
                    className="w-full"
                  >
                    {isSubmitting ? "Processing..." : "Check Out"}
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    Attendance Completed
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card className="h-[70vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Monthly Attendance</CardTitle>
                  <CardDescription>{format(currentMonth, "MMMM yyyy", { locale: fr })}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Attendance: <span className="font-medium">{monthlyAttendance.length}</span> / {workingDaysInMonth}{" "}
                    working days
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Completion:{" "}
                    <span className="font-medium">
                      {workingDaysInMonth > 0 ? Math.round((monthlyAttendance.length / workingDaysInMonth) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <MonthlyAttendance attendance={monthlyAttendance} workingDays={workingDaysInMonth} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* <TabsContent value="statistics">
          <div>Statistics Content</div>
        </TabsContent>
        <TabsContent value="ranking">
          <div>Ranking Content</div>
        </TabsContent> */}
        <TabsContent value="errors">
          <ErrorManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MonthlyAttendance({ attendance, workingDays }: { attendance: any[]; workingDays: number }) {
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  if (attendance.length === 0) {
    return <p>No attendance records found for this month.</p>
  }

  const totalOvertimeHours = attendance.reduce((total, record) => {
    return total + (record.overtimeHours || 0)
  }, 0)

  const regularOvertimeHours = attendance.reduce((total, record) => {
    return total + (!record.isWeekendOvertime ? record.overtimeHours || 0 : 0)
  }, 0)

  const weekendOvertimeHours = attendance.reduce((total, record) => {
    return total + (record.isWeekendOvertime ? record.overtimeHours || 0 : 0)
  }, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">Regular Overtime</div>
            <div className="text-2xl font-bold">{regularOvertimeHours}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium">Weekend Overtime</div>
            <div className="text-2xl font-bold">{weekendOvertimeHours}h</div>
          </CardContent>
        </Card>
      </div>

      {attendance.map((record) => (
        <div key={record._id} className="border rounded-lg p-3">
          <div className="flex justify-between items-center">
            <p className="font-medium">
              {format(parseISO(record.checkIn), "EEEE, d MMMM", { locale: fr })}
              {record.isWeekendOvertime && <span className="ml-2 text-amber-500 text-xs">(Weekend)</span>}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRecord(record === selectedRecord ? null : record)}
            >
              {record === selectedRecord ? "Hide Details" : "View Details"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div>
              <p className="text-muted-foreground">Check In:</p>
              <p>{format(parseISO(record.checkIn), "HH:mm")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Check Out:</p>
              <p>{record.checkOut ? format(parseISO(record.checkOut), "HH:mm") : "Not checked out"}</p>
            </div>

            {record.isLate && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Makeup Time:</p>
                <p className="capitalize">{record.makeupTime || "Not specified"}</p>
              </div>
            )}

            {record.overtimeHours > 0 && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Overtime:</p>
                <p className="text-green-600 font-medium">{record.overtimeHours} hours</p>
              </div>
            )}
          </div>

          {selectedRecord === record && record.dailyReport && (
            <div className="mt-4 border-t pt-2">
              <p className="font-medium mb-1">Daily Report:</p>
              <MarkdownDisplay content={record.dailyReport} className="text-sm" />

              {record.attachments && record.attachments.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Attachments:</p>
                  <ul className="list-disc pl-5">
                    {record.attachments.map((attachment: any, index: number) => (
                      <li key={index}>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {attachment.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
