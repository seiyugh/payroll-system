"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

interface Employee {
  id: number
  employee_number: string
  first_name: string
  last_name: string
  daily_rate: string
  department?: string
}

interface PayrollPeriod {
  id: number
  week_id: number
  period_start: string
  period_end: string
  payment_date: string
  status: string
}

interface AddPayrollModalProps {
  isOpen?: boolean
  onClose: () => void
  employees: Employee[]
  payrollPeriods: PayrollPeriod[]
  attendances?: any[] // Add this line
}

const AddPayrollModal = ({ isOpen = true, onClose, employees, payrollPeriods, attendances }: AddPayrollModalProps) => {
  const [formData, setFormData] = useState({
    employee_number: "",
    week_id: "",
    daily_rate: "",
    gross_pay: "0.00",
    sss_deduction: "0.00",
    philhealth_deduction: "0.00",
    pagibig_deduction: "0.00",
    tax_deduction: "0.00",
    cash_advance: "0.00",
    loan: "0.00",
    vat: "0.00",
    other_deductions: "0.00",
    total_deductions: "0.00",
    net_pay: "0.00",
    ytd_earnings: "0.00",
    thirteenth_month_pay: "0.00",
    status: "generated",
    short: "0.00",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [filteredEmployees, setFilteredEmployees] = useState(employees)
  const [isAllenOne, setIsAllenOne] = useState(false)
  const [selectedAttendances, setSelectedAttendances] = useState<any[]>([])
  const [daysWorked, setDaysWorked] = useState(0)
  const [isCalculatingFromAttendance, setIsCalculatingFromAttendance] = useState(true)

  // Calculate derived values when form data changes
  useEffect(() => {
    if (selectedEmployee) {
      // Set daily rate from selected employee
      setFormData((prev) => ({
        ...prev,
        daily_rate: selectedEmployee.daily_rate,
      }))
    }
  }, [selectedEmployee])

  // Filter employees based on search term
  useEffect(() => {
    if (employeeSearchTerm.trim() === "") {
      setFilteredEmployees(employees)
    } else {
      const searchTermLower = employeeSearchTerm.toLowerCase()
      const filtered = employees.filter(
        (emp) =>
          emp.employee_number.toLowerCase().includes(searchTermLower) ||
          emp.first_name.toLowerCase().includes(searchTermLower) ||
          emp.last_name.toLowerCase().includes(searchTermLower),
      )
      setFilteredEmployees(filtered)
    }
  }, [employeeSearchTerm, employees])

  // Calculate gross pay, deductions, and net pay
  useEffect(() => {
    const calculatePayroll = () => {
      try {
        // Parse values as numbers
        const dailyRate = Number.parseFloat(formData.daily_rate) || 0
        const sssDeduction = Number.parseFloat(formData.sss_deduction) || 0
        const philhealthDeduction = Number.parseFloat(formData.philhealth_deduction) || 0
        const pagibigDeduction = Number.parseFloat(formData.pagibig_deduction) || 0
        const taxDeduction = Number.parseFloat(formData.tax_deduction) || 0
        const cashAdvance = Number.parseFloat(formData.cash_advance) || 0
        const loan = Number.parseFloat(formData.loan) || 0
        const vat = Number.parseFloat(formData.vat) || 0
        const otherDeductions = Number.parseFloat(formData.other_deductions) || 0
        const short = Number.parseFloat(formData.short) || 0

        // Calculate gross pay (assuming 5 working days per week)
        const grossPay = dailyRate * 5

        // Calculate total deductions
        const totalDeductions =
          sssDeduction +
          philhealthDeduction +
          pagibigDeduction +
          taxDeduction +
          cashAdvance +
          loan +
          vat +
          otherDeductions +
          short

        // Calculate net pay
        const netPay = grossPay - totalDeductions

        // Update form data with calculated values
        setFormData((prev) => ({
          ...prev,
          gross_pay: grossPay.toFixed(2),
          total_deductions: totalDeductions.toFixed(2),
          net_pay: netPay.toFixed(2),
        }))
      } catch (error) {
        console.error("Error calculating payroll:", error)
      }
    }

    if (!isCalculatingFromAttendance) {
      calculatePayroll()
    }
  }, [
    formData.daily_rate,
    formData.sss_deduction,
    formData.philhealth_deduction,
    formData.pagibig_deduction,
    formData.tax_deduction,
    formData.cash_advance,
    formData.loan,
    formData.vat,
    formData.other_deductions,
    formData.short,
    isCalculatingFromAttendance,
  ])

  // Add this useEffect after the other useEffect hooks
  useEffect(() => {
    // Auto-select the first period if available and none is selected
    if (payrollPeriods.length > 0 && !formData.week_id) {
      // Find a pending period first
      const pendingPeriod = payrollPeriods.find((p) => p.status.toLowerCase() === "pending")

      if (pendingPeriod) {
        setFormData((prev) => ({
          ...prev,
          week_id: pendingPeriod.week_id.toString(),
        }))

        // Fetch attendance if employee is selected
        if (selectedEmployee) {
          setTimeout(fetchAttendanceRecords, 100)
        }
      } else {
        // If no pending period, use the first one
        setFormData((prev) => ({
          ...prev,
          week_id: payrollPeriods[0].week_id.toString(),
        }))

        // Fetch attendance if employee is selected
        if (selectedEmployee) {
          setTimeout(fetchAttendanceRecords, 100)
        }
      }
    }
  }, [payrollPeriods, selectedEmployee])

  // Add this useEffect to fetch attendance when period changes
  useEffect(() => {
    if (selectedEmployee && formData.week_id) {
      fetchAttendanceRecords()
    }
  }, [formData.week_id])

  // Fetch attendance records when employee and period are selected
  const fetchAttendanceRecords = async () => {
    if (!selectedEmployee || !formData.week_id) return

    try {
      // Find the selected period
      const period = payrollPeriods.find((p) => p.week_id.toString() === formData.week_id.toString())
      if (!period) return

      // Make API request to fetch attendance records
      const response = await fetch(
        `/api/attendance?employee_number=${selectedEmployee.employee_number}&start_date=${period.period_start}&end_date=${period.period_end}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch attendance records")
      }

      const data = await response.json()
      setSelectedAttendances(data.attendances || [])

      // Calculate days worked
      const workDays = data.attendances.filter(
        (record) => record.status.toLowerCase() === "present" || record.status.toLowerCase() === "half day",
      ).length

      setDaysWorked(workDays)

      // Calculate gross pay based on attendance
      calculateGrossPayFromAttendance(data.attendances)
    } catch (error) {
      console.error("Error fetching attendance records:", error)
      toast.error("Failed to fetch attendance records")
    }
  }

  // Calculate gross pay based on attendance records
  const calculateGrossPayFromAttendance = (attendanceRecords) => {
    if (!selectedEmployee || !attendanceRecords.length) return

    const dailyRate = Number.parseFloat(selectedEmployee.daily_rate) || 0
    let grossPay = 0

    attendanceRecords.forEach((record) => {
      const status = record.status.toLowerCase()
      const recordDailyRate = Number.parseFloat(record.daily_rate) || dailyRate
      const adjustment = Number.parseFloat(record.adjustment) || 0

      // Calculate pay based on status
      let amount = 0
      switch (status) {
        case "present":
          amount = recordDailyRate
          break
        case "half day":
          amount = recordDailyRate / 2
          break
        case "absent":
        case "day off":
          amount = 0
          break
        default:
          amount = recordDailyRate
          break
      }

      grossPay += amount + adjustment
    })

    setFormData((prev) => ({
      ...prev,
      gross_pay: grossPay.toFixed(2),
    }))
  }

  // Handle employee selection
  const handleEmployeeChange = (value: string) => {
    // Find the selected employee
    const employee = employees.find((emp) => emp.employee_number === value)

    // Check if employee is Allen One
    const isAllen = employee?.department?.toLowerCase() === "allen one"
    setIsAllenOne(isAllen)

    setFormData((prev) => ({
      ...prev,
      employee_number: value,
      daily_rate: employee?.daily_rate || prev.daily_rate,
      short: isAllen ? prev.short : "0", // Reset short if not Allen One
    }))

    setSelectedEmployee(employee || null)

    // Fetch attendance records if period is selected
    if (employee && formData.week_id) {
      fetchAttendanceRecords()
    }
  }

  // Handle form input changes
  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Format the data to match what the server expects
    const formattedData = {
      ...formData,
      week_id: Number.parseInt(formData.week_id),
      daily_rate: Number.parseFloat(formData.daily_rate.toString() || "0"),
      gross_pay: Number.parseFloat(formData.gross_pay),
      sss_deduction: Number.parseFloat(formData.sss_deduction),
      philhealth_deduction: Number.parseFloat(formData.philhealth_deduction),
      pagibig_deduction: Number.parseFloat(formData.pagibig_deduction),
      tax_deduction: Number.parseFloat(formData.tax_deduction),
      cash_advance: Number.parseFloat(formData.cash_advance || "0"),
      loan: Number.parseFloat(formData.loan || "0"),
      vat: Number.parseFloat(formData.vat || "0"),
      other_deductions: Number.parseFloat(formData.other_deductions || "0"),
      total_deductions: Number.parseFloat(formData.total_deductions),
      net_pay: Number.parseFloat(formData.net_pay),
      ytd_earnings: Number.parseFloat(formData.ytd_earnings || "0"),
      thirteenth_month_pay: Number.parseFloat(formData.thirteenth_month_pay || "0"),
      short: Number.parseFloat(formData.short || "0"),
    }

    // Ensure short is 0 for non-Allen One employees
    if (!isAllenOne) {
      formattedData.short = 0
    }

    console.log("Submitting new payroll with data:", formattedData)
    console.log("Request URL:", "/payroll/entries")
    console.log("Request Method: POST")

    // Use Inertia to create the payroll
    router.post("/payroll/entries", formattedData, {
      onSuccess: (page) => {
        console.log("Payroll add success response:", page)
        toast.success("Payroll added successfully!")
        setIsSubmitting(false)
        onClose()

        // Force a refresh of the data
        router.visit(window.location.pathname + window.location.search, {
          only: ["payrollEntries", "payrollSummary"],
          preserveScroll: true,
          preserveState: false,
        })
      },
      onError: (errors) => {
        console.error("Payroll add error:", errors)
        setErrors(errors)
        setIsSubmitting(false)
        Object.entries(errors).forEach(([field, message]) => {
          toast.error(`${field}: ${message}`)
        })
      },
      preserveState: true,
      preserveScroll: true,
    })
  }

  // Calculate standard deductions based on gross pay
  const calculateStandardDeductions = () => {
    const grossPay = Number.parseFloat(formData.gross_pay) || 0

    // Calculate standard deductions based on Philippine rates (simplified example)
    // Calculate SSS (Social Security System) contribution
    // This is a simplified calculation - adjust according to actual SSS table
    const { sss, philhealth, pagibig, tax } = calculateStandardDeductionsHelper(grossPay)

    setFormData((prev) => ({
      ...prev,
      sss_deduction: sss,
      philhealth_deduction: philhealth,
      pagibig_deduction: pagibig,
      tax_deduction: tax,
    }))

    toast.success("Standard deductions calculated based on gross pay")
  }

  const calculateStandardDeductionsHelper = (grossPay: number) => {
    // Parse the gross pay to ensure it's a number
    const gross = Number.parseFloat(grossPay.toString()) || 0
    const monthlyRate = gross * 4 // Approximate monthly rate based on weekly gross

    // Calculate SSS (Social Security System) contribution for 2025
    // 5% employee contribution based on Monthly Salary Credit (MSC)
    let sss = 0

    // Determine the Monthly Salary Credit (MSC) bracket
    // This is a simplified implementation - adjust according to the actual 2025 SSS table
    if (monthlyRate <= 4000) {
      sss = 4000 * 0.05 // 5% of minimum MSC
    } else if (monthlyRate > 30000) {
      sss = 30000 * 0.05 // 5% of maximum MSC
    } else {
      // Round to the nearest 500 for MSC determination
      const msc = Math.ceil(monthlyRate / 500) * 500
      sss = msc * 0.05
    }

    // Calculate PhilHealth contribution for 2025 (5% of monthly basic salary)
    // Employee pays 2.5% with floor of ₱10,000 and ceiling of ₱100,000
    let philhealth = 0
    if (monthlyRate < 10000) {
      philhealth = 10000 * 0.025 // 2.5% of minimum ₱10,000
    } else if (monthlyRate > 100000) {
      philhealth = 100000 * 0.025 // 2.5% of maximum ₱100,000
    } else {
      philhealth = monthlyRate * 0.025 // 2.5% of actual monthly salary
    }

    // Calculate Pag-IBIG contribution for 2025 (2% of monthly salary, max ₱200)
    const pagibig = Math.min(monthlyRate * 0.02, 200)

    // Calculate withholding tax (based on 2025 BIR tax table)
    let tax = 0
    const annualRate = monthlyRate * 12 // Convert monthly to annual
    const taxableIncome = annualRate - (sss + philhealth + pagibig) * 12 // Annual taxable income

    if (taxableIncome <= 250000) {
      tax = 0 // Exempt
    } else if (taxableIncome <= 400000) {
      tax = (taxableIncome - 250000) * 0.15 // 15% of excess over 250,000
    } else if (taxableIncome <= 800000) {
      tax = 22500 + (taxableIncome - 400000) * 0.2 // 22,500 + 20% of excess over 400,000
    } else if (taxableIncome <= 2000000) {
      tax = 102500 + (taxableIncome - 800000) * 0.25 // 102,500 + 25% of excess over 800,000
    } else if (taxableIncome <= 8000000) {
      tax = 402500 + (taxableIncome - 2000000) * 0.3 // 402,500 + 30% of excess over 2,000,000
    } else {
      tax = 2202500 + (taxableIncome - 8000000) * 0.35 // 2,202,500 + 35% of excess over 8,000,000
    }

    // Convert annual tax to monthly, then to weekly
    const monthlyTax = tax / 12
    const weeklyTax = monthlyTax / 4

    return {
      sss: (sss / 4).toFixed(2), // Convert monthly SSS to weekly
      philhealth: (philhealth / 4).toFixed(2), // Convert monthly PhilHealth to weekly
      pagibig: (pagibig / 4).toFixed(2), // Convert monthly Pag-IBIG to weekly
      tax: weeklyTax.toFixed(2),
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Payroll Entry</DialogTitle>
          <DialogDescription>Create a new payroll entry for an employee</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee and Period Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee_search">Search Employee</Label>
                <Input
                  id="employee_search"
                  type="text"
                  placeholder="Search by name or employee number"
                  value={employeeSearchTerm}
                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <Label htmlFor="employee_number">Employee</Label>
                <Select value={formData.employee_number} onValueChange={(value) => handleEmployeeChange(value)}>
                  <SelectTrigger id="employee_number" className={errors.employee_number ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.employee_number}>
                        {employee.employee_number} - {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employee_number && <p className="text-red-500 text-xs mt-1">{errors.employee_number}</p>}
              </div>

              <div>
                <Label htmlFor="week_id">Payroll Period (Week ID)</Label>
                <Select value={formData.week_id} onValueChange={(value) => handleChange("week_id", value)}>
                  <SelectTrigger id="week_id" className={errors.week_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {payrollPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.week_id.toString()}>
                        Week {period.week_id}: {new Date(period.period_start).toLocaleDateString()} -{" "}
                        {new Date(period.period_end).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.week_id && <p className="text-red-500 text-xs mt-1">{errors.week_id}</p>}
              </div>

              <div>
                <Label htmlFor="daily_rate">Daily Rate</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="daily_rate"
                    type="number"
                    value={formData.daily_rate}
                    onChange={(e) => handleChange("daily_rate", e.target.value)}
                    step="0.01"
                    className={`pl-8 ${errors.daily_rate ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.daily_rate && <p className="text-red-500 text-xs mt-1">{errors.daily_rate}</p>}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger id="status" className={errors.status ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generated">Generated</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="calculation-method" className="flex-grow">
                  Calculation Method:
                </Label>
                <div className="flex items-center space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={isCalculatingFromAttendance ? "default" : "outline"}
                    onClick={() => setIsCalculatingFromAttendance(true)}
                    className="text-xs"
                  >
                    Attendance
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!isCalculatingFromAttendance ? "default" : "outline"}
                    onClick={() => setIsCalculatingFromAttendance(false)}
                    className="text-xs"
                  >
                    Manual
                  </Button>
                </div>
              </div>

              <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800">
                <CardContent className="p-4">
                  <h3 className="font-medium text-indigo-700 dark:text-indigo-300 mb-2">Payroll Summary</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">Gross Pay:</p>
                      <p className="font-bold text-indigo-700 dark:text-indigo-300">₱{formData.gross_pay}</p>
                    </div>
                    <div>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">Total Deductions:</p>
                      <p className="font-bold text-indigo-700 dark:text-indigo-300">₱{formData.total_deductions}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">Net Pay:</p>
                      <p className="font-bold text-lg text-indigo-700 dark:text-indigo-300">₱{formData.net_pay}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedAttendances.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Attendance Summary</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Days Present:</p>
                        <p className="font-bold text-blue-700 dark:text-blue-300">
                          {selectedAttendances.filter((a) => a.status.toLowerCase() === "present").length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Half Days:</p>
                        <p className="font-bold text-blue-700 dark:text-blue-300">
                          {selectedAttendances.filter((a) => a.status.toLowerCase() === "half day").length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Absences:</p>
                        <p className="font-bold text-blue-700 dark:text-blue-300">
                          {selectedAttendances.filter((a) => a.status.toLowerCase() === "absent").length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Records:</p>
                        <p className="font-bold text-blue-700 dark:text-blue-300">{selectedAttendances.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Deductions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Deductions</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={calculateStandardDeductions}
                  className="text-xs border-indigo-200 text-indigo-600 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:border-indigo-700"
                >
                  Calculate Standard Deductions
                </Button>
              </div>

              <div>
                <Label htmlFor="sss_deduction">SSS</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="sss_deduction"
                    type="number"
                    value={formData.sss_deduction}
                    onChange={(e) => handleChange("sss_deduction", e.target.value)}
                    step="0.01"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="philhealth_deduction">PhilHealth</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="philhealth_deduction"
                    type="number"
                    value={formData.philhealth_deduction}
                    onChange={(e) => handleChange("philhealth_deduction", e.target.value)}
                    step="0.01"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pagibig_deduction">Pag-IBIG</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="pagibig_deduction"
                    type="number"
                    value={formData.pagibig_deduction}
                    onChange={(e) => handleChange("pagibig_deduction", e.target.value)}
                    step="0.01"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tax_deduction">Tax</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="tax_deduction"
                    type="number"
                    value={formData.tax_deduction}
                    onChange={(e) => handleChange("tax_deduction", e.target.value)}
                    step="0.01"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cash_advance">Cash Advance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="cash_advance"
                    type="number"
                    value={formData.cash_advance}
                    onChange={(e) => handleChange("cash_advance", e.target.value)}
                    step="0.01"
                    className="pl-8"
                  />
                </div>
              </div>

              {isAllenOne && (
                <div>
                  <Label htmlFor="short">Short</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <Input
                      id="short"
                      type="number"
                      value={formData.short || "0"}
                      onChange={(e) => handleChange("short", e.target.value)}
                      step="0.01"
                      className="pl-8"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="loan">Loan</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="loan"
                    type="number"
                    value={formData.loan}
                    onChange={(e) => handleChange("loan", e.target.value)}
                    step="0.01"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="vat">VAT</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="vat"
                    type="number"
                    value={formData.vat}
                    onChange={(e) => handleChange("vat", e.target.value)}
                    step="0.01"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="other_deductions">Other Deductions</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <Input
                    id="other_deductions"
                    type="number"
                    value={formData.other_deductions}
                    onChange={(e) => handleChange("other_deductions", e.target.value)}
                    step="0.01"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Payroll Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddPayrollModal

