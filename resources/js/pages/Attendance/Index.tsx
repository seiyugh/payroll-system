"use client"

import React from "react"

import { Head, router } from "@inertiajs/react"
import { useState, useEffect, useMemo } from "react"
import AppLayout from "@/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowDownUp,
  Calendar,
  Filter,
  Plus,
  Search,
  Users,
  RefreshCw,
  FileSpreadsheet,
  Wallet,
  Info,
} from "lucide-react"
import AddAttendanceModal from "./AddAttendanceModal"
import UpdateAttendanceModal from "./UpdateAttendanceModal"
import BulkAddAttendanceModal from "./BulkAddAttendanceModal"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Attendance {
  id: number
  employee_id?: number
  employee_number: string
  full_name?: string
  date?: string
  work_date: string
  status: string
  daily_rate: number
  adjustment: number
  created_at: string | null
  updated_at: string | null
}

interface Employee {
  id: number
  employee_number: string
  full_name: string
  daily_rate: number
}

interface PayrollPeriod {
  id: number
  period_start: string
  period_end: string
  payment_date: string
  status: string
}

interface AttendanceIndexProps {
  attendances?: Attendance[]
  employees?: Employee[]
  payrollPeriods?: PayrollPeriod[]
}

// Simple chart component using canvas
const SimpleChart = ({ data, labels, color = "#4f46e5" }) => {
  const canvasRef = React.useRef(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height
    const maxValue = Math.max(...data, 1) // Ensure we don't divide by zero
    const padding = 20

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw chart
    ctx.beginPath()
    ctx.moveTo(padding, height - padding - (data[0] / maxValue) * (height - 2 * padding))

    for (let i = 1; i < data.length; i++) {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - (data[i] / maxValue) * (height - 2 * padding)
      ctx.lineTo(x, y)
    }

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Fill area under the line
    ctx.lineTo(width - padding, height - padding)
    ctx.lineTo(padding, height - padding)
    ctx.closePath()
    ctx.fillStyle = `${color}20`
    ctx.fill()

    // Draw dots at data points
    for (let i = 0; i < data.length; i++) {
      const x = padding + (i / (labels.length - 1)) * (width - 2 * padding)
      const y = height - padding - (data[i] / maxValue) * (height - 2 * padding)

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    }

    // Add labels if provided
    if (labels && labels.length === data.length) {
      ctx.textAlign = "center"
      ctx.fillStyle = "#6b7280"
      ctx.font = "10px sans-serif"

      for (let i = 0; i < labels.length; i++) {
        const x = padding + (i / (labels.length - 1)) * (width - 2 * padding)
        ctx.fillText(labels[i], x, height - 5)
      }
    }
  }, [data, labels, color])

  return <canvas ref={canvasRef} width={300} height={150} className="w-full h-auto" />
}

