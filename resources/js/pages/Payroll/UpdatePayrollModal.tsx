"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { router } from "@inertiajs/react"
import { toast } from "sonner"
import { AlertCircle, Calendar, DollarSign, FileText, Info, User } from "lucide-react"

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
  status: string
  created_at: string | null
  updated_at: string | null
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
  employee_id: number
  date: string
  status: string
  daily_rate: number
  adjustment: number
}

interface UpdatePayrollModalProps {
  payroll: Payroll
  onClose: () => void
  employees: Employee[]
  payrollPeriods: PayrollPeriod[]
}

const UpdatePayrollModal = ({ payroll, onClose, employees, payrollPeriods }: UpdatePayrollModalProps) => {
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
    status: payroll.status,
  })

  const [activeTab, setActiveTab] = useState<"details" | "deductions" | "attendance">("details")
  const [isLoading, setIsLoading] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([])
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null)

  // Fetch attendance records for this employee and payroll period
  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoadingAttendance(true)
      try {
        const response = await fetch(`/api/attendance/${payroll.employee_number}/${payroll.payroll_period_id}`)
        if (response.ok) {
          const data = await response.json()
          setAttendanceRecords(data)
        } else {
          console.error("Failed to fetch attendance records")
          toast.error("Failed to load attendance records")
        }
      } catch (error) {
        console.error("Error fetching attendance:", error)
        toast.error("Error loading attendance data")
      } finally {
        setIsLoadingAttendance(false)
      }
    }

    // Find the selected employee and period
    const employee = employees.find((emp) => emp.employee_number === payroll.employee_number) || null
    const period = payrollPeriods.find((p) => p.id === payroll.payroll_period_id) || null

    setSelectedEmployee(employee)
    setSelectedPeriod(period)

    fetchAttendance()
  }, [payroll.employee_number, payroll.payroll_period_id, employees, payrollPeriods])

  // Calculate totals from attendance records
  const attendanceTotals = {
    presentDays: attendanceRecords.filter((record) => record.status === "Present").length,
    absentDays: attendanceRecords.filter((record) => record.status === "Absent").length,
    totalDailyRate: attendanceRecords.reduce((sum, record) => sum + Number(record.daily_rate), 0),
    totalAdjustments: attendanceRecords.reduce((sum, record) => sum + Number(record.adjustment), 0),
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
        "gross_pay",
      ].includes(name)
    ) {
      const grossPay = Number.parseFloat(name === "gross_pay" ? value : formData.gross_pay)
      const totalDeductions =
        Number.parseFloat(name === "sss_deduction" ? value : formData.sss_deduction) +
        Number.parseFloat(name === "philhealth_deduction" ? value : formData.philhealth_deduction) +
        Number.parseFloat(name === "pagibig_deduction" ? value : formData.pagibig_deduction) +
        Number.parseFloat(name === "tax_deduction" ? value : formData.tax_deduction) +
        Number.parseFloat(name === "other_deductions" ? value : formData.other_deductions)

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

    router.put(`/payroll/${formData.id}`, formData, {
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
                        {attendanceRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-2 px-4">{formatDate(record.date)}</td>
                            <td className="py-2 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  record.status === "Present"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : record.status === "Absent"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="py-2 px-4">{formatCurrency(record.daily_rate)}</td>
                            <td className="py-2 px-4">{formatCurrency(record.adjustment)}</td>
                            <td className="py-2 px-4">
                              {formatCurrency(
                                record.status === "Present" ? record.daily_rate + record.adjustment : record.adjustment,
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800/70 font-medium">
                          <td className="py-2 px-4" colSpan={2}>
                            Total
                          </td>
                          <td className="py-2 px-4">{formatCurrency(attendanceTotals.totalDailyRate)}</td>
                          <td className="py-2 px-4">{formatCurrency(attendanceTotals.totalAdjustments)}</td>
                          <td className="py-2 px-4">
                            {formatCurrency(attendanceTotals.totalDailyRate + attendanceTotals.totalAdjustments)}
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
    </div>
  )
}

export default UpdatePayrollModal

