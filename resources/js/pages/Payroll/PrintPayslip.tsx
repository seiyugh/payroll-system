"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface PrintPayslipProps {
  payroll: any
  onClose: () => void
}

const PrintPayslip = ({ payroll, onClose }: PrintPayslipProps) => {
  const printRef = useRef<HTMLDivElement>(null)

  // Add this function to help debug the payroll object structure
  const logPayrollStructure = (payroll: any) => {
    console.log("Payroll object keys:", Object.keys(payroll))
    console.log("daily_rate value:", payroll.daily_rate)
    console.log("daily_rates value:", payroll.daily_rates)

    if (typeof payroll.daily_rates === "string") {
      try {
        // If daily_rates is stored as a JSON string, try to parse it
        const parsedRates = JSON.parse(payroll.daily_rates)
        console.log("Parsed daily_rates:", parsedRates)
      } catch (e) {
        console.log("Failed to parse daily_rates as JSON")
      }
    }
  }

  // Log the payroll structure to help debug
  logPayrollStructure(payroll)

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

  // In the generateDailyRatesFromPeriod function, update the console log
  const generateDailyRatesFromPeriod = (startDate: string, endDate: string, dailyRate: number) => {
    // Add console log to debug the daily rate value
    console.log("Daily rate value used for payslip:", dailyRate)

    const start = new Date(startDate)
    const end = new Date(endDate)
    const rates = []

    const currentDate = new Date(start)
    while (currentDate <= end) {
      rates.push({
        date: new Date(currentDate).toISOString().split("T")[0],
        amount: dailyRate.toString(),
        additional: "0",
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return rates
  }

  // Format currency values
  const formatCurrency = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "0.00"
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return numValue.toFixed(2)
  }

  // Handle print action
  const handlePrint = () => {
    if (!printRef.current) return

    const printWindow = window.open("", "", "width=800,height=600")
    if (!printWindow) return

    // Get the payslip content
    const content = printRef.current.innerHTML

    // Write content to new window
    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${payroll.employee_name || payroll.employee?.full_name || payroll.employee_number}</title>
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
              background-color: #5a6474 !important;
              color: white;
              text-align: center;
              padding: 6px;
              font-weight: bold;
              font-size: 12px;
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
          <td>${payroll.employee_name ?? payroll.employee?.full_name ?? payroll.employee_number}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Department</td>
          <td>${payroll.department ?? "ADMINISTRATIVE"}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Cut-off Period</td>
          <td>
            ${
              payroll.period_start && payroll.period_end
                ? `${formatDate(payroll.period_start)} to ${formatDate(payroll.period_end)}`
                : typeof payroll.payroll_period === "object" &&
                    payroll.payroll_period?.period_start &&
                    payroll.payroll_period?.period_end
                  ? `${formatDate(payroll.payroll_period.period_start)} to ${formatDate(payroll.payroll_period.period_end)}`
                  : "Mar 10 to 16, 2025"
            }
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Designation</td>
          <td>${payroll.designation ?? "Area Manager"}</td>
        </tr>
      </table>

      <div class="section-title">Earnings</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Daily Rate</th>
            <th>Adjustments</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            // If we have daily rates, use them
            if (
              Array.isArray(payroll.daily_rates) &&
              payroll.daily_rates.length > 0 &&
              payroll.daily_rates.some((rate) => rate.date)
            ) {
              return payroll.daily_rates
                .map((rate) =>
                  rate.date
                    ? `<tr>
                        <td>${formatDate(rate.date)}</td>
                        <td class="text-right">${formatCurrency(rate.amount)}</td>
                        <td class="text-right">${formatCurrency(rate.additional)}</td>
                      </tr>`
                    : "",
                )
                .join("")
            }

            // If we have period start and end dates, generate daily rates
            if (payroll.period_start && payroll.period_end) {
              // Get the daily_rates value from the payroll object
              // This is the actual value from the database
              let dailyRate = 0

              // Check if daily_rates exists as a number
              if (typeof payroll.daily_rates === "number") {
                dailyRate = payroll.daily_rates
              }
              // Check if daily_rates exists as a string that can be parsed as a number
              else if (typeof payroll.daily_rates === "string" && !isNaN(Number.parseFloat(payroll.daily_rates))) {
                dailyRate = Number.parseFloat(payroll.daily_rates)
              }
              // If we still don't have a value, try to parse it as JSON
              else if (typeof payroll.daily_rates === "string") {
                try {
                  const parsedRates = JSON.parse(payroll.daily_rates)
                  if (Array.isArray(parsedRates) && parsedRates.length > 0) {
                    dailyRate = Number.parseFloat(parsedRates[0].amount || parsedRates[0].daily_rate || 0)
                  }
                } catch (e) {
                  console.log("Failed to parse daily_rates as JSON")
                }
              }

              console.log("Using daily rate from database:", dailyRate)
              const generatedRates = generateDailyRatesFromPeriod(payroll.period_start, payroll.period_end, dailyRate)
              return generatedRates
                .map(
                  (rate) =>
                    `<tr>
                    <td>${formatDate(rate.date)}</td>
                    <td class="text-right">${formatCurrency(rate.amount)}</td>
                    <td class="text-right">${formatCurrency(rate.additional)}</td>
                  </tr>`,
                )
                .join("")
            }

            // If we have payroll period object, use that
            if (
              typeof payroll.payroll_period === "object" &&
              payroll.payroll_period?.period_start &&
              payroll.payroll_period?.period_end
            ) {
              // Always use daily_rates from the database, not a hardcoded value
              let dailyRate = 0

              // Check if daily_rates exists as a number
              if (typeof payroll.daily_rates === "number") {
                dailyRate = payroll.daily_rates
              }
              // Check if daily_rates exists as a string that can be parsed as a number
              else if (typeof payroll.daily_rates === "string" && !isNaN(Number.parseFloat(payroll.daily_rates))) {
                dailyRate = Number.parseFloat(payroll.daily_rates)
              }
              // If we still don't have a value, try to parse it as JSON
              else if (typeof payroll.daily_rates === "string") {
                try {
                  const parsedRates = JSON.parse(payroll.daily_rates)
                  if (Array.isArray(parsedRates) && parsedRates.length > 0) {
                    dailyRate = Number.parseFloat(parsedRates[0].amount || parsedRates[0].daily_rate || 0)
                  }
                } catch (e) {
                  console.log("Failed to parse daily_rates as JSON")
                }
              }

              console.log("Using daily rate from database:", dailyRate)
              const generatedRates = generateDailyRatesFromPeriod(
                payroll.payroll_period.period_start,
                payroll.payroll_period.period_end,
                dailyRate,
              )
              return generatedRates
                .map(
                  (rate) =>
                    `<tr>
                  <td>${formatDate(rate.date)}</td>
                  <td class="text-right">${formatCurrency(rate.amount)}</td>
                  <td class="text-right">${formatCurrency(rate.additional)}</td>
                </tr>`,
                )
                .join("")
            }

            // Fallback to default mock data only as last resort
            return Array.from(
              { length: 7 },
              (_, i) =>
                `<tr>
                  <td>Mar ${10 + i}, 2025</td>
                  <td class="text-right">545.15</td>
                  <td class="text-right">0.00</td>
                </tr>`,
            ).join("")
          })()}
          <tr style="font-weight: bold;">
            <td colspan="2">Gross Salary</td>
            <td class="text-right">${formatCurrency(payroll.gross_pay ?? 4516.12)}</td>
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
            <td class="text-right">${formatCurrency(payroll.total_deductions ?? 0)}</td>
          </tr>
        </tbody>
      </table>

      <div class="net-salary">
        NET SALARY: ${formatCurrency(payroll.net_pay ?? 4516.12)}
      </div>

      <div class="date">${formatDate(new Date().toISOString())}</div>

      <div class="signature-section">
        <div class="signature">
          <div class="signature-name">${payroll.employee_name ?? payroll.employee?.full_name ?? "Soufa, Alvin B."}</div>
          <div class="signature-title">Signature Of The Employee</div>
        </div>

        <div class="signature">
          <div class="signature-name">Crissel Ann Bando</div>
          <div class="signature-title">Billing Assistant - OIC</div>
        </div>
      </div>

      <div class="date-printed">
        Printed on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
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

        {/* Printable Content */}
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
                <td className="border border-black p-1">{payroll.department || "ADMINISTRATIVE"}</td>
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
                      : "Mar 10 to 16, 2025"}
                </td>
              </tr>
              <tr>
                <td className="font-bold border border-black p-1">Designation</td>
                <td className="border border-black p-1">{payroll.designation || "Area Manager"}</td>
              </tr>
            </tbody>
          </table>

          {/* Earnings Table */}
          <div className="font-bold text-center my-2">Earnings</div>
          <table className="w-full text-xs border border-black mb-2">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-1">Date</th>
                <th className="border border-black p-1">Daily Rate</th>
                <th className="border border-black p-1">Adjustments</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // If we have daily rates, use them
                if (
                  Array.isArray(payroll.daily_rates) &&
                  payroll.daily_rates.length > 0 &&
                  payroll.daily_rates.some((rate) => rate.date)
                ) {
                  return payroll.daily_rates.map((rate, index) =>
                    rate.date ? (
                      <tr key={index}>
                        <td className="border border-black p-1">{formatDate(rate.date)}</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(rate.amount)}</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(rate.additional)}</td>
                      </tr>
                    ) : null,
                  )
                }

                // If we have period start and end dates, generate daily rates
                if (payroll.period_start && payroll.period_end) {
                  // Get the daily_rates value from the payroll object
                  // This is the actual value from the database
                  let dailyRate = 0

                  // Check if daily_rates exists as a number
                  if (typeof payroll.daily_rates === "number") {
                    dailyRate = payroll.daily_rates
                  }
                  // Check if daily_rates exists as a string that can be parsed as a number
                  else if (typeof payroll.daily_rates === "string" && !isNaN(Number.parseFloat(payroll.daily_rates))) {
                    dailyRate = Number.parseFloat(payroll.daily_rates)
                  }
                  // If we still don't have a value, try to parse it as JSON
                  else if (typeof payroll.daily_rates === "string") {
                    try {
                      const parsedRates = JSON.parse(payroll.daily_rates)
                      if (Array.isArray(parsedRates) && parsedRates.length > 0) {
                        dailyRate = Number.parseFloat(parsedRates[0].amount || parsedRates[0].daily_rate || 0)
                      }
                    } catch (e) {
                      console.log("Failed to parse daily_rates as JSON")
                    }
                  }

                  console.log("Using daily rate from database:", dailyRate)
                  const generatedRates = generateDailyRatesFromPeriod(
                    payroll.period_start,
                    payroll.period_end,
                    dailyRate,
                  )
                  return generatedRates.map((rate, index) => (
                    <tr key={index}>
                      <td className="border border-black p-1">{formatDate(rate.date)}</td>
                      <td className="border border-black p-1 text-right">{formatCurrency(rate.amount)}</td>
                      <td className="border border-black p-1 text-right">{formatCurrency(rate.additional)}</td>
                    </tr>
                  ))
                }

                // If we have payroll period object, use that
                if (
                  typeof payroll.payroll_period === "object" &&
                  payroll.payroll_period?.period_start &&
                  payroll.payroll_period?.period_end
                ) {
                  // Always use daily_rates from the database, not a hardcoded value
                  let dailyRate = 0

                  // Check if daily_rates exists as a number
                  if (typeof payroll.daily_rates === "number") {
                    dailyRate = payroll.daily_rates
                  }
                  // Check if daily_rates exists as a string that can be parsed as a number
                  else if (typeof payroll.daily_rates === "string" && !isNaN(Number.parseFloat(payroll.daily_rates))) {
                    dailyRate = Number.parseFloat(payroll.daily_rates)
                  }
                  // If we still don't have a value, try to parse it as JSON
                  else if (typeof payroll.daily_rates === "string") {
                    try {
                      const parsedRates = JSON.parse(payroll.daily_rates)
                      if (Array.isArray(parsedRates) && parsedRates.length > 0) {
                        dailyRate = Number.parseFloat(parsedRates[0].amount || parsedRates[0].daily_rate || 0)
                      }
                    } catch (e) {
                      console.log("Failed to parse daily_rates as JSON")
                    }
                  }

                  console.log("Using daily rate from database:", dailyRate)
                  const generatedRates = generateDailyRatesFromPeriod(
                    payroll.payroll_period.period_start,
                    payroll.payroll_period.period_end,
                    dailyRate,
                  )
                  return generatedRates.map((rate, index) => (
                    <tr key={index}>
                      <td className="border border-black p-1">{formatDate(rate.date)}</td>
                      <td className="border border-black p-1 text-right">{formatCurrency(rate.amount)}</td>
                      <td className="border border-black p-1 text-right">{formatCurrency(rate.additional)}</td>
                    </tr>
                  ))
                }

                // Fallback to default mock data only as last resort
                return Array.from({ length: 7 }, (_, i) => (
                  <tr key={i}>
                    <td className="border border-black p-1">{`March ${10 + i}, 2025`}</td>
                    <td className="border border-black p-1 text-right">{formatCurrency(545.15)}</td>
                    <td className="border border-black p-1 text-right">{formatCurrency(0)}</td>
                  </tr>
                ))
              })()}
              <tr className="font-bold">
                <td colSpan={2} className="border border-black p-1">
                  Gross Salary
                </td>
                <td className="border border-black p-1 text-right">{formatCurrency(payroll.gross_pay ?? 4516.12)}</td>
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
                <td className="border border-black p-1 text-right">
                  {formatCurrency(payroll.total_deductions || "0.00")}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Net Salary */}
          <div className="font-bold text-right border-t border-black pt-2 pr-2 text-lg">
            NET SALARY: {formatCurrency(payroll.net_pay || "4516.12")}
          </div>

          {/* Date */}
          <div className="text-center mt-2">{formatDate(new Date().toISOString())}</div>

          {/* Signature Section */}
          <div className="mt-10 flex flex-col items-center space-y-8">
            <div className="w-3/4 text-center border-t border-black pt-2">
              {payroll.employee_name || payroll.employee?.full_name || "Soufa, Alvin B."}
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintPayslip

