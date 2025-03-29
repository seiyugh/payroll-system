"use client"

import { Head, router, usePage } from "@inertiajs/react"
import { useState, useEffect, useMemo } from "react"
import AppLayout from "@/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowDownUp,
  Filter,
  Plus,
  Search,
  Users,
  Briefcase,
  Building,
  Calendar,
  Phone,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import AddEmployeeModal from "./AddEmployeeModal"
import UpdateEmployeeModal from "./UpdateEmployeeModal"
import Modal from "./Modal"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

interface PaginationData {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
  links: {
    url: string | null
    label: string
    active: boolean
  }[]
}

interface EmployeesIndexProps {
  employees: {
    data: Employee[]
    meta?: PaginationData
    links?: any
    from?: number
    to?: number
    total?: number
    current_page?: number
    last_page?: number
    per_page?: number
  }
  stats?: {
    totalEmployees: number
    regularCount: number
    probationaryCount: number
    departmentCount: number
    maleCount: number
    femaleCount: number
    averageAge: number
    averageYearsOfService: number
    totalDailyRate: number
  }
  departments?: string[]
  positions?: string[]
  filters?: {
    search?: string
    position?: string
    department?: string
    status?: string
  }
}

const EmployeesIndex = ({
  employees,
  stats = {},
  departments = [],
  positions = [],
  filters = {},
}: EmployeesIndexProps) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || "")
  const [positionFilter, setPositionFilter] = useState(filters.position || "")
  const [departmentFilter, setDepartmentFilter] = useState(filters.department || "")
  const [statusFilter, setStatusFilter] = useState(filters.status || "")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [activeView, setActiveView] = useState("table")
  const [sortField, setSortField] = useState<string>("employee_number")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Get pagination data
  const paginationData = {
    current_page: employees.current_page || employees.meta?.current_page || 1,
    last_page: employees.last_page || employees.meta?.last_page || 1,
    per_page: employees.per_page || employees.meta?.per_page || 10,
    total: employees.total || employees.meta?.total || 0,
    from: employees.from || employees.meta?.from || 0,
    to: employees.to || employees.meta?.to || 0,
    links: employees.links || employees.meta?.links || [],
  }

  // Get employee data from props
  const employeeData = employees.data || []

  // Debug function to check data
  useEffect(() => {
    console.log("Employee Data:", employeeData)
    if (employeeData.length > 0) {
      console.log("Sample employee record:", employeeData[0])
      console.log("Fields available:", Object.keys(employeeData[0]))
    }
    console.log("Stats:", stats)

    // Create debug info string
    const info = `Employee Records: ${employeeData.length}, Total Employees: ${stats.totalEmployees || 0}`
    setDebugInfo(info)
  }, [employeeData, stats])

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [employeeData])

  // Prevent scrolling back to top once loaded
  useEffect(() => {
    // Store the current scroll position
    const scrollPosition = window.scrollY

    // Function to restore scroll position
    const restoreScroll = () => {
      window.scrollTo(0, scrollPosition)
    }

    // Add event listener for when content is loaded
    window.addEventListener("load", restoreScroll)

    // Cleanup
    return () => {
      window.removeEventListener("load", restoreScroll)
    }
  }, [])

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
        refreshData()
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
          refreshData()
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
        refreshData()
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
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Employees added successfully from bulk upload!")
        setIsBulkAddModalOpen(false)
        refreshData()
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
    // Store current scroll position
    const scrollPosition = window.scrollY

    setSearchTerm("")
    setPositionFilter("")
    setDepartmentFilter("")
    setStatusFilter("")

    setIsLoading(true)
    router.get(
      route("employees.index"),
      {
        page: 1,
        perPage: paginationData.per_page,
        sort: sortField,
        direction: sortDirection,
        search: "",
        position: "",
        department: "",
        status: "",
      },
      {
        preserveState: true,
        preserveScroll: true, // Add this to preserve scroll position
        replace: true,
        only: ["employees", "stats"],
        onSuccess: () => {
          setIsLoading(false)
          // Restore scroll position
          window.scrollTo(0, scrollPosition)
        },
        onError: () => {
          setIsLoading(false)
          // Restore scroll position even on error
          window.scrollTo(0, scrollPosition)
        },
      },
    )
  }

  // Toggle sort
  const toggleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(newDirection)

    router.get(
      route("employees.index"),
      {
        page: paginationData.current_page,
        perPage: paginationData.per_page,
        sort: field,
        direction: newDirection,
        search: searchTerm,
        position: positionFilter,
        department: departmentFilter,
        status: statusFilter,
      },
      {
        preserveState: true,
        replace: true,
        only: ["employees", "stats"],
      },
    )
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setIsLoading(true)

    router.get(
      route("employees.index"),
      {
        page,
        perPage: paginationData.per_page,
        sort: sortField,
        direction: sortDirection,
        search: searchTerm,
        position: positionFilter,
        department: departmentFilter,
        status: statusFilter,
      },
      {
        preserveState: true,
        replace: true,
        only: ["employees", "stats"],
        onSuccess: () => setIsLoading(false),
      },
    )
  }

  // Handle per page change
  const handlePerPageChange = (newPerPage: number) => {
    setIsLoading(true)

    router.get(
      route("employees.index"),
      {
        page: 1,
        perPage: newPerPage,
        sort: sortField,
        direction: sortDirection,
        search: searchTerm,
        position: positionFilter,
        department: departmentFilter,
        status: statusFilter,
      },
      {
        preserveState: true,
        replace: true,
        only: ["employees", "stats"],
        onSuccess: () => setIsLoading(false),
      },
    )
  }

  // Handle search and filter
  const handleSearch = () => {
    handleFilterChange("search", searchTerm)
  }

  // Handle individual filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setIsLoading(true)

    // Store current scroll position
    const scrollPosition = window.scrollY

    // Update the state first
    if (filterType === "search") setSearchTerm(value)
    if (filterType === "position") setPositionFilter(value)
    if (filterType === "department") setDepartmentFilter(value)
    if (filterType === "status") setStatusFilter(value)

    const params = {
      page: 1, // Reset to first page when filter changes
      perPage: paginationData.per_page,
      sort: sortField,
      direction: sortDirection,
      search: filterType === "search" ? value : searchTerm,
      position: filterType === "position" ? value : positionFilter,
      department: filterType === "department" ? value : departmentFilter,
      status: filterType === "status" ? value : statusFilter,
    }

    // Use router.get directly with the path instead of route function
    router.get(
      "/employees", // Direct path instead of route("employees.index")
      params,
      {
        preserveState: true,
        preserveScroll: true, // Add this to preserve scroll position
        replace: true,
        only: ["employees", "stats"],
        onSuccess: () => {
          setIsLoading(false)
          // Restore scroll position
          window.scrollTo(0, scrollPosition)
        },
        onError: () => {
          setIsLoading(false)
          // Restore scroll position even on error
          window.scrollTo(0, scrollPosition)
        },
      },
    )
  }

  // Refresh data
  const refreshData = () => {
    setIsRefreshing(true)
    router.reload({
      preserveScroll: true,
      onSuccess: () => {
        setIsRefreshing(false)
      },
      onError: () => {
        setIsRefreshing(false)
        toast.error("Failed to refresh data")
      },
    })
  }

  // Get unique positions and departments for filters
  const uniquePositions = useMemo(() => {
    return positions.length > 0 ? positions : Array.from(new Set(employeeData.map((emp) => emp.position)))
  }, [employeeData, positions])

  const uniqueDepartments = useMemo(() => {
    return departments.length > 0 ? departments : Array.from(new Set(employeeData.map((emp) => emp.department)))
  }, [employeeData, departments])

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(employeeData.map((emp) => emp.employment_status)))
  }, [employeeData])

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

  // Export to CSV
  const handleExportToCSV = () => {
    toast.success("Exporting employee data...")

    try {
      // Prepare data for export
      const exportData = employeeData.map((employee) => {
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

  // Calculate completion percentage for onboarding
  const calculateOnboardingCompletion = () => {
    if (employeeData.length === 0) return 0

    const completedCount = employeeData.filter(
      (emp) => emp.sss_no && emp.tin_no && emp.philhealth_no && emp.pagibig_no,
    ).length

    return Math.round((completedCount / employeeData.length) * 100)
  }

  // Calculate gender distribution
  const calculateGenderDistribution = () => {
    if (employeeData.length === 0) return { male: 0, female: 0 }

    const maleCount = stats.maleCount || employeeData.filter((emp) => emp.gender?.toLowerCase() === "male").length
    const femaleCount = stats.femaleCount || employeeData.filter((emp) => emp.gender?.toLowerCase() === "female").length

    return {
      male: maleCount,
      female: femaleCount,
      malePercentage: Math.round((maleCount / employeeData.length) * 100),
      femalePercentage: Math.round((femaleCount / employeeData.length) * 100),
    }
  }

  // Get total employees count
  const totalEmployees = stats.totalEmployees || paginationData.total || 0
  const regularEmployees = stats.regularCount || employeeData.filter((e) => e.employment_status === "Regular").length
  const probationaryEmployees =
    stats.probationaryCount || employeeData.filter((e) => e.employment_status === "Probationary").length
  const departmentCount = stats.departmentCount || uniqueDepartments.length
  const regularPercentage = totalEmployees > 0 ? Math.round((regularEmployees / totalEmployees) * 100) : 0
  const probationaryPercentage = totalEmployees > 0 ? Math.round((probationaryEmployees / totalEmployees) * 100) : 0
  const genderDistribution = calculateGenderDistribution()
  const onboardingCompletion = calculateOnboardingCompletion()

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
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    onClick={handleExportToCSV}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export to CSV</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    onClick={refreshData}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh Data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Debug Info Alert - Only show if no employee records */}
        {employeeData.length === 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
            <Info className="h-4 w-4" />
            <AlertTitle>No employee records found</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">There are no employee records in the system. You can:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Add records manually using the "Add Employee" button</li>
                <li>Import records using the "Bulk Add" button</li>
              </ul>
              <p className="mt-2 text-xs">{debugInfo}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Onboarding Progress */}
        <Card className="p-5 border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Employee Onboarding Progress</h2>
              <p className="text-slate-600 dark:text-slate-400">
                {onboardingCompletion}% of employees have completed documentation
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total Employees:{" "}
                <span className="font-medium text-indigo-600 dark:text-indigo-400">{totalEmployees}</span>
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={onboardingCompletion}
              className="h-2 bg-slate-100 dark:bg-slate-700"
              indicatorClassName="bg-indigo-500"
            />
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Employees</p>
                <p className="text-2xl font-bold mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-500">
                  {totalEmployees}
                </p>
                <p className="text-xs text-indigo-500 mt-1">
                  {paginationData.from} to {paginationData.to} shown
                </p>
              </div>
              <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-500 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/30 transition-colors">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Regular</p>
                <p className="text-2xl font-bold mt-1 group-hover:text-green-600 dark:group-hover:text-green-500">
                  {regularEmployees}
                </p>
                <p className="text-xs text-green-500 mt-1 transition-colors group-hover:text-green-600 dark:group-hover:text-green-400">
                  {regularPercentage}% of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500 group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Probationary</p>
                <p className="text-2xl font-bold mt-1 group-hover:text-amber-600 dark:group-hover:text-amber-500">
                  {probationaryEmployees}
                </p>
                <p className="text-xs text-amber-500 mt-1 transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  {probationaryPercentage}% of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-500 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/30 transition-colors">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Departments</p>
                <p className="text-2xl font-bold mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-500">
                  {departmentCount}
                </p>
                <p className="text-xs text-blue-500 mt-1 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {stats.averageYearsOfService ? `Avg. ${stats.averageYearsOfService.toFixed(1)} years service` : ""}
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                <Building className="h-5 w-5" />
              </div>
            </div>
          </Card>

          {/* Gender Distribution */}
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Male Employees</p>
                <p className="text-2xl font-bold mt-1 group-hover:text-sky-600 dark:group-hover:text-sky-500">
                  {genderDistribution.male}
                </p>
                <p className="text-xs text-sky-500 mt-1 transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400">
                  {genderDistribution.malePercentage}% of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-sky-100 dark:bg-sky-900/20 text-sky-500 group-hover:bg-sky-200 dark:group-hover:bg-sky-800/30 transition-colors">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </Card>

          {/* Female Employees */}
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Female Employees</p>
                <p className="text-2xl font-bold mt-1 group-hover:text-pink-600 dark:group-hover:text-pink-500">
                  {genderDistribution.female}
                </p>
                <p className="text-xs text-pink-500 mt-1 transition-colors group-hover:text-pink-600 dark:group-hover:text-pink-400">
                  {genderDistribution.femalePercentage}% of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/20 text-pink-500 group-hover:bg-pink-200 dark:group-hover:bg-pink-800/30 transition-colors">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </Card>

          {/* Average Age */}
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Average Age</p>
                <p className="text-2xl font-bold mt-1 group-hover:text-violet-600 dark:group-hover:text-violet-500">
                  {stats.averageAge ? stats.averageAge.toFixed(1) : "N/A"}
                </p>
                <p className="text-xs text-violet-500 mt-1 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400">
                  Years
                </p>
              </div>
              <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-500 group-hover:bg-violet-200 dark:group-hover:bg-violet-800/30 transition-colors">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </Card>

          {/* Total Daily Rate */}
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Daily Rate</p>
                <p className="text-2xl font-bold mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-500">
                  ₱
                  {stats.totalDailyRate
                    ? stats.totalDailyRate.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "0.00"}
                </p>
                <p className="text-xs text-emerald-500 mt-1 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Daily payroll estimate
                </p>
              </div>
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/30 transition-colors">
                <Briefcase className="h-5 w-5" />
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFilterChange("search", searchTerm)
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={positionFilter}
                onChange={(e) => {
                  setPositionFilter(e.target.value)
                  handleFilterChange("position", e.target.value)
                }}
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
                onChange={(e) => {
                  setDepartmentFilter(e.target.value)
                  handleFilterChange("department", e.target.value)
                }}
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
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  handleFilterChange("status", e.target.value)
                }}
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
                onClick={handleSearch}
                className="border-indigo-200 text-indigo-600 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:border-indigo-700"
              >
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
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
              <div className="border rounded-lg shadow-sm border-slate-200 dark:border-slate-700">
                <div className="overflow-auto max-h-[500px]">
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
                      {employeeData.length > 0 ? (
                        employeeData.map((employee) => (
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

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-4 py-3">
                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <span>
                      Showing {paginationData.from} to {paginationData.to} of {paginationData.total} employees
                    </span>
                    <div className="ml-4">
                      <select
                        className="p-1 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm"
                        value={paginationData.per_page}
                        onChange={(e) => handlePerPageChange(Number(e.target.value))}
                      >
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                        <option value="100">100 per page</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(paginationData.current_page - 1)}
                      disabled={paginationData.current_page === 1}
                      className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous</span>
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {paginationData.links &&
                        paginationData.links
                          .filter((link) => !["&laquo; Previous", "Next &raquo;"].includes(link.label))
                          .map((link, i) => (
                            <Button
                              key={i}
                              variant={link.active ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (link.url) {
                                  const url = new URL(link.url)
                                  const page = url.searchParams.get("page")
                                  if (page) handlePageChange(Number.parseInt(page))
                                }
                              }}
                              disabled={!link.url}
                              className={
                                link.active
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                  : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                              }
                              dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                          ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(paginationData.current_page + 1)}
                      disabled={paginationData.current_page === paginationData.last_page}
                      className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cards" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employeeData.length > 0 ? (
                    employeeData.map((employee) => (
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

                {/* Pagination Controls for Card View */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-4 py-3 mt-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(paginationData.current_page - 1)}
                      disabled={paginationData.current_page === 1}
                      className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous</span>
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {paginationData.links &&
                        paginationData.links
                          .filter((link) => !["&laquo; Previous", "Next &raquo;"].includes(link.label))
                          .map((link, i) => (
                            <Button
                              key={i}
                              variant={link.active ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (link.url) {
                                  const url = new URL(link.url)
                                  const page = url.searchParams.get("page")
                                  if (page) handlePageChange(Number.parseInt(page))
                                }
                              }}
                              disabled={!link.url}
                              className={
                                link.active
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                  : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                              }
                              dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                          ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(paginationData.current_page + 1)}
                      disabled={paginationData.current_page === paginationData.last_page}
                      className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next</span>
                    </Button>
                  </div>
                </div>
              </>
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

