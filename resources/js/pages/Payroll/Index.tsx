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
  Calendar,
  FileText,
  Filter,
  Plus,
  Printer,
  Search,
  Wallet,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  Mail,
} from "lucide-react"
import AddPayrollModal from "./AddPayrollModal"
import UpdatePayrollModal from "./UpdatePayrollModal"
import { toast } from "sonner"
import PrintPayslip from "./PrintPayslip"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Import the export utility
import { exportToCSV } from "@/utils/export-utils"

interface Payroll {
  id: number
  employee_number: string
  full_name: string
  payroll_period_id: number
  gross_pay: string
  net_pay: string
  thirteenth_month_pay: string
  ytd_earnings: string
  sss_deduction: string | null
  philhealth_deduction: string | null
  pagibig_deduction: string | null
  tax_deduction: string | null
  other_deductions: string | null
  status: string
  created_at: string | null
  updated_at: string | null
}

interface PayrollPeriod {
  id: number
  period_start: string
  period_end: string
  payment_date: string
  status: string
  created_at: string | null
  updated_at: string | null
}

interface PayrollIndexProps {
  payrolls?: Payroll[]
  payrollPeriods?: PayrollPeriod[]
  employees?: any[]
}

const PayrollIndex = ({ payrolls = [], payrollPeriods = [], employees = [] }: PayrollIndexProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [periodFilter, setPeriodFilter] = useState<number | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  const [activeTab, setActiveTab] = useState<"entries" | "periods">("entries")
  const [sortField, setSortField] = useState<string>("id")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isLoading, setIsLoading] = useState(true)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false)
  const [newPeriodData, setNewPeriodData] = useState({
    period_start: "",
    period_end: "",
    payment_date: "",
    status: "Open",
  })

  const { route } = usePage().props

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Use actual data
  const payrollData = payrolls || []
  const periodData = payrollPeriods || []

  const openAddModal = () => setIsAddModalOpen(true)
  const closeAddModal = () => setIsAddModalOpen(false)

  const openUpdateModal = (payroll: Payroll) => {
    setSelectedPayroll(payroll)
    setIsUpdateModalOpen(true)
  }
  const closeUpdateModal = () => {
    setSelectedPayroll(null)
    setIsUpdateModalOpen(false)
  }

  // Calculate period end and payment date based on start date
  const handlePeriodStartChange = (e) => {
    const startDate = new Date(e.target.value)

    // Calculate end date (7 days after start date)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)

    // Calculate payment date (4 days after end date)
    const paymentDate = new Date(endDate)
    paymentDate.setDate(endDate.getDate() + 4)

    setNewPeriodData({
      ...newPeriodData,
      period_start: e.target.value,
      period_end: endDate.toISOString().split("T")[0],
      payment_date: paymentDate.toISOString().split("T")[0],
    })
  }

  const handleAddPayroll = (data: Payroll) => {
    router.post(route("payroll.store"), data, {
      onSuccess: () => {
        toast.success("Payroll added successfully!")
        closeAddModal()
      },
      onError: (errors) => {
        Object.values(errors).forEach((message) => {
          toast.error(`Error: ${message}`)
        })
      },
    })
  }

  const handleDeletePayroll = (id: number) => {
    if (confirm("Are you sure you want to delete this payroll entry?")) {
      router.delete(`/payroll/${id}`, {
        onSuccess: () => {
          toast.success("Payroll deleted successfully!")
        },
        onError: (errors) => {
          Object.values(errors).forEach((message) => {
            toast.error(`Error: ${message}`)
          })
        },
      })
    }
  }

  const formatCurrency = (value: string | null) => {
    return value ? `₱${Number.parseFloat(value).toFixed(2)}` : "₱0.00"
  }

  const getPayrollPeriodName = (periodId: number) => {
    const period = periodData.find((p) => p.id === periodId)
    if (!period) return "Unknown Period"

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }

    return `${formatDate(period.period_start)} - ${formatDate(period.period_end)}`
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
      case "Upcoming":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  // Filter and sort payrolls
  const filteredPayrolls = useMemo(() => {
    return payrollData
      .filter((payroll) => {
        const matchesSearch =
          payroll.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payroll.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter ? payroll.status === statusFilter : true
        const matchesPeriod = periodFilter ? payroll.payroll_period_id === periodFilter : true

        return matchesSearch && matchesStatus && matchesPeriod
      })
      .sort((a, b) => {
        let aValue = a[sortField]
        let bValue = b[sortField]

        // Handle numeric fields
        if (["gross_pay", "net_pay"].includes(sortField)) {
          aValue = Number.parseFloat(aValue)
          bValue = Number.parseFloat(bValue)
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })
  }, [payrollData, searchTerm, statusFilter, periodFilter, sortField, sortDirection])

  // Pagination
  const paginatedPayrolls = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredPayrolls.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredPayrolls, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage)

  // Toggle sort
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter(null)
    setPeriodFilter(null)
  }

  // Print payroll - using actual data
  const printPayroll = (payroll: Payroll) => {
    setSelectedPayroll(payroll)
    setIsPrintModalOpen(true)
  }

  // Send email
  const sendEmail = (payroll: Payroll) => {
    router.post(
      `/payroll/${payroll.id}/send-email`,
      {},
      {
        onSuccess: () => {
          toast.success(`Payslip email sent to employee: ${payroll.full_name}`)
        },
        onError: (errors) => {
          Object.values(errors).forEach((message) => {
            toast.error(`Error: ${message}`)
          })
        },
      },
    )
  }

  // Refresh data
  const refreshData = () => {
    setIsRefreshing(true)
    router.reload({
      onSuccess: () => {
        setIsRefreshing(false)
        toast.success("Data refreshed successfully")
      },
      onError: () => {
        setIsRefreshing(false)
        toast.error("Failed to refresh data")
      },
    })
  }

  // Create new payroll period
  const handleCreatePeriod = (e) => {
    e.preventDefault()

    router.post("/payroll/periods", newPeriodData, {
      onSuccess: () => {
        toast.success("Payroll period created successfully!")
        setIsNewPeriodModalOpen(false)
        refreshData()
      },
      onError: (errors) => {
        Object.values(errors).forEach((message) => {
          toast.error(`Error: ${message}`)
        })
      },
    })
  }

  // Export to CSV
  const exportToExcel = () => {
    toast.success("Exporting payroll data...")

    try {
      // Prepare data for export
      const exportData = filteredPayrolls.map((payroll) => {
        // Format the period name
        const periodName = getPayrollPeriodName(payroll.payroll_period_id)

        // Format currency values
        const grossPay = Number.parseFloat(payroll.gross_pay).toFixed(2)
        const netPay = Number.parseFloat(payroll.net_pay).toFixed(2)
        const sssDeduction = payroll.sss_deduction ? Number.parseFloat(payroll.sss_deduction).toFixed(2) : "0.00"
        const philhealthDeduction = payroll.philhealth_deduction
          ? Number.parseFloat(payroll.philhealth_deduction).toFixed(2)
          : "0.00"
        const pagibigDeduction = payroll.pagibig_deduction
          ? Number.parseFloat(payroll.pagibig_deduction).toFixed(2)
          : "0.00"

        // Return formatted data
        return {
          ID: payroll.id,
          EmployeeNumber: payroll.employee_number,
          EmployeeName: payroll.full_name,
          PayrollPeriod: periodName,
          GrossPay: grossPay,
          SSS: sssDeduction,
          PhilHealth: philhealthDeduction,
          PagIBIG: pagibigDeduction,
          NetPay: netPay,
          Status: payroll.status,
          CreatedAt: payroll.created_at ? new Date(payroll.created_at).toLocaleDateString() : "",
        }
      })

      // Generate filename with date
      const date = new Date().toISOString().split("T")[0]
      const filename = `payroll_export_${date}.csv`

      // Export to CSV
      exportToCSV(exportData, filename)

      toast.success("Export completed successfully!")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export data. Please try again.")
    }
  }

  // Calculate summary statistics from actual data
  const payrollSummary = {
    totalGrossPay: payrollData.reduce((sum, p) => sum + Number.parseFloat(p.gross_pay), 0),
    totalNetPay: payrollData.reduce((sum, p) => sum + Number.parseFloat(p.net_pay), 0),
    totalDeductions: payrollData.reduce((sum, p) => {
      const deductions =
        Number.parseFloat(p.sss_deduction || "0") +
        Number.parseFloat(p.philhealth_deduction || "0") +
        Number.parseFloat(p.pagibig_deduction || "0") +
        Number.parseFloat(p.tax_deduction || "0") +
        Number.parseFloat(p.other_deductions || "0")
      return sum + deductions
    }, 0),
    completedCount: payrollData.filter((p) => p.status === "Completed").length,
    pendingCount: payrollData.filter((p) => p.status === "Pending").length,
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll", href: "/payroll" },
      ]}
    >
      <div className="flex-1 p-6 bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
        <Head title="Payroll" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Payroll Management</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage employee payroll and payment periods</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              onClick={openAddModal}
              className="border-indigo-200 text-indigo-600 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:border-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Payroll
            </Button>
            <Button
              onClick={() => setIsNewPeriodModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Calendar className="h-4 w-4 mr-1" />
              New Period
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                    onClick={exportToExcel}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export to Excel</TooltipContent>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Payrolls</p>
                <p className="text-2xl font-bold mt-1">{payrollData.length}</p>
              </div>
              <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-500">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Gross Pay</p>
                <p className="text-2xl font-bold mt-1">
                  ₱
                  {payrollSummary.totalGrossPay.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Net Pay</p>
                <p className="text-2xl font-bold mt-1">
                  ₱
                  {payrollSummary.totalNetPay.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Deductions</span>
                <span>
                  {((payrollSummary.totalDeductions / payrollSummary.totalGrossPay) * 100).toFixed(1)}% of gross
                </span>
              </div>
              <Progress
                value={(payrollSummary.totalDeductions / payrollSummary.totalGrossPay) * 100}
                className="h-1.5"
              />
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
                <p className="text-2xl font-bold mt-1">{payrollSummary.completedCount}</p>
                <p className="text-xs text-green-500 mt-1">
                  {payrollData.length > 0 ? Math.round((payrollSummary.completedCount / payrollData.length) * 100) : 0}%
                  of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold mt-1">{payrollSummary.pendingCount}</p>
                <p className="text-xs text-amber-500 mt-1">
                  {payrollData.length > 0 ? Math.round((payrollSummary.pendingCount / payrollData.length) * 100) : 0}%
                  of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-500">
                <AlertCircle className="h-5 w-5" />
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
                placeholder="Search by employee name or number..."
                className="pl-10 p-2 w-full border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={statusFilter ?? ""}
                onChange={(e) => setStatusFilter(e.target.value || null)}
              >
                <option value="">Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
              <select
                className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={periodFilter ?? ""}
                onChange={(e) => setPeriodFilter(e.target.value ? Number.parseInt(e.target.value) : null)}
              >
                <option value="">All Periods</option>
                {periodData.map((period) => (
                  <option key={period.id} value={period.id}>
                    {new Date(period.period_start).toLocaleDateString()} -{" "}
                    {new Date(period.period_end).toLocaleDateString()}
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

        {/* Tabs Navigation */}
        <Tabs defaultValue="entries" className="mb-6" value={activeTab} onValueChange={setActiveTab as any}>
          <TabsList className="mb-4">
            <TabsTrigger value="entries">Payroll Entries</TabsTrigger>
            <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-auto rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th
                          className="py-3 px-4 text-left font-semibold cursor-pointer"
                          onClick={() => toggleSort("id")}
                        >
                          <div className="flex items-center">
                            ID
                            {sortField === "id" && (
                              <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">Emp #</th>
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
                        <th className="py-3 px-4 text-left font-semibold">Payroll Period</th>
                        <th
                          className="py-3 px-4 text-left font-semibold cursor-pointer"
                          onClick={() => toggleSort("gross_pay")}
                        >
                          <div className="flex items-center">
                            Gross Pay
                            {sortField === "gross_pay" && (
                              <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 text-left font-semibold cursor-pointer"
                          onClick={() => toggleSort("net_pay")}
                        >
                          <div className="flex items-center">
                            Net Pay
                            {sortField === "net_pay" && (
                              <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">Status</th>
                        <th className="py-3 px-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPayrolls.length > 0 ? (
                        paginatedPayrolls.map((payroll) => (
                          <tr
                            key={payroll.id}
                            className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-3 px-4 font-medium">#{payroll.id}</td>
                            <td className="py-3 px-4">{payroll.employee_number}</td>
                            <td className="py-3 px-4">{payroll.full_name}</td>
                            <td className="py-3 px-4">{getPayrollPeriodName(payroll.payroll_period_id)}</td>
                            <td className="py-3 px-4">{formatCurrency(payroll.gross_pay)}</td>
                            <td className="py-3 px-4">{formatCurrency(payroll.net_pay)}</td>
                            <td className="py-3 px-4">
                              <Badge className={getStatusBadgeColor(payroll.status)}>{payroll.status}</Badge>
                            </td>
                            <td className="py-3 px-4 space-x-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                                      onClick={() => openUpdateModal(payroll)}
                                    >
                                      Edit
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Payroll</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 border-blue-200 text-blue-600 hover:border-blue-300 dark:border-blue-800 dark:text-blue-400 dark:hover:border-blue-700"
                                      onClick={() => printPayroll(payroll)}
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Print Payslip</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 border-green-200 text-green-600 hover:border-green-300 dark:border-green-800 dark:text-green-400 dark:hover:border-green-700"
                                      onClick={() => sendEmail(payroll)}
                                    >
                                      <Mail className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Email Payslip</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 border-red-200 text-red-600 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:border-red-700"
                                      onClick={() => handleDeletePayroll(payroll.id)}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-3.5 w-3.5"
                                      >
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                      </svg>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete Payroll</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-400">
                            No payroll records found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredPayrolls.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredPayrolls.length)} of {filteredPayrolls.length}{" "}
                      entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Show pages around current page
                        let pageNum = currentPage
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="periods" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {periodData.map((period) => (
                  <Card
                    key={period.id}
                    className="p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Period #{period.id}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(period.period_start).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(period.period_end).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge className={getStatusBadgeColor(period.status)}>{period.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Payment Date:</span>
                        <span className="font-medium">
                          {new Date(period.payment_date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Employees:</span>
                        <span className="font-medium">
                          {payrollData.filter((p) => p.payroll_period_id === period.id).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Total Amount:</span>
                        <span className="font-medium">
                          ₱
                          {payrollData
                            .filter((p) => p.payroll_period_id === period.id)
                            .reduce((sum, p) => sum + Number.parseFloat(p.gross_pay), 0)
                            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                      >
                        Edit
                      </Button>
                      <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => {
                          router.get(`/payroll?period=${period.id}`)
                          setActiveTab("entries")
                          setPeriodFilter(period.id)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {isAddModalOpen && (
          <AddPayrollModal onClose={closeAddModal} employees={employees} payrollPeriods={payrollPeriods} />
        )}
        {isUpdateModalOpen && selectedPayroll && (
          <UpdatePayrollModal
            payroll={selectedPayroll}
            onClose={closeUpdateModal}
            employees={employees}
            payrollPeriods={payrollPeriods}
          />
        )}
        {isPrintModalOpen && selectedPayroll && (
          <PrintPayslip
            payroll={selectedPayroll}
            onClose={() => {
              setIsPrintModalOpen(false)
              setSelectedPayroll(null)
            }}
          />
        )}
        {isNewPeriodModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white dark:bg-black text-black dark:text-white p-6 rounded-lg shadow-lg w-[500px] max-h-[80vh] overflow-y-auto border border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Create New Payroll Period</h2>

              <form onSubmit={handleCreatePeriod}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Period Start Date</label>
                    <input
                      type="date"
                      name="period_start"
                      required
                      value={newPeriodData.period_start}
                      onChange={handlePeriodStartChange}
                      className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Period End Date</label>
                    <input
                      type="date"
                      name="period_end"
                      required
                      value={newPeriodData.period_end}
                      readOnly
                      className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Date</label>
                    <input
                      type="date"
                      name="payment_date"
                      required
                      value={newPeriodData.payment_date}
                      readOnly
                      className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      name="status"
                      required
                      value={newPeriodData.status}
                      onChange={(e) => setNewPeriodData({ ...newPeriodData, status: e.target.value })}
                      className="w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    >
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                      <option value="Processing">Processing</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewPeriodModalOpen(false)}
                    className="border-gray-500 text-gray-600 dark:border-gray-400 dark:text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Create Period
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default PayrollIndex

