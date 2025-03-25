"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Employee {
  id: number
  employee_number: string
  full_name: string
  last_name: string
  first_name: string
  middle_name: string | null
  address: string
  position: string
  department: string
  assigned_area: string | null
  date_hired: string
  years_of_service: number
  employment_status: string
  date_of_regularization: string | null
  status_201: string | null
  resignation_termination_date: string | null
  daily_rate: number
  civil_status: string
  gender: string
  birthdate: string
  birthplace: string
  age: number
  contacts: string
  id_status: string
  sss_no: string
  tin_no: string
  philhealth_no: string
  pagibig_no: string
  emergency_contact_name: string
  emergency_contact_mobile: string
}

interface UpdateEmployeeModalProps {
  employee: Employee
  onClose: () => void
}

const UpdateEmployeeModal = ({ employee, onClose }: UpdateEmployeeModalProps) => {
  const [formData, setFormData] = useState<Employee>({ ...employee })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update full name when first, middle, or last name changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      full_name: `${prev.first_name} ${prev.middle_name || ""} ${prev.last_name}`.trim(),
    }))
  }, [formData.first_name, formData.middle_name, formData.last_name])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: ["daily_rate", "age", "years_of_service"].includes(name) ? Number(value) || 0 : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    router.put(`/employees/${formData.id}`, formData, {
      onSuccess: () => {
        toast.success("Employee updated successfully!")
        onClose()
      },
      onError: (errors) => {
        Object.entries(errors).forEach(([field, message]) => {
          toast.error(`${field}: ${message}`)
        })
        setIsSubmitting(false)
      },
      onFinish: () => {
        setIsSubmitting(false)
      },
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee Number</label>
              <input
                type="text"
                name="employee_number"
                value={formData.employee_number}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Middle Name</label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name (Auto)</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                className="w-full p-2 border rounded bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                disabled
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              >
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="billing">Billing</option>
                <option value="technician">Technician</option>
                <option value="driver technician">Driver Technician</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned Area</label>
              <input
                type="text"
                name="assigned_area"
                value={formData.assigned_area || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Hired</label>
              <input
                type="date"
                name="date_hired"
                value={formData.date_hired}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Regularization Date</label>
              <input
                type="date"
                name="date_of_regularization"
                value={formData.date_of_regularization || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Employment Status</label>
              <select
                name="employment_status"
                value={formData.employment_status}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              >
                <option value="Probationary">Probationary</option>
                <option value="Regular">Regular</option>
                <option value="Contractual">Contractual</option>
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Daily Rate</label>
              <select
                name="daily_rate"
                value={formData.daily_rate}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              >
                <option value={600}>600</option>
                <option value={650}>650</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Civil Status</label>
              <select
                name="civil_status"
                value={formData.civil_status}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Birthdate</label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Birthplace</label>
              <input
                type="text"
                name="birthplace"
                value={formData.birthplace}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Number</label>
              <input
                type="text"
                name="contacts"
                value={formData.contacts}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">SSS Number</label>
              <input
                type="text"
                name="sss_no"
                value={formData.sss_no}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">TIN Number</label>
              <input
                type="text"
                name="tin_no"
                value={formData.tin_no}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">PhilHealth Number</label>
              <input
                type="text"
                name="philhealth_no"
                value={formData.philhealth_no}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pag-IBIG Number</label>
              <input
                type="text"
                name="pagibig_no"
                value={formData.pagibig_no}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Contact Name</label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Contact Number</label>
              <input
                type="text"
                name="emergency_contact_mobile"
                value={formData.emergency_contact_mobile}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default UpdateEmployeeModal

