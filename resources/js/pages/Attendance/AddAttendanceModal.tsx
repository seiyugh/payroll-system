"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface Employee {
  id: number
  employee_number: string
  full_name: string
  daily_rate: number
}

interface AddAttendanceModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
  employees: Employee[]
}

const AddAttendanceModal = ({ onClose, onSubmit, employees }: AddAttendanceModalProps) => {
  const [formData, setFormData] = useState({
    employee_number: "",
    work_date: new Date().toISOString().split("T")[0],
    status: "Present",
    daily_rate: "",
    adjustment: "0",
  })

  const [errors, setErrors] = useState({
    employee_number: "",
    work_date: "",
    status: "",
    daily_rate: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  // Handle employee selection
  const handleEmployeeChange = (employeeNumber: string) => {
    const employee = employees.find((e) => e.employee_number === employeeNumber)
    if (employee) {
      setSelectedEmployee(employee)
      setFormData((prev) => ({
        ...prev,
        employee_number: employee.employee_number,
        daily_rate: String(employee.daily_rate),
      }))
    }
  }

  // Set today's date
  const setToday = () => {
    setFormData((prev) => ({
      ...prev,
      work_date: new Date().toISOString().split("T")[0],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate form
    let hasErrors = false
    const newErrors = { ...errors }

    if (!formData.employee_number) {
      newErrors.employee_number = "Employee is required"
      hasErrors = true
    }

    if (!formData.work_date) {
      newErrors.work_date = "Date is required"
      hasErrors = true
    }

    if (!formData.status) {
      newErrors.status = "Status is required"
      hasErrors = true
    }

    if (!formData.daily_rate) {
      newErrors.daily_rate = "Daily rate is required"
      hasErrors = true
    }

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    // Format data for submission with proper number parsing
    const formattedData = {
      ...formData,
      daily_rate: Number.parseFloat(formData.daily_rate) || 0, // Ensure it's a number or default to 0
      adjustment: formData.adjustment ? Number.parseFloat(formData.adjustment) || 0 : 0, // Ensure it's a number or default to 0
    }

    try {
      onSubmit(formattedData)
    } catch (error) {
      console.error("Error adding attendance:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Attendance Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select onValueChange={handleEmployeeChange} defaultValue={formData.employee_number}>
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.employee_number}>
                    {employee.full_name} ({employee.employee_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employee_number && <p className="text-sm text-red-500">{errors.employee_number}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="date">Date</Label>
              <Button type="button" variant="outline" size="sm" onClick={setToday} className="text-xs h-7">
                <Calendar className="h-3 w-3 mr-1" />
                Today
              </Button>
            </div>
            <Input
              id="date"
              name="work_date"
              type="date"
              value={formData.work_date}
              onChange={handleChange}
              className="w-full"
              required
            />
            {errors.work_date && <p className="text-sm text-red-500">{errors.work_date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              defaultValue={formData.status}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Day Off">Day Off</SelectItem>
                <SelectItem value="Holiday">Holiday</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily_rate">Daily Rate</Label>
            <Input
              id="daily_rate"
              name="daily_rate"
              type="number"
              step="0.01"
              value={formData.daily_rate}
              onChange={handleChange}
              className="w-full"
              required
            />
            {errors.daily_rate && <p className="text-sm text-red-500">{errors.daily_rate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment">Adjustment</Label>
            <Input
              id="adjustment"
              name="adjustment"
              type="number"
              step="0.01"
              value={formData.adjustment}
              onChange={handleChange}
              className="w-full"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Use positive or negative values for adjustments
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddAttendanceModal

