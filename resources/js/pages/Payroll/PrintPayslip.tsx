"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { Check, X, AlertCircle, Clock } from "lucide-react"

interface Attendance {
  id: number
  employee_number: string
  work_date: string
  daily_rate: number
  adjustment: number
  status: string
  full_name?: string
  time_in?: string
  time_out?: string
  notes?: string
}

interface PrintPayslipProps {
  payroll: any
  onClose: () => void
}

const PrintPayslip = ({ payroll, onClose }: PrintPayslipProps) => {
  const printRef = useRef<HTMLDivElement>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Update the useEffect to work with the data we already have
  useEffect(() => {
    console.log("Payroll data:", payroll)
    setIsLoading(true)

    // Extract the necessary data from the payroll object
    const employeeNumber = payroll.employee_number || payroll.employee?.employee_number
    const startDate = payroll.period_start || payroll.payroll_period?.period_start
    const endDate = payroll.period_end || payroll.payroll_period?.period_end
    const dailyRate = payroll.daily_rate || payroll.employee?.daily_rate || 545.15

    // First try to use daily_rates from the payroll object
    if (payroll.daily_rates) {
      try {
        // Check if daily_rates is a number (fixed daily rate)
        if (
          typeof payroll.daily_rates === "number" ||
          (typeof payroll.daily_rates === "string" && !isNaN(Number.parseFloat(payroll.daily_rates)))
        ) {
          console.log("daily_rates is a fixed rate:", payroll.daily_rates)

          // If we have start and end dates, we can generate records with this fixed rate
          if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            const generatedRecords = []

            // Use the fixed daily rate for all days in the period
            const fixedRate =
              typeof payroll.daily_rates === "number" ? payroll.daily_rates : Number.parseFloat(payroll.daily_rates)

            // Generate a record for each day in the period
            const currentDate = new Date(start)
            while (currentDate <= end) {
              const dateStr = currentDate.toISOString().split("T")[0]

              // Default to "Present" status for all days with the fixed rate
              generatedRecords.push({
                id: 0,
                employee_number: employeeNumber,
                work_date: dateStr,
                daily_rate: dailyRate,
                adjustment: 0,
                status: "Present",
                full_name: payroll.full_name || payroll.employee_name || "",
                amount: fixedRate,
              })

              // Move to next day
              currentDate.setDate(currentDate.getDate() + 1)
            }

            console.log("Generated attendance records from fixed rate:", generatedRecords)
            processAttendanceRecords(generatedRecords)
            return
          }
        }

        // If it's a string, try to parse it as JSON
        let dailyRatesArray = []
        if (typeof payroll.daily_rates === "string") {
          try {
            const parsed = JSON.parse(payroll.daily_rates)
            // Ensure it's an array
            if (Array.isArray(parsed)) {
              dailyRatesArray = parsed
            } else {
              console.error("daily_rates parsed but is not an array:", parsed)
              dailyRatesArray = []
            }
          } catch (e) {
            console.error("Failed to parse daily_rates as JSON:", e)
            dailyRatesArray = []
          }
        } else if (Array.isArray(payroll.daily_rates)) {
          dailyRatesArray = payroll.daily_rates
        } else {
          console.error("daily_rates is neither a string, number, nor an array:", payroll.daily_rates)
          dailyRatesArray = []
        }

        if (dailyRatesArray.length > 0) {
          console.log("Using daily_rates array to generate attendance records:", dailyRatesArray)

          // Convert daily_rates to attendance records
          const generatedRecords = dailyRatesArray
            .filter((rate) => rate && rate.date) // Filter out entries without dates
            .map((rate) => {
              // Determine status based on amount
              let status = "No Record"
              const amount = Number.parseFloat(rate.amount || "0")

              if (amount >= dailyRate * 0.99) {
                // Allow for small rounding differences
                status = "Present"
              } else if (amount >= dailyRate * 0.45) {
                // Approximately half
                status = "Half Day"
              } else if (amount <= 0) {
                status = "Absent"
              }

              return {
                id: 0,
                employee_number: employeeNumber,
                work_date: rate.date,
                daily_rate: dailyRate,
                adjustment: Number.parseFloat(rate.additional || "0"),
                status: status,
                full_name: payroll.full_name || payroll.employee_name || "",
              }
            })

          if (generatedRecords.length > 0) {
            processAttendanceRecords(generatedRecords)
            return
          }
        }
      } catch (e) {
        console.error("Error processing daily rates:", e)
      }
    }

    // If we couldn't use daily_rates, generate records for the period
    if (startDate && endDate) {
      console.log("Generating attendance records for period:", startDate, "to", endDate)

      const start = new Date(startDate)
      const end = new Date(endDate)
      const generatedRecords = []

      // Generate a record for each day in the period
      const currentDate = new Date(start)
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0]

        // Try to find a matching daily rate for this date
        let amount = 0
        let adjustment = 0
        let status = "No Record"

        if (payroll.daily_rates) {
          let dailyRatesArray = []
          if (typeof payroll.daily_rates === "string") {
            try {
              dailyRatesArray = JSON.parse(payroll.daily_rates)
              if (!Array.isArray(dailyRatesArray)) {
                dailyRatesArray = []
              }
            } catch (e) {
              dailyRatesArray = []
            }
          } else if (Array.isArray(payroll.daily_rates)) {
            dailyRatesArray = payroll.daily_rates
          }

          // Find a matching rate for this date
          if (Array.isArray(dailyRatesArray)) {
            const matchingRate = dailyRatesArray.find((rate) => {
              if (!rate || !rate.date) return false
              const rateDate = new Date(rate.date)
              return rateDate.toISOString().split("T")[0] === dateStr
            })

            if (matchingRate) {
              amount = Number.parseFloat(matchingRate.amount || "0")
              adjustment = Number.parseFloat(matchingRate.additional || "0")

              // Determine status based on amount
              if (amount >= dailyRate * 0.99) {
                status = "Present"
              } else if (amount >= dailyRate * 0.45) {
                status = "Half Day"
              } else if (amount <= 0) {
                status = "Absent"
              }
            }
          }
        }

        // Create a record for this day
        generatedRecords.push({
          id: 0,
          employee_number: employeeNumber,
          work_date: dateStr,
          daily_rate: dailyRate,
          adjustment: adjustment,
          status: status,
          full_name: payroll.full_name || payroll.employee_name || "",
        })

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
      }

      console.log("Generated attendance records:", generatedRecords)
      processAttendanceRecords(generatedRecords)
      return
    }

    // If we couldn't generate records, set empty records
    console.log("Could not generate attendance records")
    setAttendanceRecords([])
    setIsLoading(false)
  }, [payroll])

  // Process and normalize attendance records
  const processAttendanceRecords = (records: any[]) => {
    console.log("Processing attendance records:", records)

    // Normalize date formats and ensure status field exists
    const normalizedRecords = records.map((record) => {
      // Ensure we have a date field (could be date, work_date, or attendance_date)
      const dateField = record.date || record.work_date || record.attendance_date

      // Convert date to ISO format for consistent comparison
      let date = null
      if (dateField) {
        // Handle different date formats
        try {
          const dateObj = new Date(dateField)
          if (!isNaN(dateObj.getTime())) {
            date = dateObj.toISOString().split("T")[0]
          }
        } catch (e) {
          console.error(`Error parsing date: ${dateField}`, e)
        }
      }

      // Ensure status is capitalized and normalized
      let status = record.status || ""

      // Normalize status values
      status = status.toLowerCase().trim()
      if (status === "a" || status === "abs" || status === "absent") {
        status = "Absent"
      } else if (status === "p" || status === "pres" || status === "present") {
        status = "Present"
      } else if (status === "h" || status === "half" || status === "half day") {
        status = "Half Day"
      } else if (status === "l" || status === "leave") {
        status = "Leave"
      } else if (status === "ho" || status === "holiday") {
        status = "Holiday"
      } else if (status === "do" || status === "day off" || status === "off") {
        status = "Day Off"
      } else if (status === "") {
        status = "No Record" // Default to No Record if no status
      } else {
        // Capitalize first letter for any other status
        status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      }

      return {
        ...record,
        normalizedDate: date,
        status,
      }
    })

    console.log("Normalized attendance records:", normalizedRecords)
    setAttendanceRecords(normalizedRecords)
    setIsLoading(false)
  }

  // Format date to display in a readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format short date (just day and month)
  const formatShortDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // Format currency values
  const formatCurrency = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "0.00"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return numValue.toFixed(2)
  }

  // Generate date range from payroll period
  const generateDateRange = () => {
    // Get period dates from payroll data
    const start = payroll.period_start
      ? new Date(payroll.period_start)
      : payroll.payroll_period?.period_start
        ? new Date(payroll.payroll_period.period_start)
        : new Date()

    const end = payroll.period_end
      ? new Date(payroll.period_end)
      : payroll.payroll_period?.period_end
        ? new Date(payroll.payroll_period.period_end)
        : new Date()

    // Ensure end date is not before start date
    if (end < start) {
      end.setDate(start.getDate() + 6) // Default to a week if dates are invalid
    }

    const dates = []
    const currentDate = new Date(start)

    // Generate dates for the period
    while (currentDate <= end) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates // Return all dates in the period
  }

  // Get attendance status for a specific date
  const getAttendanceStatus = (date: Date) => {
    // Format date as ISO string for comparison (YYYY-MM-DD)
    const dateStr = date.toISOString().split("T")[0]

    // Find matching attendance record
    const record = attendanceRecords.find((record) => {
      // Try normalized date first
      if (record.normalizedDate === dateStr) return true

      // Try original date fields
      const recordDate = record.date || record.work_date || record.attendance_date
      if (!recordDate) return false

      try {
        const recordDateObj = new Date(recordDate)
        if (isNaN(recordDateObj.getTime())) return false

        return recordDateObj.toISOString().split("T")[0] === dateStr
      } catch (e) {
        return false
      }
    })

    // If record found, return its status
    if (record) {
      return record.status
    }

    // If no record found, return "No Record"
    return "No Record"
  }

  // Get daily rate for a specific date
  const getDailyRate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]

    // First check if we have a matching attendance record with a daily rate
    const record = attendanceRecords.find((record) => {
      return (
        record.normalizedDate === dateStr ||
        (record.date && new Date(record.date).toISOString().split("T")[0] === dateStr) ||
        (record.work_date && new Date(record.work_date).toISOString().split("T")[0] === dateStr)
      )
    })

    if (record && record.daily_rate) {
      return typeof record.daily_rate === "string" ? Number.parseFloat(record.daily_rate) : record.daily_rate
    }

    // Default to employee's daily rate
    return payroll.employee?.daily_rate || payroll.daily_rate || 0
  }

  // Get adjustment for a specific date
  const getAdjustment = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]

    // First check if we have a matching attendance record with an adjustment
    const record = attendanceRecords.find((record) => {
      return (
        record.normalizedDate === dateStr ||
        (record.date && new Date(record.date).toISOString().split("T")[0] === dateStr) ||
        (record.work_date && new Date(record.work_date).toISOString().split("T")[0] === dateStr)
      )
    })

    if (record && record.adjustment) {
      return typeof record.adjustment === "string" ? Number.parseFloat(record.adjustment) : record.adjustment
    }

    return 0 // Default adjustment
  }

  // Update the calculateAmount function to match the one in attendance-index.tsx
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

  // Generate daily rates data for the payslip
  const generateDailyRatesData = () => {
    const dateRange = generateDateRange()

    return dateRange.map((date) => {
      const status = getAttendanceStatus(date)
      const dailyRate = getDailyRate(date)
      const adjustment = getAdjustment(date)
      const amount = calculateAmount(status, dailyRate)

      return {
        date,
        status,
        dailyRate,
        amount,
        adjustment,
      }
    })
  }

  // Get daily rates data
  const dailyRatesData = generateDailyRatesData()

  // Calculate gross pay
  const grossPay = dailyRatesData.reduce((total, data) => {
    return total + data.amount + data.adjustment
  }, 0)

  // Calculate total deductions
  const calculateTotalDeductions = () => {
    const sss = Number.parseFloat(payroll.sss_deduction || 0)
    const philhealth = Number.parseFloat(payroll.philhealth_deduction || 0)
    const pagibig = Number.parseFloat(payroll.pagibig_deduction || 0)
    const tax = Number.parseFloat(payroll.tax_deduction || 0)
    const others = Number.parseFloat(payroll.other_deductions || 0)
    const cashAdvance = Number.parseFloat(payroll.cash_advance || 0)
    const loan = Number.parseFloat(payroll.loan || 0)
    const vat = Number.parseFloat(payroll.vat || 0)

    return sss + philhealth + pagibig + tax + others + cashAdvance + loan + vat
  }

  // Calculate total deductions
  const totalDeductions = calculateTotalDeductions()

  // Calculate net pay
  const netPay = grossPay - totalDeductions

  // Update the getStatusBadgeColor function to match the one in attendance-index.tsx
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

  // Add a getStatusIcon function similar to the one in attendance-index.tsx
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present":
        return <Check className="h-4 w-4 text-green-500" />
      case "Absent":
        return <X className="h-4 w-4 text-red-500" />
      case "Half Day":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "Day Off":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  // Handle print function
  const handlePrint = () => {
    if (!printRef.current) return

    const printWindow = window.open("", "", "width=800,height=600")
    if (!printWindow) return

    // Get all daily rates data with correct status
    const dailyRatesData = generateDailyRatesData()

    // Calculate totals
    const grossPay = dailyRatesData.reduce((total, data) => {
      return total + data.amount + data.adjustment
    }, 0)

    const totalDeductions = calculateTotalDeductions()
    const netPay = grossPay - totalDeductions

    // Get employee name and other details
    const employeeName = payroll.employee_name || payroll.employee?.full_name || payroll.employee_number || "Employee"
    const department = payroll.department || payroll.employee?.department || "N/A"
    const position = payroll.designation || payroll.employee?.position || "N/A"

    // Get period dates
    const periodStart = payroll.period_start || payroll.payroll_period?.period_start
    const periodEnd = payroll.period_end || payroll.payroll_period?.period_end
    const periodText = periodStart && periodEnd ? `${formatDate(periodStart)} to ${formatDate(periodEnd)}` : "N/A"

    // Write content to new window with dynamic data
    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${employeeName}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 0.5cm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #000;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .payslip-container {
              width: 4.25in;
              height: 8.25in;
              margin: 0 auto;
              box-sizing: border-box;
              position: relative;
            }
            .payslip {
              width: 100%;
              height: 100%;
              border: 1px solid #000;
              box-sizing: border-box;
              padding: 0.15in;
              position: relative;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 12px;
              padding: 6px;
            }
            .company-info {
              text-align: center;
              font-size: 8px;
              padding: 4px;
              border-bottom: 1px solid #000;
            }
            .payslip-title {
              text-align: center;
              font-weight: bold;
              font-size: 10px;
              margin: 8px 0;
            }
            .employee-details {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
              font-size: 8px;
            }
            .employee-details td {
              padding: 3px 5px;
              border-bottom: 1px solid #000;
            }
            .section-title {
              text-align: center;
              font-weight: bold;
              font-size: 9px;
              margin: 8px 0 4px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
            }
            th, td {
              border: 1px solid #000;
              padding: 3px 4px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0 !important;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .net-salary {
              text-align: right;
              font-weight: bold;
              font-size: 10px;
              margin: 8px 0;
              padding-right: 5px;
            }
            .date {
              text-align: center;
              font-size: 8px;
              margin: 6px 0;
            }
            .signature-section {
              margin-top: 15px;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .signature {
              width: 70%;
              text-align: center;
              margin-top: 50px;
              border-top: 1px solid #000;
              padding-top: 3px;
            }
            .signature-name {
              font-size: 8px;
            }
            .signature-title {
              font-size: 7px;
            }
            .date-printed {
              position: absolute;
              bottom: 0.1in;
              width: 100%;
              text-align: center;
              font-size: 7px;
              left: 0;
            }
          </style>
        </head>
        <body>
          <div class="payslip-container">
            <div class="payslip">
              <div class="header">JBD TELECOM HUB POINT</div>
              <div class="company-info">
                2nd Floor AICOM Bldg., Purok 7 Brgy. Sta. Rita Karsada, Batangas City<br />
                Telephone # (043)980-5276 | jbd.aicomhrdepartment@gmail.com
              </div>
    
              <div class="payslip-title">PAY SLIP</div>
    
              <table class="employee-details">
                <tr>
                  <td style="width: 25%; font-weight: bold;">Name</td>
                  <td>${employeeName}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">Department</td>
                  <td>${department}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">Cut-off Period</td>
                  <td>${periodText}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">Designation</td>
                  <td>${position}</td>
                </tr>
              </table>
    
              <div class="section-title">Earnings</div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Daily Rate</th>
                    <th>Adjustments</th>
                  </tr>
                </thead>
                <tbody>
                  ${dailyRatesData
                    .map((data) => `
                      <tr>
                        <td>${formatShortDate(data.date.toISOString())}</td>
                        <td>${data.status}</td> <!-- ✅ Status now displays as plain text -->
                        <td class="text-right">${formatCurrency(data.amount)}</td>
                        <td class="text-right">${formatCurrency(data.adjustment)}</td>
                      </tr>
                    `)
                    .join("")}
                  <tr style="font-weight: bold;">
                    <td colspan="3">Gross Salary</td>
                    <td class="text-right" colspan="2">${formatCurrency(grossPay)}</td>
                  </tr>
                </tbody>
              </table>
    
              <div class="section-title">Deductions</div>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${[
                    ["SSS", payroll.sss_deduction],
                    ["PAG-IBIG", payroll.pagibig_deduction],
                    ["PHILHEALTH", payroll.philhealth_deduction],
                    ["CASH ADVANCE", payroll.cash_advance],
                    ["LOAN", payroll.loan],
                    ["VAT", payroll.vat],
                    ["OTHERS", payroll.other_deductions],
                  ]
                    .map(
                      ([label, value]) =>
                        `<tr>
                          <td>${label}</td>
                          <td class="text-right">${formatCurrency(value ?? 0)}</td>
                        </tr>`,
                    )
                    .join("")}
                  <tr style="font-weight: bold;">
                    <td>Total Deductions</td>
                    <td class="text-right">${formatCurrency(totalDeductions)}</td>
                  </tr>
                </tbody>
              </table>
    
              <div class="net-salary">
                NET SALARY: ${formatCurrency(netPay)}
              </div>
    
              <div class="date">${formatDate(new Date().toISOString())}</div>
    
              <div class="signature-section">
                <div class="signature">
                  <div class="signature-name">${employeeName}</div>
                  <div class="signature-title">Signature Of The Employee</div>
                </div>
    
                <div class="signature">
                  <div class="signature-name">Crissel Ann Bando</div>
                  <div class="signature-title">Billing Assistant - OIC</div>
                </div>
              </div>
    
              <div class="date-printed">
                Printed on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
                <h3 className="mt-6 font-bold">-----------------------CONFIDENTIAL-----------------------</h3>
              </div>
            </div>
          </div>
    
          <script>
            document.addEventListener("DOMContentLoaded", function () {
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            });
          </script>
        </body>
      </html>
    `)
    

    // Close document and focus print window
    printWindow.document.close()
    printWindow.focus()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 dark:text-black">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[800px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Payslip Preview</h2>
          <div className="flex space-x-2">
            <Button onClick={handlePrint} className="flex items-center gap-1">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={onClose} className="dark:text-white">
              Close
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          /* Printable Content */
          <div ref={printRef} className="payslip max-w-md mx-auto p-4 border border-black text-sm">
            {/* Header */}
            <div className="text-center font-bold text-lg bg-gray-500 text-white py-2">JBD TELECOM HUB POINT</div>
            <div className="text-center text-xs py-1 border-b border-black">
              2nd Floor AICOM Bldg., Purok 7 Brgy. Sta. Rita Karsada, Batangas City
              <br />
              Telephone # (043)980-5276 | jbd.aicomhrdepartment@gmail.com
            </div>

            {/* Payslip Title */}
            <div className="text-center font-bold text-base my-2">PAY SLIP</div>

            {/* Employee Details */}
            <table className="w-full text-xs border border-black mb-2">
              <tbody>
                <tr>
                  <td className="font-bold w-1/3 border border-black p-1">Name</td>
                  <td className="border border-black p-1">
                    {payroll.employee_name || payroll.employee?.full_name || payroll.employee_number}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold border border-black p-1">Department</td>
                  <td className="border border-black p-1">
                    {payroll.department || payroll.employee?.department || "ADMINISTRATIVE"}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold w-1/3 border border-black p-1">Cut-off Period</td>
                  <td className="border border-black p-1">
                    {payroll.period_start && payroll.period_end
                      ? `${formatDate(payroll.period_start)} to ${formatDate(payroll.period_end)}`
                      : typeof payroll.payroll_period === "object" &&
                          payroll.payroll_period?.period_start &&
                          payroll.payroll_period?.period_end
                        ? `${formatDate(payroll.payroll_period.period_start)} to ${formatDate(payroll.payroll_period.period_end)}`
                        : "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold border border-black p-1">Designation</td>
                  <td className="border border-black p-1">
                    {payroll.designation || payroll.employee?.position || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Earnings Table */}
            <div className="font-bold text-center my-2">Earnings</div>
            <table className="w-full text-xs border border-black mb-2">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1">Date</th>
                  <th className="border border-black p-1">Status</th>
                  <th className="border border-black p-1">Daily Rate</th>
                  <th className="border border-black p-1">Amount</th>
                  <th className="border border-black p-1">Adjustments</th>
                </tr>
              </thead>
              <tbody>
                {dailyRatesData.map((data, index) => {
                  return (
                    <tr key={index} className={data.status.toLowerCase() === "no record" ? "bg-gray-50" : ""}>
                      <td className="border border-black p-1">{formatShortDate(data.date.toISOString())}</td>
                      <td className="border border-black p-1">
                        <div
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getStatusBadgeColor(data.status)}`}
                        >
                          {getStatusIcon(data.status)}
                          <span className="ml-1">{data.status}</span>
                        </div>
                      </td>
                      <td className="border border-black p-1 text-right">{formatCurrency(data.dailyRate)}</td>
                      <td className="border border-black p-1 text-right">{formatCurrency(data.amount)}</td>
                      <td className="border border-black p-1 text-right">{formatCurrency(data.adjustment)}</td>
                    </tr>
                  )
                })}
                <tr className="font-bold">
                  <td colSpan={3} className="border border-black p-1">
                    Gross Salary
                  </td>
                  <td colSpan={2} className="border border-black p-1 text-right">
                    {formatCurrency(grossPay)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Deductions Table */}
            <div className="font-bold text-center my-2">Deductions</div>
            <table className="w-full text-xs border border-black mb-2">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1">Type</th>
                  <th className="border border-black p-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["SSS", payroll.sss_deduction],
                  ["PAG-IBIG", payroll.pagibig_deduction],
                  ["PHILHEALTH", payroll.philhealth_deduction],
                  ["CASH ADVANCE", payroll.cash_advance],
                  ["LOAN", payroll.loan],
                  ["VAT", payroll.vat],
                  ["OTHERS", payroll.other_deductions],
                ].map(([label, value], i) => (
                  <tr key={i}>
                    <td className="border border-black p-1">{label}</td>
                    <td className="border border-black p-1 text-right">{formatCurrency(value)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="border border-black p-1">Total Deductions</td>
                  <td className="border border-black p-1 text-right">{formatCurrency(totalDeductions)}</td>
                </tr>
              </tbody>
            </table>

            {/* Net Salary */}
            <div className="font-bold text-right border-t border-black pt-2 pr-2 text-lg">
              NET SALARY: {formatCurrency(netPay)}
            </div>

            {/* Date */}
            <div className="text-center mt-2">{formatDate(new Date().toISOString())}</div>

            {/* Signature Section */}
            <div className="mt-10 flex flex-col items-center space-y-8">
              <div className="w-3/4 text-center border-t border-black pt-2">
                {payroll.employee_name || payroll.employee?.full_name || "Employee Name"}
                <div className="text-xs">Signature Of The Employee</div>
              </div>
              <div className="w-3/4 text-center border-t border-black pt-2">
                Crissel Ann Bando
                <div className="text-xs">Billing Assistant - OIC</div>
              </div>
            </div>

            {/* Date Printed */}
            <div className="text-xs text-center mt-6">
              Printed on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
<h3 className="mt-6 font-bold">          -----------------------CONFIDENTIAL-----------------------
</h3>
                </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PrintPayslip

