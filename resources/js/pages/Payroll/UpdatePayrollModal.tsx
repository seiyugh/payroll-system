"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { router } from "@inertiajs/react"
import { toast } from "sonner"

interface Payroll {
  id: number
  employee_number: string
  employee_name: string
  department: string
  designation: string
  payroll_period_id: number
  period_start: string
  period_end: string
  payment_date: string
  daily_rates: Array<{
    date: string
    amount: string
    additional: string
  }>
  gross_pay: string
  sss_deduction: string
  philhealth_deduction: string
  pagibig_deduction: string
  cash_advance: string
  loan: string
  vat: string
  other_deductions: string
  total_deductions: string
  net_pay: string
  status: string
}

interface UpdatePayrollModalProps {
  payroll: Payroll
  onClose: () => void
  employees: any[]
  payrollPeriods: any[]
}

const UpdatePayrollModal = ({ payroll, onClose, employees, payrollPeriods }: UpdatePayrollModalProps) => {
  const [formData, setFormData] = useState<Payroll>({
    ...payroll,
    daily_rates: payroll.daily_rates || [
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
      { date: "", amount: "", additional: "" },
    ],
  })
  const [processing, setProcessing] = useState(false)
  const [autoCalculate, setAutoCalculate] = useState(false)

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle daily rate changes
  const handleDailyRateChange = (index, field, value) => {
    const updatedRates = [...formData.daily_rates]
    updatedRates[index] = {
      ...updatedRates[index],
      [field]: value,
    }

    setFormData((prev) => ({
      ...prev,
      daily_rates: updatedRates,
    }))
  }

  // Calculate gross pay based on daily rates
  useEffect(() => {
    const grossPay = formData.daily_rates.reduce((sum, day) => {
      const dailyAmount = Number.parseFloat(day.amount) || 0
      const additionalAmount = Number.parseFloat(day.additional) || 0
      return sum + dailyAmount + additionalAmount
    }, 0)

    setFormData((prev) => ({
      ...prev,
      gross_pay: grossPay.toFixed(2),
    }))
  }, [formData.daily_rates])

  // Auto-calculate deductions if enabled
  useEffect(() => {
    if (!autoCalculate) return

    const grossPay = Number.parseFloat(formData.gross_pay) || 0

    // SSS contribution calculation (simplified version)
    let sssContribution = 0
    if (grossPay <= 3250) {
      sssContribution = 135
    } else if (grossPay <= 24750) {
      sssContribution = grossPay * 0.045
    } else {
      sssContribution = 1125 // Maximum SSS contribution
    }

    // PhilHealth contribution calculation
    const philhealthContribution = Math.min(grossPay * 0.02, 1800)

    // Pag-IBIG contribution calculation
    const pagibigContribution = Math.min(grossPay * 0.02, 100)

    setFormData((prev) => ({
      ...prev,
      sss_deduction: sssContribution.toFixed(2),
      philhealth_deduction: philhealthContribution.toFixed(2),
      pagibig_deduction: pagibigContribution.toFixed(2),
    }))
  }, [formData.gross_pay, autoCalculate])

  // Calculate total deductions and net pay
  useEffect(() => {
    const sssDeduction = Number.parseFloat(formData.sss_deduction) || 0
    const philhealthDeduction = Number.parseFloat(formData.philhealth_deduction) || 0
    const pagibigDeduction = Number.parseFloat(formData.pagibig_deduction) || 0
    const cashAdvance = Number.parseFloat(formData.cash_advance) || 0
    const loan = Number.parseFloat(formData.loan) || 0
    const vat = Number.parseFloat(formData.vat) || 0
    const otherDeductions = Number.parseFloat(formData.other_deductions) || 0

    const totalDeductions =
      sssDeduction + philhealthDeduction + pagibigDeduction + cashAdvance + loan + vat + otherDeductions

    const grossPay = Number.parseFloat(formData.gross_pay) || 0
    const netPay = grossPay - totalDeductions

    setFormData((prev) => ({
      ...prev,
      total_deductions: totalDeductions.toFixed(2),
      net_pay: netPay.toFixed(2),
    }))
  }, [
    formData.gross_pay,
    formData.sss_deduction,
    formData.philhealth_deduction,
    formData.pagibig_deduction,
    formData.cash_advance,
    formData.loan,
    formData.vat,
    formData.other_deductions,
  ])

  const handleSubmit = () => {
    setProcessing(true)

    router.put(`/payroll/${payroll.id}`, formData, {
      onSuccess: () => {
        toast.success("Payroll updated successfully!")
        onClose()
      },
      onError: (errors) => {
        Object.entries(errors).forEach(([field, message]) => {
          toast.error(`${field}: ${message}`)
        })
      },
      onFinish: () => {
        setProcessing(false)
      },
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black text-black dark:text-white p-6 rounded-lg shadow-lg w-[800px] max-h-[80vh] overflow-y-auto border border-gray-300 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Update Payroll</h2>

        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InputField
              label="Employee Number"
              name="employee_number"
              value={formData.employee_number}
              onChange={handleChange}
              readOnly
            />

            <SelectField
              label="Payroll Period"
              name="payroll_period_id"
              value={formData.payroll_period_id}
              onChange={handleChange}
              options={payrollPeriods.map((period) => ({
                value: period.id,
                label: `${new Date(period.period_start).toLocaleDateString()} - ${new Date(period.period_end).toLocaleDateString()}`,
              }))}
            />

            <InputField
              label="Employee Name"
              name="employee_name"
              value={formData.employee_name}
              onChange={handleChange}
              readOnly
            />

            <InputField
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              readOnly
            />

            <InputField
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              readOnly
            />

            <InputField
              label="Payment Date"
              name="payment_date"
              value={formData.payment_date ? new Date(formData.payment_date).toLocaleDateString() : ""}
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
                  {formData.daily_rates.map((rate, index) => (
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
                value={formData.gross_pay}
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
                  value={formData.sss_deduction}
                  onChange={handleChange}
                  readOnly={autoCalculate}
                />

                <InputField
                  type="number"
                  label="PhilHealth"
                  name="philhealth_deduction"
                  value={formData.philhealth_deduction}
                  onChange={handleChange}
                  readOnly={autoCalculate}
                />

                <InputField
                  type="number"
                  label="Pag-IBIG"
                  name="pagibig_deduction"
                  value={formData.pagibig_deduction}
                  onChange={handleChange}
                  readOnly={autoCalculate}
                />

                <InputField
                  type="number"
                  label="Cash Advance"
                  name="cash_advance"
                  value={formData.cash_advance}
                  onChange={handleChange}
                />

                <InputField type="number" label="Loan" name="loan" value={formData.loan} onChange={handleChange} />

                <InputField type="number" label="VAT" name="vat" value={formData.vat} onChange={handleChange} />

                <InputField
                  type="number"
                  label="Others"
                  name="other_deductions"
                  value={formData.other_deductions}
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
              value={formData.total_deductions}
              onChange={handleChange}
              readOnly
            />

            <InputField
              type="number"
              label="Net Pay"
              name="net_pay"
              value={formData.net_pay}
              onChange={handleChange}
              readOnly
            />

            <SelectField
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: "Pending", label: "Pending" },
                { value: "Completed", label: "Completed" },
                { value: "Rejected", label: "Rejected" },
              ]}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-500 dark:border-gray-400 text-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              className="bg-black dark:bg-white text-white dark:text-black hover:opacity-80"
              disabled={processing}
            >
              {processing ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reusable Components
const InputField = ({ label, type = "text", name, value, onChange, disabled = false, readOnly = false }) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      className={`w-full p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600 ${
        readOnly ? "bg-gray-100 dark:bg-gray-700" : ""
      }`}
    />
  </div>
)

const SelectField = ({ label, name, value, onChange, options, disabled = false }) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600"
    >
      <option value="">Select {label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
)

export default UpdatePayrollModal

