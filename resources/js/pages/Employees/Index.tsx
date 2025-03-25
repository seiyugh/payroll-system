"use client"

import { Head, router, usePage } from "@inertiajs/react"
import { useState, useEffect } from "react"
import AppLayout from "@/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownUp, Download, Filter, Plus, Search, Users, Briefcase, Building, Calendar, Phone } from "lucide-react"
import { toast } from "sonner"
import AddEmployeeModal from "./AddEmployeeModal"
import UpdateEmployeeModal from "./UpdateEmployeeModal"
import Modal from "./Modal"

// Import the export utility
import { exportToCSV } from "@/utils/export-utils"

interface Employee {
  id?: number
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
  sss_no: string | null
  tin_no: string | null
  philhealth_no: string | null
  pagibig_no: string | null
  emergency_contact_name: string
  emergency_contact_mobile: string
  created_at?: string | null
  updated_at?: string | null
  email?: string | null
}

interface EmployeesIndexProps {
  employees: Employee[]
}

const EmployeesIndex = ({ employees = [] }: EmployeesIndexProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState<string>("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [activeView, setActiveView] = useState("table")
  const [sortField, setSortField] = useState<string>("employee_number")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Sample data for demo if no employees provided
  const employeeData = employees || []

  // Open & Close Add Employee Modal
  const openAddModal = () => setIsAddModalOpen(true)
  const closeAddModal = () => setIsAddModalOpen(false)

  // Open & Close Update Employee Modal
  const openUpdateModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsUpdateModalOpen(true)
  }
  const closeUpdateModal = () => {
    setSelectedEmployee(null)
    setIsUpdateModalOpen(false)
  }

  // Handle adding new employee
  const handleAddEmployee = (data: Employee) => {
    router.post(route("employees.store"), data, {
      onSuccess: () => {
        toast.success("Employee added successfully!")
        closeAddModal()
      },
      onError: (errors) => {
        Object.values(errors).forEach((message) => {
          toast.error(`Error: ${message}`)
        })
      },
    })
  }

  // Handle updating an employee
  const handleUpdateEmployee = (data: Employee) => {
    if (selectedEmployee?.id) {
      router.put(route("employees.update", selectedEmployee.id), data, {
        onSuccess: () => {
          toast.success("Employee updated successfully!")
          closeUpdateModal()
        },
        onError: (errors) => {
          Object.values(errors).forEach((message) => {
            toast.error(`Error: ${message}`)
          })
        },
      })
    }
  }

  const handleDeleteEmployee = (employeeId: number) => {
    router.delete(`/employees/${employeeId}`, {
      onSuccess: () => {
        toast.success("Employee deleted successfully!")
        setIsDeleteModalOpen(false)
      },
      onError: (errors) => {
        Object.values(errors).forEach((message) => {
          toast.error(`Error: ${message}`)
        })
      },
    })
  }

  // Handle bulk add employees
  const handleBulkAddEmployees = (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    router.post("/employees/bulk-store", formData, {
      onSuccess: () => {
        toast.success("Employees added successfully from bulk upload!")
        setIsBulkAddModalOpen(false)
      },
      onError: (errors) => {
        Object.values(errors).forEach((message) => {
          toast.error(`Error: ${message}`)
        })
      },
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setPositionFilter("")
    setDepartmentFilter("")
    setStatusFilter("")
  }

  // Toggle sort
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filter and sort employees
  const filteredEmployees = employeeData
    .filter((employee) => {
      const matchesSearchTerm =
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_number.includes(searchTerm)
      const matchesPosition = positionFilter
        ? employee.position.toLowerCase().includes(positionFilter.toLowerCase())
        : true
      const matchesDepartment = departmentFilter
        ? employee.department.toLowerCase().includes(departmentFilter.toLowerCase())
        : true
      const matchesStatus = statusFilter
        ? employee.employment_status.toLowerCase().includes(statusFilter.toLowerCase())
        : true

      return matchesSearchTerm && matchesPosition && matchesDepartment && matchesStatus
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

  // Get unique positions and departments for filters
  const uniquePositions = Array.from(new Set(employeeData.map((emp) => emp.position)))
  const uniqueDepartments = Array.from(new Set(employeeData.map((emp) => emp.department)))
  const uniqueStatuses = Array.from(new Set(employeeData.map((emp) => emp.employment_status)))

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "regular":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
      case "probationary":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
      case "resigned":
      case "terminated":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  const { route } = usePage().props

  // Add this function to the component
  const handleExportToCSV = () => {
    toast.success("Exporting employee data...")

    try {
      // Prepare data for export
      const exportData = filteredEmployees.map((employee) => {
        return {
          EmployeeNumber: employee.employee_number,
          FullName: employee.full_name,
          Position: employee.position,
          Department: employee.department,
          DateHired: new Date(employee.date_hired).toLocaleDateString(),
          EmploymentStatus: employee.employment_status,
          DailyRate: employee.daily_rate,
          Email: employee.email || "",
          Address: employee.address,
          Gender: employee.gender,
          CivilStatus: employee.civil_status,
          Birthdate: employee.birthdate ? new Date(employee.birthdate).toLocaleDateString() : "",
          ContactNumber: employee.contacts,
          SSS: employee.sss_no || "",
          TIN: employee.tin_no || "",
          PhilHealth: employee.philhealth_no || "",
          PagIBIG: employee.pagibig_no || "",
        }
      })

      // Generate filename with date
      const date = new Date().toISOString().split("T")[0]
      const filename = `employees_export_${date}.csv`

      // Export to CSV
      exportToCSV(exportData, filename)

      toast.success("Export completed successfully!")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export data. Please try again.")
    }
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Employees", href: "/employees" },
      ]}
    >
      <div className="flex-1 p-6 bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
        <Head title="Employees" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Employee Directory</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your employee records and information</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              onClick={openAddModal}
              className="border-indigo-200 text-indigo-600 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:border-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Employee
            </Button>
            <Button
              onClick={() => setIsBulkAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Bulk Add
            </Button>
            <Button
              variant="outline"
              onClick={handleExportToCSV}
              className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Employees</p>
                <p className="text-2xl font-bold mt-1">{employeeData.length}</p>
              </div>
              <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-500">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Regular</p>
                <p className="text-2xl font-bold mt-1">
                  {employeeData.filter((e) => e.employment_status === "Regular").length}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  {Math.round(
                    (employeeData.filter((e) => e.employment_status === "Regular").length / employeeData.length) * 100,
                  )}
                  % of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Probationary</p>
                <p className="text-2xl font-bold mt-1">
                  {employeeData.filter((e) => e.employment_status === "Probationary").length}
                </p>
                <p className="text-xs text-amber-500 mt-1">
                  {Math.round(
                    (employeeData.filter((e) => e.employment_status === "Probationary").length / employeeData.length) *
                      100,
                  )}
                  % of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-500">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Departments</p>
                <p className="text-2xl font-bold mt-1">{uniqueDepartments.length}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
                <Building className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search & Filter Section */}
        <Card className="p-4 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or employee number..."
                className="pl-10 p-2 w-full border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
              >
                <option value="">All Positions</option>
                {uniquePositions.map((position, index) => (
                  <option key={index} value={position}>
                    {position}
                  </option>
                ))}
              </select>
              <select
                className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {uniqueDepartments.map((department, index) => (
                  <option key={index} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <select
                className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status, index) => (
                  <option key={index} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
              >
                <Filter className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* View Toggle */}
        <Tabs defaultValue="table" className="mb-6" value={activeView} onValueChange={setActiveView}>
          <TabsList className="mb-4">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="cards">Card View</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="overflow-auto max-h-[500px] border rounded-lg shadow-sm border-slate-200 dark:border-slate-700">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th
                        className="py-3 px-4 text-left font-semibold cursor-pointer"
                        onClick={() => toggleSort("employee_number")}
                      >
                        <div className="flex items-center">
                          Emp #
                          {sortField === "employee_number" && (
                            <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                          )}
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 text-left font-semibold cursor-pointer"
                        onClick={() => toggleSort("full_name")}
                      >
                        <div className="flex items-center">
                          Full Name
                          {sortField === "full_name" && (
                            <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                          )}
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 text-left font-semibold cursor-pointer"
                        onClick={() => toggleSort("position")}
                      >
                        <div className="flex items-center">
                          Position
                          {sortField === "position" && (
                            <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                          )}
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 text-left font-semibold cursor-pointer"
                        onClick={() => toggleSort("department")}
                      >
                        <div className="flex items-center">
                          Department
                          {sortField === "department" && (
                            <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                          )}
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 text-left font-semibold cursor-pointer"
                        onClick={() => toggleSort("date_hired")}
                      >
                        <div className="flex items-center">
                          Date Hired
                          {sortField === "date_hired" && (
                            <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">Status</th>
                      <th className="py-3 px-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <tr
                          key={employee.id}
                          className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="py-3 px-4 font-medium">{employee.employee_number}</td>
                          <td className="py-3 px-4">{employee.full_name}</td>
                          <td className="py-3 px-4">{employee.position}</td>
                          <td className="py-3 px-4">{employee.department}</td>
                          <td className="py-3 px-4">{new Date(employee.date_hired).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusBadgeColor(employee.employment_status)}>
                              {employee.employment_status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                              onClick={() => openUpdateModal(employee)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:border-red-700"
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setIsDeleteModalOpen(true)
                              }}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                          No employees found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cards" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <Card
                      key={employee.id}
                      className="p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg mr-3">
                            {employee.first_name.charAt(0)}
                            {employee.last_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.full_name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{employee.employee_number}</p>
                          </div>
                        </div>
                        <Badge className={getStatusBadgeColor(employee.employment_status)}>
                          {employee.employment_status}
                        </Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm">
                          <Briefcase className="h-4 w-4 mr-2 text-slate-400" />
                          <span>{employee.position}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Building className="h-4 w-4 mr-2 text-slate-400" />
                          <span>{employee.department}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                          <span>Hired: {new Date(employee.date_hired).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-slate-400" />
                          <span>{employee.contacts}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                          onClick={() => openUpdateModal(employee)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-200 text-red-600 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:border-red-700"
                          onClick={() => {
                            setSelectedEmployee(employee)
                            setIsDeleteModalOpen(true)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400">
                    No employees found matching your filters.
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {isAddModalOpen && <AddEmployeeModal onClose={closeAddModal} onSubmit={handleAddEmployee} />}
        {isUpdateModalOpen && selectedEmployee && (
          <UpdateEmployeeModal employee={selectedEmployee} onClose={closeUpdateModal} onSubmit={handleUpdateEmployee} />
        )}
        {isDeleteModalOpen && selectedEmployee && (
          <Modal
            employee={selectedEmployee}
            onClose={() => setIsDeleteModalOpen(false)}
            onDelete={() => handleDeleteEmployee(selectedEmployee.id!)}
          />
        )}
        {isBulkAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg w-[500px] max-h-[80vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4">Bulk Add Employees</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Upload a CSV or Excel file with employee data.</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 mb-4"
                onChange={(e) => e.target.files && handleBulkAddEmployees(e.target.files[0])}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsBulkAddModalOpen(false)}
                  className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                >
                  Cancel
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Upload</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default EmployeesIndex

