"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface AttendanceDetailsProps {
  employeeId: string;
}

export function AttendanceDetails({ employeeId }: AttendanceDetailsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [employeeId]);

  const fetchAttendanceRecords = async () => {
    try {
      const response = await fetch(
        `/api/admin/employees/${employeeId}/attendance`
      );
      const data = await response.json();

      if (response.ok) {
        setAttendanceRecords(data.attendance);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch attendance records",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReport = (record: any) => {
    setSelectedRecord(record);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (attendanceRecords.length === 0) {
    return (
      <p className="py-4">No attendance records found for this employee.</p>
    );
  }

  return (
    <div className="lg:space-y-4 lg:w-full lg:px-0 sm:w-screen sm:px-4 overflow-auto">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Makeup Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceRecords.map((record) => (
              <TableRow key={record._id}>
                <TableCell>
                  {format(new Date(record.checkIn), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {format(new Date(record.checkIn), "h:mm a")}
                </TableCell>
                <TableCell>
                  {record.checkOut
                    ? format(new Date(record.checkOut), "h:mm a")
                    : "-"}
                </TableCell>
                <TableCell>
                  {record.isLate ? (
                    <span className="text-amber-600">Late</span>
                  ) : (
                    <span className="text-green-600">On Time</span>
                  )}
                </TableCell>
                <TableCell className="capitalize">
                  {record.makeupTime || "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReport(record)}
                    disabled={!record.dailyReport}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daily Report</DialogTitle>
            <DialogDescription>
              {selectedRecord &&
                format(new Date(selectedRecord.checkIn), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <Textarea
              value={selectedRecord.dailyReport || "No report submitted"}
              readOnly
              rows={8}
              className="resize-none"
            />
          )}
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
