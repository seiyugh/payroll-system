"use client"
import { toast } from "sonner" // Import Sonner for notifications
import { useForm } from "@inertiajs/react" // Inertia form handling
import { Button } from "@/components/ui/button"

const AddEmployeeModal = ({ onClose }) => {
  const { data, setData, post, errors, processing } = useForm({
    employee_number: "",
    full_name: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    address: "",
    position: "admin",
    department: "",
    assigned_area: "",
    date_hired: "",
    years_of_service: "",
    employment_status: "Probationary",
    date_of_regularization: "",
    status_201: "incomplete",
    resignation_termination_date: "",
    daily_rate: 1,
    civil_status: "Single",
    gender: "Male",
    birthdate: "",
    birthplace: "",
    age: "",
    contacts: "",
    id_status: "incomplete",
    sss_no: "",
    tin_no: "",
    philhealth_no: "",
    pagibig_no: "",
    emergency_contact_name: "",
    emergency_contact_mobile: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      [name]: ["daily_rate", "id_status", "age", "contacts"].includes(name) ? Number.parseInt(value) || "" : value,
      full_name: `${prev.first_name} ${prev.middle_name} ${prev.last_name}`.trim(),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    post(route("employees.store"), {
      onSuccess: () => {
        toast.success("Employee added successfully!")

        // Clear form fields
        setData({
          employee_number: "",
          full_name: "",
          last_name: "",
          first_name: "",
          middle_name: "",
          address: "",
          position: "admin",
          department: "",
          assigned_area: "",
          date_hired: "",
          years_of_service: "",
          employment_status: "Probationary",
          date_of_regularization: "",
          status_201: "incomplete",
          resignation_termination_date: "",
          daily_rate: 1,
          civil_status: "Single",
          gender: "Male",
          birthdate: "",
          birthplace: "",
          age: "",
          contacts: "",
          id_status: "incomplete",
          sss_no: "",
          tin_no: "",
          philhealth_no: "",
          pagibig_no: "",
          emergency_contact_name: "",
          emergency_contact_mobile: "",
        })

        // Close modal
        onClose()
      },
      onError: (errors) => {
        Object.entries(errors).forEach(([field, message]) => {
          toast.error(`${field}: ${message}`)
        })
      },
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black text-black dark:text-white p-6 rounded-lg shadow-lg w-[600px] max-h-[80vh] overflow-y-auto border border-gray-300 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Add Employee</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mt-4 dark:text-white">
            <InputField
              label="Employee Number"
              name="employee_number"
              value={data.employee_number}
              onChange={handleChange}
              error={errors.employee_number}
            />
            <InputField
              label="First Name"
              name="first_name"
              value={data.first_name}
              onChange={handleChange}
              error={errors.first_name}
            />
            <InputField
              label="Middle Name"
              name="middle_name"
              value={data.middle_name}
              onChange={handleChange}
              error={errors.middle_name}
            />
            <InputField
              label="Last Name"
              name="last_name"
              value={data.last_name}
              onChange={handleChange}
              error={errors.last_name}
            />
            <InputField label="Full Name (Auto)" name="full_name" value={data.full_name} disabled />

            <InputField
              label="Address"
              name="address"
              value={data.address}
              onChange={handleChange}
              error={errors.address}
            />
            <SelectField
              label="Position"
              name="position"
              value={data.position}
              onChange={handleChange}
              options={[
                { value: 1, label: "admin" },
                { value: 2, label: "hr" },
                { value: 3, label: "billing" },
                { value: 4, label: "technician" },
                { value: 5, label: "Driver technician" },

              ]}
            />
            <InputField
              label="Department"
              name="department"
              value={data.department}
              onChange={handleChange}
              error={errors.department}
            />
            <InputField
              label="Assigned Area"
              name="assigned_area"
              value={data.assigned_area}
              onChange={handleChange}
              error={errors.assigned_area}
            />

            <InputField
              type="date"
              label="Date Hired"
              name="date_hired"
              value={data.date_hired}
              onChange={handleChange}
              error={errors.date_hired}
            />
            <InputField
              type="date"
              label="Regularization Date"
              name="date_of_regularization"
              value={data.date_of_regularization}
              onChange={handleChange}
              error={errors.date_of_regularization}
            />
            <InputField
              type="date"
              label="Birthdate"
              name="birthdate"
              value={data.birthdate}
              onChange={handleChange}
              error={errors.birthdate}
            />
            <InputField
              type="text"
              label="Birth Place"
              name="birthplace"
              value={data.birthplace}
              onChange={handleChange}
              error={errors.birthplace}
            />

            <InputField
              type="number"
              label="Years of Service"
              name="years_of_service"
              value={data.years_of_service}
              onChange={handleChange}
              error={errors.years_of_service}
            />
            <InputField
              type="number"
              label="Age"
              name="age"
              value={data.age}
              onChange={handleChange}
              error={errors.age}
            />
            <InputField
              type="number"
              label="Contacts"
              name="contacts"
              value={data.contacts}
              onChange={handleChange}
              error={errors.contacts}
            />

            <SelectField
              label="Rate Type"
              name="daily_rate"
              value={data.daily_rate}
              onChange={handleChange}
              options={[
                { value: 600, label: "600" },
                { value: 650, label: "650" },
              ]}
            />
            <SelectField
              label="Civil Status"
              name="civil_status"
              value={data.civil_status}
              onChange={handleChange}
              options={["Single", "Married", "Divorced"]}
            />
            <SelectField
              label="Gender"
              name="gender"
              value={data.gender}
              onChange={handleChange}
              options={["Male", "Female", "Other"]}
            />
            <SelectField
              label="ID Status"
              name="id_status"
              value={data.id_status}
              onChange={handleChange}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
            <SelectField
              label="Status 201"
              name="status_201"
              value={data.status_201}
              onChange={handleChange}
              options={[
                { value: "complete", label: "Complete" },
                { value: "incomplete", label: "Incomplete" },
              ]}
            />

            <InputField
              label="Emergency Contact Name"
              name="emergency_contact_name"
              value={data.emergency_contact_name}
              onChange={handleChange}
              error={errors.emergency_contact_name}
            />
            <InputField
              type="number"
              label="Emergency Contact Mobile"
              name="emergency_contact_mobile"
              value={data.emergency_contact_mobile}
              onChange={handleChange}
              error={errors.emergency_contact_mobile}
            />
          </div>

          <div className="flex justify-end mt-6 space-x-2">
            <Button variant="outline" onClick={onClose} className="border-gray-500 text-gray-600">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="bg-black text-white hover:opacity-80"
              disabled={processing}
            >
              {processing ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const InputField = ({ label, type = "text", name, value, onChange, disabled, error }) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full p-2 border rounded"
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

const SelectField = ({ label, name, value, onChange, options }) => (
  <div className="flex flex-col">
    <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">{label}</label>
    <select name={name} value={value} onChange={onChange} className="w-full p-2 border rounded">
      {options.map((opt) => (
        <option key={opt.value || opt} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  </div>
)

export default AddEmployeeModal

