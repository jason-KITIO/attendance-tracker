"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [dailyReport, setDailyReport] = useState("")
  const [makeupTime, setMakeupTime] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchTodayAttendance()
    }
  }, [session])

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
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTodayAttendance(data.attendance)
        toast({
          title: "Success",
          description: "Check-out recorded successfully",
        })
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
                  </div>
                )}

                {!todayAttendance.checkOut && (
                  <div className="space-y-2">
                    <p className="font-medium">Daily Report:</p>
                    <Textarea
                      placeholder="What did you accomplish today?"
                      value={dailyReport}
                      onChange={(e) => setDailyReport(e.target.value)}
                      rows={4}
                    />
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your attendance history</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentAttendance />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RecentAttendance() {
  const [recentAttendance, setRecentAttendance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentAttendance = async () => {
      try {
        const response = await fetch("/api/attendance/recent")
        const data = await response.json()

        if (response.ok) {
          setRecentAttendance(data.attendance)
        }
      } catch (error) {
        console.error("Error fetching recent attendance:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentAttendance()
  }, [])

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
  }

  if (recentAttendance.length === 0) {
    return <p>No recent attendance records found.</p>
  }

  return (
    <div className="space-y-4">
      {recentAttendance.map((record) => (
        <div key={record._id} className="border rounded-lg p-3">
          <p className="font-medium">{format(new Date(record.checkIn), "EEEE, MMMM d")}</p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div>
              <p className="text-muted-foreground">Check In:</p>
              <p>{format(new Date(record.checkIn), "h:mm a")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Check Out:</p>
              <p>{record.checkOut ? format(new Date(record.checkOut), "h:mm a") : "Not checked out"}</p>
            </div>
            {record.isLate && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Makeup Time:</p>
                <p className="capitalize">{record.makeupTime || "Not specified"}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

