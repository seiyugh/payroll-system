"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner" // Import Sonner for notifications
import { Button } from "@/components/ui/button"
import { Inertia } from "@inertiajs/inertia"

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
  onSubmit: (data: Employee) => void
}

const UpdateEmployeeModal = ({ employee, onClose, onSubmit }: UpdateEmployeeModalProps) => {
  const [formData, setFormData] = useState<Employee>({ ...employee })
  const [errors, setErrors] = useState<any>({}) // To capture errors

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
    // Handle your form submission logic, e.g. validate form and submit
    // Example validation:
    const errorMessages = {} as any
    if (!formData.birthplace) errorMessages.birthplace = "The birthplace field is required."
    if (!formData.id_status) errorMessages.id_status = "The id status field is required."

    if (Object.keys(errorMessages).length) {
      setErrors(errorMessages)
      Object.values(errorMessages).forEach((message: string) => {
        toast.error(`${message}`)
      })
    } else {
      Inertia.put(route("employees.update", formData.id), formData, {
        onSuccess: () => {
          toast.success("Employee updated successfully!")
          onClose()
        },
        onError: (errors) => {
          Object.entries(errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`)
          })
        },
      })
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black text-black dark:text-white p-6 rounded-lg shadow-lg w-[600px] max-h-[80vh] overflow-y-auto border border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Edit Employee</h2>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {Object.keys(formData).map(
            (key) =>
              key !== "id" && (
                <input
                  key={key}
                  type="text"
                  name={key}
                  value={(formData as any)[key] || ""}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-black dark:text-white rounded focus:ring focus:ring-gray-400 dark:focus:ring-gray-600"
                  placeholder={key.replace("_", " ").toUpperCase()}
                />
              ),
          )}
        </div>

        <div className="flex justify-end mt-4 space-x-2">
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
          >
            Update
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UpdateEmployeeModal

