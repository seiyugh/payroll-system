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
}

const AddPayrollModal = ({ isOpen = true, onClose, employees, payrollPeriods }: AddPayrollModalProps) => {
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

    calculatePayroll()
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
      } else {
        // If no pending period, use the first one
        setFormData((prev) => ({
          ...prev,
          week_id: payrollPeriods[0].week_id.toString(),
        }))
      }
    }
  }, [payrollPeriods])

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

    // Calculate SSS (Social Security System) contribution
    // This is a simplified calculation - adjust according to actual SSS table
    let sss = 0
    if (gross <= 3250) {
      sss = 135
    } else if (gross <= 3750) {
      sss = 157.5
    } else if (gross <= 4250) {
      sss = 180
    } else if (gross <= 4750) {
      sss = 202.5
    } else if (gross <= 5250) {
      sss = 225
    } else if (gross <= 5750) {
      sss = 247.5
    } else if (gross <= 6250) {
      sss = 270
    } else if (gross <= 6750) {
      sss = 292.5
    } else if (gross <= 7250) {
      sss = 315
    } else if (gross <= 7750) {
      sss = 337.5
    } else if (gross <= 8250) {
      sss = 360
    } else if (gross <= 8750) {
      sss = 382.5
    } else if (gross <= 9250) {
      sss = 405
    } else if (gross <= 9750) {
      sss = 427.5
    } else if (gross <= 10250) {
      sss = 450
    } else if (gross <= 10750) {
      sss = 472.5
    } else if (gross <= 11250) {
      sss = 495
    } else if (gross <= 11750) {
      sss = 517.5
    } else if (gross <= 12250) {
      sss = 540
    } else if (gross <= 12750) {
      sss = 562.5
    } else if (gross <= 13250) {
      sss = 585
    } else if (gross <= 13750) {
      sss = 607.5
    } else if (gross <= 14250) {
      sss = 630
    } else if (gross <= 14750) {
      sss = 652.5
    } else if (gross <= 15250) {
      sss = 675
    } else if (gross <= 15750) {
      sss = 697.5
    } else if (gross <= 16250) {
      sss = 720
    } else if (gross <= 16750) {
      sss = 742.5
    } else if (gross <= 17250) {
      sss = 765
    } else if (gross <= 17750) {
      sss = 787.5
    } else if (gross <= 18250) {
      sss = 810
    } else if (gross <= 18750) {
      sss = 832.5
    } else if (gross <= 19250) {
      sss = 855
    } else if (gross <= 19750) {
      sss = 877.5
    } else if (gross <= 20250) {
      sss = 900
    } else if (gross <= 20750) {
      sss = 922.5
    } else if (gross <= 21250) {
      sss = 945
    } else if (gross <= 21750) {
      sss = 967.5
    } else if (gross <= 22250) {
      sss = 990
    } else if (gross <= 22750) {
      sss = 1012.5
    } else if (gross <= 23250) {
      sss = 1035
    } else if (gross <= 23750) {
      sss = 1057.5
    } else if (gross <= 24250) {
      sss = 1080
    } else if (gross <= 24750) {
      sss = 1102.5
    } else {
      sss = 1125
    }

    // Calculate PhilHealth contribution (4% of gross pay, split between employee and employer)
    // Employee pays 2% with a ceiling
    const philhealth = Math.min(gross * 0.02, 900) // Maximum of 900 for 45,000 and above

    // Calculate Pag-IBIG contribution (usually 100 for those earning below 1,500, and 2% for those above)
    const pagibig = gross < 1500 ? 100 : Math.min(gross * 0.02, 100)

    // Calculate withholding tax (simplified)
    let tax = 0
    const taxableIncome = gross - sss - philhealth - pagibig

    if (taxableIncome <= 20833) {
      tax = 0
    } else if (taxableIncome <= 33332) {
      tax = (taxableIncome - 20833) * 0.2
    } else if (taxableIncome <= 66666) {
      tax = 2500 + (taxableIncome - 33333) * 0.25
    } else if (taxableIncome <= 166666) {
      tax = 10833.33 + (taxableIncome - 66667) * 0.3
    } else if (taxableIncome <= 666666) {
      tax = 40833.33 + (taxableIncome - 166667) * 0.32
    } else {
      tax = 200833.33 + (taxableIncome - 666667) * 0.35
    }

    return {
      sss: sss.toFixed(2),
      philhealth: philhealth.toFixed(2),
      pagibig: pagibig.toFixed(2),
      tax: tax.toFixed(2),
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

