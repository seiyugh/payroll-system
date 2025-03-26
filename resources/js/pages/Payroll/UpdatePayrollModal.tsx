"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { router } from "@inertiajs/react"
import { toast } from "sonner"
import { AlertCircle, Calendar, DollarSign, FileText, Info, Printer, User } from "lucide-react"
import PrintPayslip from "./printPayslip"

interface Payroll {
  id: number
  employee_number: string
  full_name: string
  payroll_period_id: number
  gross_pay: string
  net_pay: string
  thirteenth_month_pay: string
  ytd_earnings: string
  sss_deduction: string | null
  philhealth_deduction: string | null
  pagibig_deduction: string | null
  tax_deduction: string | null
  other_deductions: string | null
  cash_advance: string | null
  loan: string | null
  vat: string | null
  status: string
  created_at: string | null
  updated_at: string | null
  daily_rates: string | null | any[]
  period_start: string | null
  period_end: string | null
  daily_rate: string | null
  attendance_records: string | null | any[]
  employee?: {
    id: number
    employee_number: string
    full_name: string
    department: string
    position: string
    daily_rate: number
  }
  payroll_period?: {
    id: number
    period_start: string
    period_end: string
    payment_date: string
    status: string
  }
}

interface PayrollPeriod {
  id: number
  period_start: string
  period_end: string
  payment_date: string
  status: string
  created_at: string | null
  updated_at: string | null
}

interface Employee {
  id: number
  employee_number: string
  full_name: string
  department: string
  designation: string
  daily_rate: number
}

interface Attendance {
  id: number
  employee_number: string
  work_date: string
  daily_rate: number
  adjustment: number
  status: string
  full_name?: string
}

interface UpdatePayrollModalProps {
  payroll: Payroll
  onClose: () => void
  employees: Employee[]
  payrollPeriods: PayrollPeriod[]
  formatDailyRatesForSubmission?: (payroll: Payroll) => string
}

