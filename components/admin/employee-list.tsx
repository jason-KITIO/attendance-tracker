"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, Eye } from "lucide-react";
import { format } from "date-fns";
import { AttendanceDetails } from "./attendance-details";

export function EmployeeList() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEmployees(
        employees.filter(
          (employee) =>
            employee.name.toLowerCase().includes(query) ||
            employee.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, employees]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/admin/employees");
      const data = await response.json();

      if (response.ok) {
        setEmployees(data.employees);
        setFilteredEmployees(data.employees);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch employees",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAttendance = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status Today</TableHead>
              <TableHead>Check-in Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell className="capitalize">{employee.role}</TableCell>
                  <TableCell>
                    {employee.todayAttendance ? (
                      employee.todayAttendance.checkOut ? (
                        <span className="text-green-600">Checked Out</span>
                      ) : (
                        <span className="text-blue-600">Present</span>
                      )
                    ) : (
                      <span className="text-red-600">Absent</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.todayAttendance
                      ? format(
                          new Date(employee.todayAttendance.checkIn),
                          "h:mm a"
                        )
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewAttendance(employee)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="lg:max-w-3xl lg:px-3 lg:py-4 sm:w-screen sm:p-0 sm:py-3">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.name}&apos;s attendance records
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <AttendanceDetails employeeId={selectedEmployee._id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