const AttendanceIndex = ({ attendances = [], employees = [], payrollPeriods = [] }: AttendanceIndexProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "daily" | "summary" | "analytics">("all")
  const [sortField, setSortField] = useState<string>("work_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showGeneratePayrollDialog, setShowGeneratePayrollDialog] = useState(false)
  const [selectedPayrollPeriod, setSelectedPayrollPeriod] = useState<string>("")
  const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false)
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([])
  const [weeklyLabels, setWeeklyLabels] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedAttendance, setDraggedAttendance] = useState(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Use actual data
  const attendanceData = attendances || []

  // Debug function to check data
  useEffect(() => {
    console.log("Attendance Data:", attendanceData)
    if (attendanceData.length > 0) {
      console.log("Sample attendance record:", attendanceData[0])
      console.log("Fields available:", Object.keys(attendanceData[0]))
    }
    console.log("Employees:", employees)

    // Create debug info string
    const info = `Attendance Records: ${attendanceData.length}, Employees: ${employees.length}`
    setDebugInfo(info)
  }, [attendanceData, employees])

  // Generate weekly attendance data for analytics
  useEffect(() => {
    if (attendanceData.length > 0) {
      // Get the current date
      const today = new Date()

      // Calculate the start of the current week (Monday)
      const startOfWeek = new Date(today)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)

      // Generate labels for the last 7 days
      const labels = []
      const data = []

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)

        // Format date as "Mon", "Tue", etc.
        const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" })
        labels.push(dayLabel)

        // Count present employees for this day
        const dateString = date.toISOString().split("T")[0]
        const presentCount = attendanceData.filter((a) => {
          const attendanceDate = a.work_date || a.date
          return attendanceDate === dateString && a.status === "Present"
        }).length

        // Calculate percentage if we have employees
        const percentage = employees.length > 0 ? (presentCount / employees.length) * 100 : 0

        data.push(percentage)
      }

      setWeeklyLabels(labels)
      setWeeklyAttendanceData(data)
    }
  }, [attendanceData, employees])

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [attendanceData])

  const openAddModal = () => setIsAddModalOpen(true)
  const closeAddModal = () => setIsAddModalOpen(false)

  const openUpdateModal = (attendance: Attendance) => {
    setSelectedAttendance(attendance)
    setIsUpdateModalOpen(true)
  }
  const closeUpdateModal = () => {
    setSelectedAttendance(null)
    setIsUpdateModalOpen(false)
  }

  const openBulkAddModal = () => setIsBulkAddModalOpen(true)
  const closeBulkAddModal = () => setIsBulkAddModalOpen(false)

  const handleAddAttendance = (data: any) => {
    // Ensure we're using work_date instead of date
    const formattedData = {
      ...data,
      work_date: data.work_date || data.date,
    }

    // Remove date if it exists to avoid confusion
    if (formattedData.date) {
      delete formattedData.date
    }

    router.post("/attendance", formattedData, {
      onSuccess: () => {
        toast.success("Attendance added successfully!")
        closeAddModal()
        refreshData()
      },
      onError: (errors) => {
        console.error("Add attendance errors:", errors)
        Object.values(errors).forEach((message) => {
          toast.error(`Error: ${message}`)
        })
      },
    })
  }

  const handleUpdateAttendance = (data: any) => {
    // Ensure we're using work_date instead of date
    const formattedData = {
      ...data,
      work_date: data.work_date || data.date,
    }

    // Remove date if it exists to avoid confusion
    if (formattedData.date) {
      delete formattedData.date
    }

    router.put(`/attendance/${data.id}`, formattedData, {
      onSuccess: () => {
        toast.success("Attendance updated successfully!")
        closeUpdateModal()
        refreshData()
      },
      onError: (errors) => {
        console.error("Update attendance errors:", errors)
        Object.values(errors).forEach((message) => {
          toast.error(`Error: ${message}`)
        })
      },
    })
  }

  const handleDeleteAttendance = (id: number) => {
    if (confirm("Are you sure you want to delete this attendance record?")) {
      router.delete(`/attendance/${id}`, {
        onSuccess: () => {
          toast.success("Attendance deleted successfully!")
          refreshData()
        },
        onError: (errors) => {
          console.error("Delete attendance errors:", errors)
          Object.values(errors).forEach((message) => {
            toast.error(`Error: ${message}`)
          })
        },
      })
    }
  }

  const handleBulkAddFile = (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    router.post("/attendance/bulk-upload", formData, {
      onSuccess: () => {
        toast.success("Attendance records uploaded successfully!")
        closeBulkAddModal()
        refreshData()
      },
      onError: (errors) => {
        console.error("Bulk upload errors:", errors)
        Object.values(errors).forEach((message) => {
          toast.error(`Error: ${message}`)
        })
      },
    })
  }

  const handleBulkAddManual = (date: string, employeeNumbers: string[], status: string) => {
    router.post(
      "/attendance/bulk",
      { work_date: date, employee_numbers: employeeNumbers, status },
      {
        onSuccess: () => {
          toast.success("Attendance records added successfully!")
          closeBulkAddModal()
          refreshData()
        },
        onError: (errors) => {
          console.error("Bulk add errors:", errors)
          Object.values(errors).forEach((message) => {
            toast.error(`Error: ${message}`)
          })
        },
      },
    )
  }

  // Generate payroll from attendance
  const handleGeneratePayroll = () => {
    if (!selectedPayrollPeriod) {
      toast.error("Please select a payroll period")
      return
    }
  
    setIsGeneratingPayroll(true)
  
    router.post(
      "/payroll/generate-from-attendance",
      { payroll_period_id: selectedPayrollPeriod },
      {
        onSuccess: () => {
          toast.success("Payroll generated successfully!")
          setShowGeneratePayrollDialog(false)
          setSelectedPayrollPeriod("")
          // Redirect to payroll page to see the generated entries
          router.get(`/payroll?period=${selectedPayrollPeriod}`)
        },
        onError: (errorResponse) => {
          console.error("Generate payroll error response:", errorResponse)
  
          if (errorResponse?.errors) {
            // Laravel validation errors
            Object.values(errorResponse.errors).flat().forEach((message) => {
              toast.error(`Error: ${message}`)
            })
          } else if (errorResponse?.message) {
            // Generic error message
            toast.error(`Error: ${errorResponse.message}`)
          } else {
            // Fallback error message
            toast.error("An unexpected error occurred while generating payroll.")
          }
        },
        onFinish: () => {
          setIsGeneratingPayroll(false)
        },
      }
    )
  }
  

  // Handle drag start for attendance status
  const handleDragStart = (e, attendance) => {
    setIsDragging(true)
    setDraggedAttendance(attendance)
    e.dataTransfer.setData("text/plain", JSON.stringify(attendance))
    e.dataTransfer.effectAllowed = "move"
  }

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  // Handle drop for changing attendance status
  const handleDrop = (e, newStatus) => {
    e.preventDefault()
    setIsDragging(false)

    if (draggedAttendance) {
      const updatedAttendance = {
        ...draggedAttendance,
        status: newStatus,
      }

      handleUpdateAttendance(updatedAttendance)
      setDraggedAttendance(null)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
      case "Absent":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
      case "Day Off":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
      case "Holiday":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  // Export to CSV - Fixed to use the correct endpoint
  const exportToExcel = () => {
    toast.success("Preparing attendance data export...")

    // Use a direct download approach with the correct URL
    window.location.href = "/attendance/export"
  }

  // Filter and sort attendances
  const filteredAttendances = useMemo(() => {
    return attendanceData
      .filter((attendance) => {
        const matchesSearch =
          attendance.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (attendance.full_name && attendance.full_name.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter ? attendance.status === statusFilter : true

        // Make sure we're using work_date consistently
        const attendanceDate = attendance.work_date
        const matchesDate = dateFilter ? attendanceDate === dateFilter : true

        return matchesSearch && matchesStatus && matchesDate
      })
      .sort((a, b) => {
        let aValue = a[sortField]
        let bValue = b[sortField]

        // Handle numeric fields
        if (["daily_rate", "adjustment"].includes(sortField)) {
          aValue = Number.parseFloat(aValue)
          bValue = Number.parseFloat(bValue)
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })
  }, [attendanceData, searchTerm, statusFilter, dateFilter, sortField, sortDirection])

  // Pagination
  const paginatedAttendances = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAttendances.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAttendances, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage)

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
    setDateFilter(null)
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

  // Calculate summary statistics
  const calculateSummary = () => {
    let totalDailyRate = 0
    let totalAdjustments = 0

    // Ensure we're working with numbers
    attendanceData.forEach((a) => {
      // Convert to number and default to 0 if NaN
      const dailyRate = Number.parseFloat(a.daily_rate) || 0
      const adjustment = Number.parseFloat(a.adjustment) || 0

      totalDailyRate += dailyRate
      totalAdjustments += adjustment
    })

    return {
      totalRecords: attendanceData.length,
      presentCount: attendanceData.filter((a) => a.status === "Present").length,
      absentCount: attendanceData.filter((a) => a.status === "Absent").length,
      dayOffCount: attendanceData.filter((a) => a.status === "Day Off").length,
      holidayCount: attendanceData.filter((a) => a.status === "Holiday").length,
      totalDailyRate: totalDailyRate,
      totalAdjustments: totalAdjustments,
    }
  }

  // Get the attendance summary
  const attendanceSummary = calculateSummary()

  // Group attendance by date for daily view
  const attendanceByDate = useMemo(() => {
    const grouped = {}
    attendanceData.forEach((attendance) => {
      const dateKey = attendance.work_date
      if (!dateKey) return

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(attendance)
    })
    return grouped
  }, [attendanceData])

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Invalid Date"
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Calculate weekly attendance completion
  const calculateWeeklyCompletion = () => {
    // Get current date
    const today = new Date()

    // Calculate the start of the current week (Monday)
    const startOfWeek = new Date(today)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    // Calculate the end of the week (Sunday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    // Count days with attendance records
    let daysWithRecords = 0
    const currentDay = new Date(startOfWeek)

    while (currentDay <= endOfWeek) {
      const dateString = currentDay.toISOString().split("T")[0]
      if (Object.keys(attendanceByDate).includes(dateString)) {
        daysWithRecords++
      }
      currentDay.setDate(currentDay.getDate() + 1)
    }

    // Calculate percentage (out of 7 days)
    return Math.round((daysWithRecords / 7) * 100)
  }

  // Get next payroll date
  const getNextPayrollDate = () => {
    // Find the next upcoming payroll period
    const today = new Date()
    const upcomingPeriods = payrollPeriods
      .filter((period) => new Date(period.payment_date) > today)
      .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())

    if (upcomingPeriods.length > 0) {
      return new Date(upcomingPeriods[0].payment_date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    return "No upcoming payroll dates"
  }

  // Function to add sample attendance data for testing
  const addSampleData = () => {
    if (employees.length === 0) {
      toast.error("No employees found. Please add employees first.")
      return
    }

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const todayStr = today.toISOString().split("T")[0]
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    const sampleData = employees.slice(0, 3).map((employee) => ({
      employee_number: employee.employee_number,
      work_date: todayStr,
      daily_rate: employee.daily_rate,
      adjustment: 0,
      status: "Present",
    }))

    // Add some data for yesterday too
    const yesterdayData = employees.slice(0, 3).map((employee) => ({
      employee_number: employee.employee_number,
      work_date: yesterdayStr,
      daily_rate: employee.daily_rate,
      adjustment: 0,
      status: Math.random() > 0.3 ? "Present" : "Absent",
    }))

    // Combine the data
    const allSampleData = [...sampleData, ...yesterdayData]

    // Add each record individually
    let successCount = 0
    let errorCount = 0

    const addRecord = (index) => {
      if (index >= allSampleData.length) {
        toast.success(`Added ${successCount} sample attendance records with ${errorCount} errors.`)
        refreshData()
        return
      }

      router.post("/attendance", allSampleData[index], {
        onSuccess: () => {
          successCount++
          addRecord(index + 1)
        },
        onError: (errors) => {
          console.error("Error adding sample data:", errors)
          errorCount++
          addRecord(index + 1)
        },
      })
    }

    addRecord(0)
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Attendance", href: "/attendance" },
      ]}
    >
      <div className="flex-1 p-6 bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
        <Head title="Attendance" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Attendance Management</h1>
            <p className="text-slate-600 dark:text-slate-400">Track and manage employee attendance records</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              onClick={openAddModal}
              className="border-indigo-200 text-indigo-600 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:border-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Record
            </Button>
            <Button onClick={openBulkAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Users className="h-4 w-4 mr-1" />
              Bulk Add
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowGeneratePayrollDialog(true)}
              className="border-green-200 text-green-600 hover:border-green-300 dark:border-green-800 dark:text-green-400 dark:hover:border-green-700"
            >
              <Wallet className="h-4 w-4 mr-1" />
              Generate Payroll
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

        {/* Debug Info Alert - Only show if no attendance records */}
        {attendanceData.length === 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
            <Info className="h-4 w-4" />
            <AlertTitle>No attendance records found</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">There are no attendance records in the system. You can:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Add records manually using the "Add Record" button</li>
                <li>Import records using the "Bulk Add" button</li>
                <li>
                  <Button
                    variant="link"
                    onClick={addSampleData}
                    className="p-0 h-auto text-amber-800 dark:text-amber-400 underline"
                  >
                    Click here to add sample data for testing
                  </Button>
                </li>
              </ul>
              <p className="mt-2 text-xs">{debugInfo}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Weekly Attendance Progress */}
        <Card className="p-5 border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Weekly Attendance Progress</h2>
              <p className="text-slate-600 dark:text-slate-400">
                {calculateWeeklyCompletion()}% complete for current week
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Next payroll date:{" "}
                <span className="font-medium text-indigo-600 dark:text-indigo-400">{getNextPayrollDate()}</span>
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={calculateWeeklyCompletion()}
              className="h-2 bg-slate-100 dark:bg-slate-700"
              indicatorClassName="bg-indigo-500"
            />
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Present</p>
                <p className="text-2xl font-bold mt-1">{attendanceSummary.presentCount}</p>
                <p className="text-xs text-green-500 mt-1">
                  {attendanceSummary.totalRecords > 0
                    ? Math.round((attendanceSummary.presentCount / attendanceSummary.totalRecords) * 100)
                    : 0}
                  % of total
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
                <p className="text-sm text-slate-500 dark:text-slate-400">Absent</p>
                <p className="text-2xl font-bold mt-1">{attendanceSummary.absentCount}</p>
                <p className="text-xs text-red-500 mt-1">
                  {attendanceSummary.totalRecords > 0
                    ? Math.round((attendanceSummary.absentCount / attendanceSummary.totalRecords) * 100)
                    : 0}
                  % of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Day Off</p>
                <p className="text-2xl font-bold mt-1">{attendanceSummary.dayOffCount}</p>
                <p className="text-xs text-blue-500 mt-1">
                  {attendanceSummary.totalRecords > 0
                    ? Math.round((attendanceSummary.dayOffCount / attendanceSummary.totalRecords) * 100)
                    : 0}
                  % of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Holiday</p>
                <p className="text-2xl font-bold mt-1">{attendanceSummary.holidayCount}</p>
                <p className="text-xs text-purple-500 mt-1">
                  {attendanceSummary.totalRecords > 0
                    ? Math.round((attendanceSummary.holidayCount / attendanceSummary.totalRecords) * 100)
                    : 0}
                  % of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-500">
                <Calendar className="h-5 w-5" />
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
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Day Off">Day Off</option>
                <option value="Holiday">Holiday</option>
              </select>
              <input
                type="date"
                className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={dateFilter ?? ""}
                onChange={(e) => setDateFilter(e.target.value || null)}
              />
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

        {/* Drag and Drop Status Zones */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg border-2 border-dashed ${isDragging ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-slate-200 dark:border-slate-700"}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "Present")}
          >
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <h3 className="font-medium">Present</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag and drop attendance records here to mark as Present
            </p>
          </div>

          <div
            className={`p-4 rounded-lg border-2 border-dashed ${isDragging ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "border-slate-200 dark:border-slate-700"}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "Absent")}
          >
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <h3 className="font-medium">Absent</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag and drop attendance records here to mark as Absent
            </p>
          </div>

          <div
            className={`p-4 rounded-lg border-2 border-dashed ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-slate-200 dark:border-slate-700"}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "Day Off")}
          >
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <h3 className="font-medium">Day Off</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag and drop attendance records here to mark as Day Off
            </p>
          </div>

          <div
            className={`p-4 rounded-lg border-2 border-dashed ${isDragging ? "border-purple-500 bg-purple-50 dark:bg-purple-900/10" : "border-slate-200 dark:border-slate-700"}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "Holiday")}
          >
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
              <h3 className="font-medium">Holiday</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag and drop attendance records here to mark as Holiday
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="all" className="mb-6" value={activeTab} onValueChange={setActiveTab as any}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Records</TabsTrigger>
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
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
                        <th
                          className="py-3 px-4 text-left font-semibold cursor-pointer"
                          onClick={() => toggleSort("work_date")}
                        >
                          <div className="flex items-center">
                            Date
                            {sortField === "work_date" && (
                              <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">Status</th>
                        <th
                          className="py-3 px-4 text-left font-semibold cursor-pointer"
                          onClick={() => toggleSort("daily_rate")}
                        >
                          <div className="flex items-center">
                            Daily Rate
                            {sortField === "daily_rate" && (
                              <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 text-left font-semibold cursor-pointer"
                          onClick={() => toggleSort("adjustment")}
                        >
                          <div className="flex items-center">
                            Adjustment
                            {sortField === "adjustment" && (
                              <ArrowDownUp className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAttendances.length > 0 ? (
                        paginatedAttendances.map((attendance) => (
                          <tr
                            key={attendance.id}
                            className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            draggable
                            onDragStart={(e) => handleDragStart(e, attendance)}
                          >
                            <td className="py-3 px-4 font-medium">#{attendance.id}</td>
                            <td className="py-3 px-4">{attendance.employee_number}</td>
                            <td className="py-3 px-4">{attendance.full_name || "N/A"}</td>
                            <td className="py-3 px-4">{formatDate(attendance.work_date || attendance.date)}</td>
                            <td className="py-3 px-4">
                              <Badge className={getStatusBadgeColor(attendance.status)}>{attendance.status}</Badge>
                            </td>
                            <td className="py-3 px-4">₱{Number.parseFloat(attendance.daily_rate).toFixed(2)}</td>
                            <td className="py-3 px-4">₱{Number.parseFloat(attendance.adjustment).toFixed(2)}</td>
                            <td className="py-3 px-4 space-x-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                                      onClick={() => openUpdateModal(attendance)}
                                    >
                                      Edit
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Attendance</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 border-red-200 text-red-600 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:border-red-700"
                                      onClick={() => handleDeleteAttendance(attendance.id)}
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
                                  <TooltipContent>Delete Attendance</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-400">
                            No attendance records found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredAttendances.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredAttendances.length)} of {filteredAttendances.length}{" "}
                      entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="daily" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : Object.keys(attendanceByDate).length > 0 ? (
              <div className="space-y-6">
                {Object.keys(attendanceByDate)
                  .sort((a, b) => (new Date(b) as any) - (new Date(a) as any))
                  .map((date) => (
                    <Card key={date} className="p-4 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold mb-3">{formatDate(date)}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                              <th className="py-2 px-4 text-left font-medium text-slate-600 dark:text-slate-300">
                                Employee
                              </th>
                              <th className="py-2 px-4 text-left font-medium text-slate-600 dark:text-slate-300">
                                Status
                              </th>
                              <th className="py-2 px-4 text-left font-medium text-slate-600 dark:text-slate-300">
                                Daily Rate
                              </th>
                              <th className="py-2 px-4 text-left font-medium text-slate-600 dark:text-slate-300">
                                Adjustment
                              </th>
                              <th className="py-2 px-4 text-left font-medium text-slate-600 dark:text-slate-300">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceByDate[date].map((attendance) => (
                              <tr
                                key={attendance.id}
                                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                draggable
                                onDragStart={(e) => handleDragStart(e, attendance)}
                              >
                                <td className="py-2 px-4">
                                  <div>
                                    <p className="font-medium">{attendance.full_name || "N/A"}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {attendance.employee_number}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-2 px-4">
                                  <Badge className={getStatusBadgeColor(attendance.status)}>{attendance.status}</Badge>
                                </td>
                                <td className="py-2 px-4">₱{Number.parseFloat(attendance.daily_rate).toFixed(2)}</td>
                                <td className="py-2 px-4">₱{Number.parseFloat(attendance.adjustment).toFixed(2)}</td>
                                <td className="py-2 px-4 space-x-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                                    onClick={() => openUpdateModal(attendance)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-600 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:border-red-700"
                                    onClick={() => handleDeleteAttendance(attendance.id)}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">No attendance records found.</p>
                <Button
                  variant="outline"
                  onClick={openAddModal}
                  className="mt-4 border-indigo-200 text-indigo-600 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:border-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Attendance Record
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Attendance by Status</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Present</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {attendanceSummary.presentCount} records (
                        {attendanceSummary.totalRecords > 0
                          ? Math.round((attendanceSummary.presentCount / attendanceSummary.totalRecords) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{
                          width: `${
                            attendanceSummary.totalRecords > 0
                              ? Math.round((attendanceSummary.presentCount / attendanceSummary.totalRecords) * 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Absent</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {attendanceSummary.absentCount} records (
                        {attendanceSummary.totalRecords > 0
                          ? Math.round((attendanceSummary.absentCount / attendanceSummary.totalRecords) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                      <div
                        className="bg-red-500 h-2.5 rounded-full"
                        style={{
                          width: `${
                            attendanceSummary.totalRecords > 0
                              ? Math.round((attendanceSummary.absentCount / attendanceSummary.totalRecords) * 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Day Off</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {attendanceSummary.dayOffCount} records (
                        {attendanceSummary.totalRecords > 0
                          ? Math.round((attendanceSummary.dayOffCount / attendanceSummary.totalRecords) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{
                          width: `${
                            attendanceSummary.totalRecords > 0
                              ? Math.round((attendanceSummary.dayOffCount / attendanceSummary.totalRecords) * 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Holiday</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {attendanceSummary.holidayCount} records (
                        {attendanceSummary.totalRecords > 0
                          ? Math.round((attendanceSummary.holidayCount / attendanceSummary.totalRecords) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                      <div
                        className="bg-purple-500 h-2.5 rounded-full"
                        style={{
                          width: `${
                            attendanceSummary.totalRecords > 0
                              ? Math.round((attendanceSummary.holidayCount / attendanceSummary.totalRecords) * 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Amount</span>
                    <span className="text-lg font-semibold">
                      ₱
                      {typeof attendanceSummary.totalDailyRate === "number"
                        ? attendanceSummary.totalDailyRate.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Adjustments</span>
                    <span className="text-lg font-semibold">
                      ₱
                      {typeof attendanceSummary.totalAdjustments === "number"
                        ? attendanceSummary.totalAdjustments.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <div className="border-t pt-3 mt-3 flex justify-between items-center">
                    <span className="text-sm font-medium">Grand Total</span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      ₱
                      {(
                        (typeof attendanceSummary.totalDailyRate === "number" ? attendanceSummary.totalDailyRate : 0) +
                        (typeof attendanceSummary.totalAdjustments === "number"
                          ? attendanceSummary.totalAdjustments
                          : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Weekly Attendance Trends</h3>
                <div className="mt-2">
                  <SimpleChart data={weeklyAttendanceData} labels={weeklyLabels} color="#22c55e" />
                </div>
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Average Attendance Rate</span>
                    <span className="text-sm font-medium">
                      {weeklyAttendanceData.length > 0
                        ? Math.round(weeklyAttendanceData.reduce((a, b) => a + b, 0) / weeklyAttendanceData.length)
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      weeklyAttendanceData.length > 0
                        ? Math.round(weeklyAttendanceData.reduce((a, b) => a + b, 0) / weeklyAttendanceData.length)
                        : 0
                    }
                    className="h-2 bg-slate-100 dark:bg-slate-700"
                    indicatorClassName="bg-green-500"
                  />
                </div>
              </Card>

              <Card className="p-5 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Payroll Projection</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Week Projection</span>
                    <span className="text-lg font-semibold">
                      ₱
                      {typeof attendanceSummary.totalDailyRate === "number"
                        ? attendanceSummary.totalDailyRate.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Next Payout Date</span>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {getNextPayrollDate()}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Weekly Completion</span>
                      <span className="text-sm font-medium">{calculateWeeklyCompletion()}%</span>
                    </div>
                    <Progress
                      value={calculateWeeklyCompletion()}
                      className="h-2 bg-slate-100 dark:bg-slate-700"
                      indicatorClassName="bg-indigo-500"
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowGeneratePayrollDialog(true)}
                      className="w-full border-indigo-200 text-indigo-600 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:border-indigo-700"
                    >
                      <Wallet className="h-4 w-4 mr-1" />
                      Generate Payroll
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {isAddModalOpen && (
          <AddAttendanceModal onClose={closeAddModal} onSubmit={handleAddAttendance} employees={employees} />
        )}
        {isUpdateModalOpen && selectedAttendance && (
          <UpdateAttendanceModal
            attendance={selectedAttendance}
            onClose={closeUpdateModal}
            onSubmit={handleUpdateAttendance}
            employees={employees}
          />
        )}
        {isBulkAddModalOpen && (
          <BulkAddAttendanceModal
            onClose={closeBulkAddModal}
            onSubmitFile={handleBulkAddFile}
            onSubmitManual={handleBulkAddManual}
            employees={employees}
          />
        )}

        {/* Generate Payroll Dialog */}
        <Dialog open={showGeneratePayrollDialog} onOpenChange={setShowGeneratePayrollDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Payroll from Attendance</DialogTitle>
              <DialogDescription>
                Select a payroll period to generate payroll entries from attendance records.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="payroll-period" className="text-sm font-medium">
                  Payroll Period
                </label>
                <select
                  id="payroll-period"
                  value={selectedPayrollPeriod}
                  onChange={(e) => setSelectedPayrollPeriod(e.target.value)}
                  className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                >
                  <option value="">Select a period</option>
                  {payrollPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {new Date(period.period_start).toLocaleDateString()} -{" "}
                      {new Date(period.period_end).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGeneratePayrollDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePayroll}
                disabled={!selectedPayrollPeriod || isGeneratingPayroll}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isGeneratingPayroll ? "Generating..." : "Generate Payroll"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

export default AttendanceIndex

