"use client"

import type React from "react"
import { Inertia } from "@inertiajs/inertia"
import { Head } from "@inertiajs/inertia-react"

interface EmployeeProps {
  employee: {
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
    id_status: number
    sss_no: string | null
    tin_no: string | null
    philhealth_no: string | null
    pagibig_no: string | null
    emergency_contact_name: string
    emergency_contact_mobile: string
  }
}

const EmployeeShow: React.FC<EmployeeProps> = ({ employee }) => {
  return (
    <>
      <Head title="Employee Details" />

      <div className="container mx-auto my-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-semibold mb-4">{employee.full_name}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p>
                <strong>Employee Number:</strong> {employee.employee_number}
              </p>
              <p>
                <strong>Full Name:</strong> {employee.full_name}
              </p>
              <p>
                <strong>Position:</strong> {employee.position}
              </p>
              <p>
                <strong>Department:</strong> {employee.department}
              </p>
              <p>
                <strong>Address:</strong> {employee.address}
              </p>
              <p>
                <strong>Birthdate:</strong> {employee.birthdate}
              </p>
              <p>
                <strong>Civil Status:</strong> {employee.civil_status}
              </p>
              <p>
                <strong>Gender:</strong> {employee.gender}
              </p>
            </div>

            <div className="space-y-2">
              <p>
                <strong>Date Hired:</strong> {employee.date_hired}
              </p>
              <p>
                <strong>Years of Service:</strong> {employee.years_of_service}
              </p>
              <p>
                <strong>Employment Status:</strong> {employee.employment_status}
              </p>
              {employee.date_of_regularization && (
                <p>
                  <strong>Date of Regularization:</strong> {employee.date_of_regularization}
                </p>
              )}
              <p>
                <strong>Emergency Contact:</strong> {employee.emergency_contact_name} (
                {employee.emergency_contact_mobile})
              </p>
              <p>
                <strong>SSS No:</strong> {employee.sss_no ?? "N/A"}
              </p>
              <p>
                <strong>TIN No:</strong> {employee.tin_no ?? "N/A"}
              </p>
              <p>
                <strong>PhilHealth No:</strong> {employee.philhealth_no ?? "N/A"}
              </p>
              <p>
                <strong>PAGIBIG No:</strong> {employee.pagibig_no ?? "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => Inertia.visit(route("employees.index"))}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Back to Employee List
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default EmployeeShow

