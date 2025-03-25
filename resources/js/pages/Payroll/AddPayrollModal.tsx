"use client"

import { useEffect, useState } from "react"
import { useForm } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const AddPayrollModal = ({ onClose, employees = [], payrollPeriods = [] }) => {
  const { data, setData, post, processing, errors, reset } = useForm({
    employee_number: "",
    employee_name: "",
    department: "",
    designation: "",
    payroll_period_id: "",
    period_start: "",
    period_end: "",
    payment_date: "",
    daily_rates: [
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
    ],
    gross_pay: "",
    sss_deduction: "",
    philhealth_deduction: "",
    pagibig_deduction: "",
    cash_advance: "",
    loan: "",
    vat: "",
    other_deductions: "",
    total_deductions: "",
    net_pay: "",
    status: "Pending",
  })

  // State to track if we should auto-calculate deductions
  const [autoCalculate, setAutoCalculate] = useState(true)

  // Get selected employee data
  const selectedEmployee = employees.find((emp) => emp.employee_number === data.employee_number)

  // When employee is selected, populate their details
  useEffect(() => {
    if (selectedEmployee) {
      setData((prev) => ({
        ...prev,
        employee_name: selectedEmployee.full_name || "",
        department: selectedEmployee.department || "",
        designation: selectedEmployee.position || "",
      }))
    }
  }, [data.employee_number, selectedEmployee])

  // When payroll period is selected, populate the dates
  useEffect(() => {
    const selectedPeriod = payrollPeriods.find((p) => p.id === Number(data.payroll_period_id))
    if (selectedPeriod) {
      // Set period start and end dates
      setData((prev) => ({
        ...prev,
        period_start: selectedPeriod.period_start,
        period_end: selectedPeriod.period_end,
        payment_date: selectedPeriod.payment_date,
      }))

      // Generate daily rate entries based on the period
      const startDate = new Date(selectedPeriod.period_start)
      const endDate = new Date(selectedPeriod.period_end)
      const dailyRates = []

      // Create an entry for each day in the period (max 7 days for weekly)
      const currentDate = new Date(startDate)
      while (currentDate <= endDate && dailyRates.length < 7) {
        dailyRates.push({
          date: currentDate.toISOString().split("T")[0],
          amount: selectedEmployee?.daily_rate || "545.15", // Default to 545.15 if not available
          additional: "0",
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Fill remaining slots with empty entries if less than 7 days
      while (dailyRates.length < 7) {
        dailyRates.push({ date: "", amount: "", additional: "" })
      }

      setData((prev) => ({
        ...prev,
        daily_rates: dailyRates,
      }))
    }
  }, [data.payroll_period_id, payrollPeriods, selectedEmployee])

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setData(name, value)
  }

  // Handle daily rate changes
  const handleDailyRateChange = (index, field, value) => {
    const updatedRates = [...data.daily_rates]
    updatedRates[index] = {
      ...updatedRates[index],
      [field]: value,
    }

    setData("daily_rates", updatedRates)
  }

  // Calculate gross pay based on daily rates
  useEffect(() => {
    const grossPay = data.daily_rates.reduce((sum, day) => {
      const dailyAmount = Number.parseFloat(day.amount) || 0
      const additionalAmount = Number.parseFloat(day.additional) || 0
      return sum + dailyAmount + additionalAmount
    }, 0)

    setData("gross_pay", grossPay.toFixed(2))
  }, [data.daily_rates])

  // Auto-calculate SSS, PhilHealth, and Pag-IBIG deductions based on gross pay
  useEffect(() => {
    if (!autoCalculate || !data.gross_pay) return

    const grossPay = Number.parseFloat(data.gross_pay) || 0

    // SSS contribution calculation (simplified version)
    let sssContribution = 0
    if (grossPay <= 3250) {
      sssContribution = 135
    } else if (grossPay <= 24750) {
      // Simplified calculation - in reality this has brackets
      sssContribution = grossPay * 0.045
    } else {
      sssContribution = 1125 // Maximum SSS contribution
    }

    // PhilHealth contribution calculation (4% of gross pay, split between employer and employee)
    const philhealthContribution = Math.min(grossPay * 0.02, 1800) // 2% from employee, capped at 1800

    // Pag-IBIG contribution calculation (usually 2% of gross pay)
    const pagibigContribution = Math.min(grossPay * 0.02, 100) // 2%, capped at 100

    setData((prev) => ({
      ...prev,
      sss_deduction: sssContribution.toFixed(2),
      philhealth_deduction: philhealthContribution.toFixed(2),
      pagibig_deduction: pagibigContribution.toFixed(2),
    }))
  }, [data.gross_pay, autoCalculate])

  // Calculate total deductions and net pay
  useEffect(() => {
    const sssDeduction = Number.parseFloat(data.sss_deduction) || 0
    const philhealthDeduction = Number.parseFloat(data.philhealth_deduction) || 0
    const pagibigDeduction = Number.parseFloat(data.pagibig_deduction) || 0
    const cashAdvance = Number.parseFloat(data.cash_advance) || 0
    const loan = Number.parseFloat(data.loan) || 0
    const vat = Number.parseFloat(data.vat) || 0
    const otherDeductions = Number.parseFloat(data.other_deductions) || 0

    const totalDeductions =
      sssDeduction + philhealthDeduction + pagibigDeduction + cashAdvance + loan + vat + otherDeductions

    const grossPay = Number.parseFloat(data.gross_pay) || 0
    const netPay = grossPay - totalDeductions

    setData((prev) => ({
      ...prev,
      total_deductions: totalDeductions.toFixed(2),
      net_pay: netPay.toFixed(2),
    }))
  }, [
    data.gross_pay,
    data.sss_deduction,
    data.philhealth_deduction,
    data.pagibig_deduction,
    data.cash_advance,
    data.loan,
    data.vat,
    data.other_deductions,
  ])

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    post("/payroll", {
      onSuccess: () => {
        toast.success("Payroll added successfully!")
        reset()
        onClose()
      },
      onError: (errors) => {
        Object.values(errors).forEach((message) => {
          toast.error(`Error: ${message}`)
        })
      },
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black text-black dark:text-white p-6 rounded-lg shadow-lg w-[800px] max-h-[80vh] overflow-y-auto border border-gray-300 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Add Payroll</h2>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <SelectField
              label="Employee"
              name="employee_number"
              value={data.employee_number}
              onChange={handleChange}
              options={employees.map((emp) => ({
                value: emp.employee_number,
                label: `${emp.employee_number} - ${emp.full_name || ""}`,
              }))}
              error={errors.employee_number}
            />

            <SelectField
              label="Payroll Period"
              name="payroll_period_id"
              value={data.payroll_period_id}
              onChange={handleChange}
              options={payrollPeriods.map((period) => ({
                value: period.id,
                label: `${new Date(period.period_start).toLocaleDateString()} - ${new Date(period.period_end).toLocaleDateString()}`,
              }))}
              error={errors.payroll_period_id}
            />

            <InputField
              label="Employee Name"
              name="employee_name"
              value={data.employee_name}
              onChange={handleChange}
              readOnly
            />

            <InputField label="Department" name="department" value={data.department} onChange={handleChange} readOnly />

            <InputField
              label="Designation"
              name="designation"
              value={data.designation}
              onChange={handleChange}
              readOnly
            />

            <InputField
              label="Payment Date"
              name="payment_date"
              value={data.payment_date ? new Date(data.payment_date).toLocaleDateString() : ""}
              onChange={handleChange}
              readOnly
            />
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-2">Daily Rates</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-blue-100 dark:bg-blue-900">
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Date</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Daily Rate</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Adjustments</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily_rates.map((rate, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 dark:border-gray-600 p-2">
                        {rate.date
                          ? new Date(rate.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : ""}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={rate.amount}
                          onChange={(e) => handleDailyRateChange(index, "amount", e.target.value)}
                          className="w-full p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={rate.additional}
                          onChange={(e) => handleDailyRateChange(index, "additional", e.target.value)}
                          className="w-full p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-medium mb-2">Earnings</h3>
              <InputField
                type="number"
                label="Gross Pay"
                name="gross_pay"
                value={data.gross_pay}
                onChange={handleChange}
                readOnly
              />
            </div>

            <div>
              <h3 className="font-medium mb-2">Deductions</h3>
              <div className="space-y-2">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={autoCalculate}
                    onChange={() => setAutoCalculate(!autoCalculate)}
                    className="mr-2"
                  />
                  <label className="text-sm">Auto-calculate mandatory deductions</label>
                </div>

                <InputField
                  type="number"
                  label="SSS"
                  name="sss_deduction"
                  value={data.sss_deduction}
                  onChange={handleChange}
                  readOnly={autoCalculate}
                />

                <InputField
                  type="number"
                  label="PhilHealth"
                  name="philhealth_deduction"
                  value={data.philhealth_deduction}
                  onChange={handleChange}
                  readOnly={autoCalculate}
                />

                <InputField
                  type="number"
                  label="Pag-IBIG"
                  name="pagibig_deduction"
                  value={data.pagibig_deduction}
                  onChange={handleChange}
                  readOnly={autoCalculate}
                />

                <InputField
                  type="number"
                  label="Cash Advance"
                  name="cash_advance"
                  value={data.cash_advance}
                  onChange={handleChange}
                />

                <InputField type="number" label="Loan" name="loan" value={data.loan} onChange={handleChange} />

                <InputField type="number" label="VAT" name="vat" value={data.vat} onChange={handleChange} />

                <InputField
                  type="number"
                  label="Others"
                  name="other_deductions"
                  value={data.other_deductions}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <InputField
              type="number"
              label="Total Deductions"
              name="total_deductions"
              value={data.total_deductions}
              onChange={handleChange}
              readOnly
            />

            <InputField
              type="number"
              label="Net Pay"
              name="net_pay"
              value={data.net_pay}
              onChange={handleChange}
              readOnly
            />

            <SelectField
              label="Status"
              name="status"
              value={data.status}
              onChange={handleChange}
              options={[
                { value: "Pending", label: "Pending" },
                { value: "Completed", label: "Completed" },
                { value: "Rejected", label: "Rejected" },
              ]}
              error={errors.status}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-500 text-gray-600 dark:border-gray-400 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={processing}
              className="bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
            >
              {processing ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Reusable Components
const InputField = ({ label, type = "text", name, value, onChange, error, readOnly = false }) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600 ${
        readOnly ? "bg-gray-100 dark:bg-gray-700" : ""
      }`}
      readOnly={readOnly}
    />
    {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
  </div>
)

const SelectField = ({ label, name, value, onChange, options, error }) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
    >
      <option value="">Select {label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
  </div>
)

export default AddPayrollModal