const UpdatePayrollModal = ({
  payroll,
  onClose,
  employees,
  payrollPeriods,
  formatDailyRatesForSubmission,
}: UpdatePayrollModalProps) => {
  const [formData, setFormData] = useState({
    id: payroll.id,
    employee_number: payroll.employee_number,
    full_name: payroll.full_name,
    payroll_period_id: payroll.payroll_period_id,
    gross_pay: payroll.gross_pay,
    net_pay: payroll.net_pay,
    thirteenth_month_pay: payroll.thirteenth_month_pay || "0",
    ytd_earnings: payroll.ytd_earnings || "0",
    sss_deduction: payroll.sss_deduction || "0",
    philhealth_deduction: payroll.philhealth_deduction || "0",
    pagibig_deduction: payroll.pagibig_deduction || "0",
    tax_deduction: payroll.tax_deduction || "0",
    other_deductions: payroll.other_deductions || "0",
    cash_advance: payroll.cash_advance || "0",
    loan: payroll.loan || "0",
    vat: payroll.vat || "0",
    status: payroll.status,
    attendance_records: payroll.attendance_records || null,
    daily_rates: payroll.daily_rates || null,
  })

  const [activeTab, setActiveTab] = useState<"details" | "deductions" | "attendance" | "preview">("details")
  const [isLoading, setIsLoading] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([])
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [enrichedPayroll, setEnrichedPayroll] = useState<Payroll>(payroll)

  // Fetch attendance records for this employee and payroll period
  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoadingAttendance(true)
      try {
        // Find the selected employee and period
        const employee = employees.find((emp) => emp.employee_number === payroll.employee_number) || null
        const period = payrollPeriods.find((p) => p.id === payroll.payroll_period_id) || null

        setSelectedEmployee(employee)
        setSelectedPeriod(period)

        // If we already have attendance records in the payroll, use those
        if (payroll.attendance_records) {
          try {
            if (typeof payroll.attendance_records === "string") {
              const parsed = JSON.parse(payroll.attendance_records)
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAttendanceRecords(parsed)
                setIsLoadingAttendance(false)
                return
              }
            } else if (Array.isArray(payroll.attendance_records) && payroll.attendance_records.length > 0) {
              setAttendanceRecords(payroll.attendance_records)
              setIsLoadingAttendance(false)
              return
            }
          } catch (e) {
            console.error("Error parsing attendance records:", e)
          }
        }

        // If we don't have attendance records or couldn't parse them, fetch from the API
        if (period && employee) {
          const response = await fetch(
            `/attendance/fetch-for-payslip?employee_number=${employee.employee_number}&start_date=${period.period_start}&end_date=${period.period_end}`,
          )

          if (response.ok) {
            const data = await response.json()
            if (data && data.attendances && Array.isArray(data.attendances)) {
              setAttendanceRecords(data.attendances)

              // Update the formData with the fetched attendance records
              setFormData((prev) => ({
                ...prev,
                attendance_records: JSON.stringify(data.attendances),
              }))
            } else {
              // If no records found, create empty records for each day in the period
              const start = new Date(period.period_start)
              const end = new Date(period.period_end)
              const emptyRecords = []

              const currentDate = new Date(start)
              while (currentDate <= end) {
                emptyRecords.push({
                  id: 0,
                  employee_number: employee.employee_number,
                  work_date: currentDate.toISOString().split("T")[0],
                  daily_rate: employee.daily_rate,
                  adjustment: 0,
                  status: "No Record",
                  full_name: employee.full_name,
                })
                currentDate.setDate(currentDate.getDate() + 1)
              }

              setAttendanceRecords(emptyRecords)

              // Update the formData with the empty attendance records
              setFormData((prev) => ({
                ...prev,
                attendance_records: JSON.stringify(emptyRecords),
              }))
            }
          } else {
            console.error("Failed to fetch attendance records")
            toast.error("Failed to load attendance records")
          }
        }
      } catch (error) {
        console.error("Error fetching attendance:", error)
        toast.error("Error loading attendance data")
      } finally {
        setIsLoadingAttendance(false)
      }
    }

    fetchAttendance()
  }, [payroll, employees, payrollPeriods])

  // Update enriched payroll when form data changes
  useEffect(() => {
    // Create an enriched payroll object that includes all the data needed for PrintPayslip
    const updatedPayroll = {
      ...payroll,
      ...formData,
      employee: selectedEmployee
        ? {
            ...selectedEmployee,
            full_name: selectedEmployee.full_name,
            department: selectedEmployee.department,
            position: selectedEmployee.designation,
            daily_rate: selectedEmployee.daily_rate,
          }
        : undefined,
      payroll_period: selectedPeriod
        ? {
            ...selectedPeriod,
            period_start: selectedPeriod.period_start,
            period_end: selectedPeriod.period_end,
          }
        : undefined,
      period_start: selectedPeriod?.period_start,
      period_end: selectedPeriod?.period_end,
    }

    setEnrichedPayroll(updatedPayroll)
  }, [formData, selectedEmployee, selectedPeriod, payroll])

  // Calculate totals from attendance records
  const attendanceTotals = {
    presentDays: attendanceRecords.filter((record) => record.status === "Present").length,
    absentDays: attendanceRecords.filter((record) => record.status === "Absent").length,
    totalDailyRate: attendanceRecords.reduce((sum, record) => sum + Number(record.daily_rate), 0),
    totalAdjustments: attendanceRecords.reduce((sum, record) => sum + Number(record.adjustment || 0), 0),
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Recalculate net pay when deductions change
    if (
      [
        "sss_deduction",
        "philhealth_deduction",
        "pagibig_deduction",
        "tax_deduction",
        "other_deductions",
        "cash_advance",
        "loan",
        "vat",
        "gross_pay",
      ].includes(name)
    ) {
      const grossPay = Number.parseFloat(name === "gross_pay" ? value : formData.gross_pay)
      const totalDeductions =
        Number.parseFloat(name === "sss_deduction" ? value : formData.sss_deduction) +
        Number.parseFloat(name === "philhealth_deduction" ? value : formData.philhealth_deduction) +
        Number.parseFloat(name === "pagibig_deduction" ? value : formData.pagibig_deduction) +
        Number.parseFloat(name === "tax_deduction" ? value : formData.tax_deduction) +
        Number.parseFloat(name === "other_deductions" ? value : formData.other_deductions) +
        Number.parseFloat(name === "cash_advance" ? value : formData.cash_advance) +
        Number.parseFloat(name === "loan" ? value : formData.loan) +
        Number.parseFloat(name === "vat" ? value : formData.vat)

      const netPay = grossPay - totalDeductions
      setFormData((prev) => ({
        ...prev,
        net_pay: netPay.toFixed(2),
      }))
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Prepare the data for submission
    const submissionData = {
      ...formData,
      // Format daily rates if needed
      daily_rates: formatDailyRatesForSubmission
        ? formatDailyRatesForSubmission(enrichedPayroll)
        : formData.daily_rates,
      // Ensure attendance records are properly formatted
      attendance_records:
        typeof formData.attendance_records === "string"
          ? formData.attendance_records
          : JSON.stringify(formData.attendance_records || attendanceRecords),
    }

    router.put(`/payroll/${formData.id}`, submissionData, {
      onSuccess: () => {
        toast.success("Payroll updated successfully!")
        setIsLoading(false)
        onClose()
      },
      onError: (errors) => {
        setIsLoading(false)
        Object.values(errors).forEach((message) => {
          toast.error(`Error: ${message}`)
        })
      },
    })
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format currency for display
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return numValue.toLocaleString("en-US", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    })
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
      case "Absent":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
      case "Day Off":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
      case "Holiday":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
      case "Half Day":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
      case "Leave":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800"
      case "No Record":
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  // Handle attendance status update
  const handleAttendanceStatusChange = (index: number, newStatus: string) => {
    const updatedRecords = [...attendanceRecords]
    updatedRecords[index].status = newStatus
    setAttendanceRecords(updatedRecords)

    // Update the formData with the updated attendance records
    setFormData((prev) => ({
      ...prev,
      attendance_records: JSON.stringify(updatedRecords),
    }))

    // Recalculate gross pay based on updated attendance
    recalculateGrossPay(updatedRecords)
  }

  // Handle attendance adjustment update
  const handleAttendanceAdjustmentChange = (index: number, newAdjustment: number) => {
    const updatedRecords = [...attendanceRecords]
    updatedRecords[index].adjustment = newAdjustment
    setAttendanceRecords(updatedRecords)

    // Update the formData with the updated attendance records
    setFormData((prev) => ({
      ...prev,
      attendance_records: JSON.stringify(updatedRecords),
    }))

    // Recalculate gross pay based on updated attendance
    recalculateGrossPay(updatedRecords)
  }

  // Calculate amount based on status and daily rate (same as in PrintPayslip)
  const calculateAmount = (status: string, dailyRate: number) => {
    switch (status.toLowerCase()) {
      case "present":
        return dailyRate
      case "half day":
        return dailyRate / 2
      case "absent":
      case "day off":
        return 0
      case "holiday":
        return dailyRate // Usually paid for holidays
      case "leave":
        return dailyRate // Paid leave
      case "no record":
        return 0 // No pay if no record
      default:
        return 0 // Default to 0 if status is unknown
    }
  }

  // Recalculate gross pay based on attendance records
  const recalculateGrossPay = (records: Attendance[]) => {
    const totalPay = records.reduce((sum, record) => {
      const amount = calculateAmount(record.status, Number(record.daily_rate))
      const adjustment = Number(record.adjustment || 0)
      return sum + amount + adjustment
    }, 0)

    setFormData((prev) => {
      const updatedGrossPay = totalPay.toFixed(2)

      // Calculate new net pay
      const totalDeductions =
        Number.parseFloat(prev.sss_deduction) +
        Number.parseFloat(prev.philhealth_deduction) +
        Number.parseFloat(prev.pagibig_deduction) +
        Number.parseFloat(prev.tax_deduction) +
        Number.parseFloat(prev.other_deductions) +
        Number.parseFloat(prev.cash_advance) +
        Number.parseFloat(prev.loan) +
        Number.parseFloat(prev.vat)

      const netPay = totalPay - totalDeductions

      return {
        ...prev,
        gross_pay: updatedGrossPay,
        net_pay: netPay.toFixed(2),
      }
    })
  }

  // Open print preview
  const openPrintPreview = () => {
    setIsPrintModalOpen(true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 overflow-y-auto p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto dark:text-white">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Update Payroll</h2>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
              &times;
            </Button>
          </div>

          {/* Employee and Period Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{formData.full_name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Employee #{formData.employee_number}</p>
                  {selectedEmployee && (
                    <>
                      <p className="text-sm mt-1">
                        <span className="text-slate-500 dark:text-slate-400">Department:</span>{" "}
                        {selectedEmployee.department}
                      </p>
                      <p className="text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Position:</span>{" "}
                        {selectedEmployee.designation}
                      </p>
                      <p className="text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Daily Rate:</span>{" "}
                        {formatCurrency(selectedEmployee.daily_rate)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Payroll Period</h3>
                  {selectedPeriod ? (
                    <>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(selectedPeriod.period_start)} to {formatDate(selectedPeriod.period_end)}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="text-slate-500 dark:text-slate-400">Payment Date:</span>{" "}
                        {formatDate(selectedPeriod.payment_date)}
                      </p>
                      <p className="text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Status:</span>{" "}
                        <span
                          className={`font-medium ${selectedPeriod.status === "Open" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
                        >
                          {selectedPeriod.status}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading period information...</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="details">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payroll Details
                </TabsTrigger>
                <TabsTrigger value="deductions">
                  <FileText className="h-4 w-4 mr-2" />
                  Deductions
                </TabsTrigger>
                <TabsTrigger value="attendance">
                  <Calendar className="h-4 w-4 mr-2" />
                  Attendance Records
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Printer className="h-4 w-4 mr-2" />
                  Payslip Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Gross Pay</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="gross_pay"
                        step="0.01"
                        required
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.gross_pay}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Net Pay</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="net_pay"
                        step="0.01"
                        required
                        className="pl-8 p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
                        value={formData.net_pay}
                        readOnly
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">13th Month Pay</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="thirteenth_month_pay"
                        step="0.01"
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.thirteenth_month_pay}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">YTD Earnings</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="ytd_earnings"
                        step="0.01"
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.ytd_earnings}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      name="status"
                      required
                      className="p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-700 dark:text-blue-400">Payroll Summary</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                        This payroll covers {attendanceTotals.presentDays} working days with a total daily rate of{" "}
                        {formatCurrency(attendanceTotals.totalDailyRate)}. Adjustments total{" "}
                        {formatCurrency(attendanceTotals.totalAdjustments)}.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deductions" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">SSS Deduction</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="sss_deduction"
                        step="0.01"
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.sss_deduction}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">PhilHealth Deduction</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="philhealth_deduction"
                        step="0.01"
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.philhealth_deduction}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pag-IBIG Deduction</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="pagibig_deduction"
                        step="0.01"
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.pagibig_deduction}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tax Deduction</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="tax_deduction"
                        step="0.01"
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.tax_deduction}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cash Advance</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="cash_advance"
                        step="0.01"
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.cash_advance}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Loan</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="loan"
                        step="0.01"
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.loan}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">VAT</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="vat"
                        step="0.01"
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.vat}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Other Deductions</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input
                        type="number"
                        name="other_deductions"
                        step="0.01"
                        className="pl-8 p-2 border rounded w-full dark:bg-slate-800 dark:border-slate-700"
                        value={formData.other_deductions}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                  <h4 className="font-medium mb-3">Deductions Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>SSS:</span>
                      <span>{formatCurrency(formData.sss_deduction)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>PhilHealth:</span>
                      <span>{formatCurrency(formData.philhealth_deduction)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pag-IBIG:</span>
                      <span>{formatCurrency(formData.pagibig_deduction)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span>{formatCurrency(formData.tax_deduction)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cash Advance:</span>
                      <span>{formatCurrency(formData.cash_advance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Loan:</span>
                      <span>{formatCurrency(formData.loan)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>VAT:</span>
                      <span>{formatCurrency(formData.vat)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Other:</span>
                      <span>{formatCurrency(formData.other_deductions)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                      <span>Total Deductions:</span>
                      <span>
                        {formatCurrency(
                          Number.parseFloat(formData.sss_deduction) +
                            Number.parseFloat(formData.philhealth_deduction) +
                            Number.parseFloat(formData.pagibig_deduction) +
                            Number.parseFloat(formData.tax_deduction) +
                            Number.parseFloat(formData.cash_advance) +
                            Number.parseFloat(formData.loan) +
                            Number.parseFloat(formData.vat) +
                            Number.parseFloat(formData.other_deductions),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="space-y-4">
                {isLoadingAttendance ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : attendanceRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800">
                          <th className="py-2 px-4 text-left font-medium text-slate-600 dark:text-slate-300">Date</th>
                          <th className="py-2 px-4 text-left font-medium text-slate-600 dark:text-slate-300">Status</th>
                          <th className="py-2 px-4 text-left font-medium text-slate-600 dark:text-slate-300">
                            Daily Rate
                          </th>
                          <th className="py-2 px-4 text-left font-medium text-slate-600 dark:text-slate-300">
                            Adjustment
                          </th>
                          <th className="py-2 px-4 text-left font-medium text-slate-600 dark:text-slate-300">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map((record, index) => {
                          const amount = calculateAmount(record.status, Number(record.daily_rate))
                          const adjustment = Number(record.adjustment || 0)
                          const total = amount + adjustment

                          return (
                            <tr
                              key={index}
                              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                              <td className="py-2 px-4">{formatDate(record.work_date)}</td>
                              <td className="py-2 px-4">
                                <select
                                  value={record.status}
                                  onChange={(e) => handleAttendanceStatusChange(index, e.target.value)}
                                  className="p-1 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs"
                                >
                                  <option value="Present">Present</option>
                                  <option value="Absent">Absent</option>
                                  <option value="Half Day">Half Day</option>
                                  <option value="Day Off">Day Off</option>
                                  <option value="Leave">Leave</option>
                                  <option value="Holiday">Holiday</option>
                                  <option value="No Record">No Record</option>
                                </select>
                              </td>
                              <td className="py-2 px-4">{formatCurrency(record.daily_rate)}</td>
                              <td className="py-2 px-4">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">
                                    ₱
                                  </span>
                                  <input
                                    type="number"
                                    value={record.adjustment || 0}
                                    onChange={(e) => handleAttendanceAdjustmentChange(index, Number(e.target.value))}
                                    className="pl-6 p-1 border rounded w-24 text-xs"
                                    step="0.01"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-4">{formatCurrency(total)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800/70 font-medium">
                          <td className="py-2 px-4" colSpan={2}>
                            Total
                          </td>
                          <td className="py-2 px-4">{formatCurrency(attendanceTotals.totalDailyRate)}</td>
                          <td className="py-2 px-4">{formatCurrency(attendanceTotals.totalAdjustments)}</td>
                          <td className="py-2 px-4">
                            {formatCurrency(
                              attendanceRecords.reduce((sum, record) => {
                                const amount = calculateAmount(record.status, Number(record.daily_rate))
                                const adjustment = Number(record.adjustment || 0)
                                return sum + amount + adjustment
                              }, 0),
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <AlertCircle className="h-12 w-12 mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-600 dark:text-slate-400">No attendance records found for this period.</p>
                  </div>
                )}

                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mt-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-700 dark:text-amber-400">Attendance Summary</h4>
                      <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                        This employee has {attendanceTotals.presentDays} present days and {attendanceTotals.absentDays}{" "}
                        absent days during this payroll period.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Button
                    type="button"
                    onClick={openPrintPreview}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Printer className="h-4 w-4" />
                    Open Print View
                  </Button>
                </div>

                <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-semibold text-lg mb-4">Payslip Preview</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Employee Information</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Name:</span> {formData.full_name}
                        </p>
                        <p>
                          <span className="font-medium">Employee #:</span> {formData.employee_number}
                        </p>
                        {selectedEmployee && (
                          <>
                            <p>
                              <span className="font-medium">Department:</span> {selectedEmployee.department}
                            </p>
                            <p>
                              <span className="font-medium">Position:</span> {selectedEmployee.designation}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Payroll Information</h4>
                      <div className="space-y-1 text-sm">
                        {selectedPeriod && (
                          <p>
                            <span className="font-medium">Period:</span> {formatDate(selectedPeriod.period_start)} to{" "}
                            {formatDate(selectedPeriod.period_end)}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Gross Pay:</span> {formatCurrency(formData.gross_pay)}
                        </p>
                        <p>
                          <span className="font-medium">Total Deductions:</span>{" "}
                          {formatCurrency(
                            Number.parseFloat(formData.sss_deduction) +
                              Number.parseFloat(formData.philhealth_deduction) +
                              Number.parseFloat(formData.pagibig_deduction) +
                              Number.parseFloat(formData.tax_deduction) +
                              Number.parseFloat(formData.cash_advance) +
                              Number.parseFloat(formData.loan) +
                              Number.parseFloat(formData.vat) +
                              Number.parseFloat(formData.other_deductions),
                          )}
                        </p>
                        <p className="font-bold">
                          <span className="font-medium">Net Pay:</span> {formatCurrency(formData.net_pay)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-sm mb-2">Attendance Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded border">
                        <p className="font-medium">Present Days</p>
                        <p className="text-lg">{attendanceTotals.presentDays}</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded border">
                        <p className="font-medium">Absent Days</p>
                        <p className="text-lg">{attendanceTotals.absentDays}</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded border">
                        <p className="font-medium">Total Daily Rate</p>
                        <p className="text-lg">{formatCurrency(attendanceTotals.totalDailyRate)}</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded border">
                        <p className="font-medium">Total Adjustments</p>
                        <p className="text-lg">{formatCurrency(attendanceTotals.totalAdjustments)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Updating...
                  </>
                ) : (
                  "Update Payroll"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Print Payslip Modal */}
      {isPrintModalOpen && <PrintPayslip payroll={enrichedPayroll} onClose={() => setIsPrintModalOpen(false)} />}
    </div>
  )
}

export default UpdatePayrollModal

