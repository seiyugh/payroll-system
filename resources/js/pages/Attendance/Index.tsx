"use client"

import { Head, router } from "@inertiajs/react"
import { useState, useMemo, useEffect } from "react"
import AppLayout from "@/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Download, Filter, Plus, Search, Users, X } from "lucide-react"
import AddAttendanceModal from "./AddAttendanceModal"
import UpdateAttendanceModal from "./UpdateAttendanceModal"
import BulkAddAttendanceModal from "./BulkAddAttendanceModal"
import { exportToCSV } from "@/utils/export-utils"
import { toast } from "react-hot-toast"

interface Attendance {
  id?: number
  employee_number: string
  work_date: string
  daily_rate: number
  adjustment: number
  status: "Present" | "Absent" | "Day Off" | "Holiday"
  employee?: { full_name: string }
}

interface AttendanceIndexProps {
  attendanceRecords: Attendance[]
}

const AttendanceIndex = ({ attendanceRecords = [] }: AttendanceIndexProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null)
  const [activeView, setActiveView] = useState("table")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Sample data for demo if no records provided
  const sampleAttendanceRecords = [
    {
      id: 1,
      employee_number: "2025-001",
      work_date: "2025-03-24",
      daily_rate: 450,
      adjustment: 0,
      status: "Present",
      employee: { full_name: "John Doe" },
    },
    {
      id: 2,
      employee_number: "2025-002",
      work_date: "2025-03-24",
      daily_rate: 450,
      adjustment: 25,
      status: "Present",
      employee: { full_name: "Jane Smith" },
    },
    {
      id: 3,
      employee_number: "2025-003",
      work_date: "2025-03-24",
      daily_rate: 500,
      adjustment: 0,
      status: "Absent",
      employee: { full_name: "Robert Johnson" },
    },
    {
      id: 4,
      employee_number: "2025-004",
      work_date: "2025-03-24",
      daily_rate: 450,
      adjustment: 0,
      status: "Present",
      employee: { full_name: "Emily Davis" },
    },
    {
      id: 5,
      employee_number: "2025-005",
      work_date: "2025-03-24",
      daily_rate: 550,
      adjustment: 50,
      status: "Present",
      employee: { full_name: "Michael Wilson" },
    },
    {
      id: 6,
      employee_number: "2025-006",
      work_date: "2025-03-24",
      daily_rate: 450,
      adjustment: 0,
      status: "Holiday",
      employee: { full_name: "Sarah Brown" },
    },
    {
      id: 7,
      employee_number: "2025-007",
      work_date: "2025-03-24",
      daily_rate: 500,
      adjustment: 0,
      status: "Day Off",
      employee: { full_name: "David Miller" },
    },
    {
      id: 8,
      employee_number: "2025-008",
      work_date: "2025-03-24",
      daily_rate: 450,
      adjustment: 0,
      status: "Present",
      employee: { full_name: "Lisa Taylor" },
    },
  ]

  const records = attendanceRecords.length > 0 ? attendanceRecords : sampleAttendanceRecords

  // Open & Close Add Attendance Modal
  const openAddModal = () => setIsAddModalOpen(true)
  const closeAddModal = () => setIsAddModalOpen(false)

  // Open & Close Update Attendance Modal
  const openUpdateModal = (attendance: Attendance) => {
    setSelectedAttendance(attendance)
    setIsUpdateModalOpen(true)
  }
  const closeUpdateModal = () => {
    setSelectedAttendance(null)
    setIsUpdateModalOpen(false)
  }

  // Open & Close Bulk Add Modal
  const openBulkAddModal = () => setIsBulkAddModalOpen(true)
  const closeBulkAddModal = () => setIsBulkAddModalOpen(false)

  // Handle adding new attendance
  const handleAddAttendance = (data: Attendance) => {
    router.post("/attendance", data, {
      onSuccess: () => {
        console.log("✅ Attendance added successfully!")
        closeAddModal()
      },
      onError: (errors) => {
        console.error("❌ Error adding attendance:", errors)
      },
    })
  }

  // Handle bulk attendance addition
  const handleBulkAddAttendance = (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    router.post("/attendance/bulk", formData, {
      onSuccess: () => {
        console.log("✅ Bulk attendance added successfully!")
        closeBulkAddModal()
      },
      onError: (errors) => {
        console.error("❌ Error adding bulk attendance:", errors)
      },
    })
  }

  // Handle manual bulk attendance addition
  const handleManualBulkAdd = (date: string, employeeNumbers: string[]) => {
    router.post(
      "/attendance/bulk-manual",
      { date, employeeNumbers },
      {
        onSuccess: () => {
          console.log("✅ Manual bulk attendance added successfully!")
          closeBulkAddModal()
        },
        onError: (errors) => {
          console.error("❌ Error adding manual bulk attendance:", errors)
        },
      },
    )
  }

  // Handle filter changes
  const handleFilterChange = () => {
    // This function is called when any filter changes
    // It ensures both table and card views are updated
    console.log("Filters updated")
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedDay(null)
    setSelectedMonth(null)
    setSelectedStatus(null)
    handleFilterChange()
  }

  // Filter attendance records - applied to both views
  const filteredAttendanceRecords = useMemo(() => {
    return records.filter((attendance) => {
      const employeeNumber = attendance.employee_number ? attendance.employee_number : ""
      const employeeName = attendance.employee?.full_name?.toLowerCase() || ""
      const workDate = new Date(attendance.work_date)
      const workDay = workDate.getDate()
      const workMonth = workDate.getMonth() + 1 // Get the month (1-12)
      const status = attendance.status

      // Check search term filter
      const matchesSearch = employeeNumber.includes(searchTerm) || employeeName.includes(searchTerm.toLowerCase())

      // Check day filter
      const matchesDay = selectedDay ? workDay === selectedDay : true

      // Check month filter
      const matchesMonth = selectedMonth ? workMonth === selectedMonth : true

      // Check status filter
      const matchesStatus = selectedStatus ? status === selectedStatus : true

      return matchesSearch && matchesDay && matchesMonth && matchesStatus
    })
  }, [records, searchTerm, selectedDay, selectedMonth, selectedStatus])

  // Get attendance statistics
  const attendanceStats = useMemo(() => {
    const total = records.length
    const present = records.filter((a) => a.status === "Present").length
    const absent = records.filter((a) => a.status === "Absent").length
    const dayOff = records.filter((a) => a.status === "Day Off").length
    const holiday = records.filter((a) => a.status === "Holiday").length

    return { total, present, absent, dayOff, holiday }
  }, [records])

  // Get status badge color
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

  // Calendar view - group attendance by date
  const calendarData = useMemo(() => {
    const groupedByDate = {}

    filteredAttendanceRecords.forEach((record) => {
      const date = record.work_date
      if (!groupedByDate[date]) {
        groupedByDate[date] = []
      }
      groupedByDate[date].push(record)
    })

    return groupedByDate
  }, [filteredAttendanceRecords])

  const handleExportToCSV = () => {
    toast.success("Exporting attendance data...")

    try {
      // Prepare data for export
      const exportData = filteredAttendanceRecords.map((attendance) => {
        return {
          EmployeeNumber: attendance.employee_number,
          EmployeeName: attendance.employee?.full_name || "Unknown",
          WorkDate: new Date(attendance.work_date).toLocaleDateString(),
          DayOfWeek: new Date(attendance.work_date).toLocaleDateString("en-US", { weekday: "long" }),
          DailyRate: Number(attendance.daily_rate).toFixed(2),
          Adjustment: Number(attendance.adjustment).toFixed(2),
          TotalAmount: (Number(attendance.daily_rate) + Number(attendance.adjustment)).toFixed(2),
          Status: attendance.status,
        }
      })

      // Generate filename with date
      const date = new Date().toISOString().split("T")[0]
      const filename = `attendance_export_${date}.csv`

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
        { label: "Attendance", href: "/attendance" },
      ]}
    >
      <div className="flex-1 p-6 bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
        <Head title="Attendance" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Attendance Records</h1>
            <p className="text-slate-600 dark:text-slate-400">Track and manage employee attendance</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              onClick={openAddModal}
              className="border-indigo-200 text-indigo-600 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:border-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Attendance
            </Button>
            <Button onClick={openBulkAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Records</p>
                <p className="text-2xl font-bold mt-1">{attendanceStats.total}</p>
              </div>
              <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-500">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Present</p>
                <p className="text-2xl font-bold mt-1">{attendanceStats.present}</p>
                <p className="text-xs text-green-500 mt-1">
                  {Math.round((attendanceStats.present / attendanceStats.total) * 100)}% of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Absent</p>
                <p className="text-2xl font-bold mt-1">{attendanceStats.absent}</p>
                <p className="text-xs text-red-500 mt-1">
                  {Math.round((attendanceStats.absent / attendanceStats.total) * 100)}% of total
                </p>
              </div>
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500">
                <X className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Day Off</p>
                <p className="text-2xl font-bold mt-1">{attendanceStats.dayOff}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Holiday</p>
                <p className="text-2xl font-bold mt-1">{attendanceStats.holiday}</p>
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
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by employee name or number..."
                className="pl-10 p-2 w-full border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  handleFilterChange()
                }}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2">
              {/* Day Filter */}
              <select
                className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={selectedDay ?? ""}
                onChange={(e) => {
                  setSelectedDay(e.target.value ? Number(e.target.value) : null)
                  handleFilterChange()
                }}
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>

              {/* Month Filter */}
              <select
                className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={selectedMonth ?? ""}
                onChange={(e) => {
                  setSelectedMonth(e.target.value ? Number(e.target.value) : null)
                  handleFilterChange()
                }}
              >
                <option value="">Month</option>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                className="p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                value={selectedStatus ?? ""}
                onChange={(e) => {
                  setSelectedStatus(e.target.value || null)
                  handleFilterChange()
                }}
              >
                <option value="">Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Day Off">Day Off</option>
                <option value="Holiday">Holiday</option>
              </select>

              {/* Clear Filters Button */}
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
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
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
                      <th className="py-3 px-4 text-left font-semibold">Emp #</th>
                      <th className="py-3 px-4 text-left font-semibold">Full Name</th>
                      <th className="py-3 px-4 text-left font-semibold">Work Date</th>
                      <th className="py-3 px-4 text-left font-semibold">Daily Rate</th>
                      <th className="py-3 px-4 text-left font-semibold">Adjustment</th>
                      <th className="py-3 px-4 text-left font-semibold">Status</th>
                      <th className="py-3 px-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendanceRecords.length > 0 ? (
                      filteredAttendanceRecords.map((attendance) => (
                        <tr
                          key={attendance.id}
                          className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="py-3 px-4">{attendance.employee_number}</td>
                          <td className="py-3 px-4">{attendance.employee?.full_name ?? "Unknown"}</td>
                          <td className="py-3 px-4">{new Date(attendance.work_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">${(Number(attendance.daily_rate) || 0).toFixed(2)}</td>
                          <td className="py-3 px-4">${(Number(attendance.adjustment) || 0).toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusBadgeColor(attendance.status)}>{attendance.status}</Badge>
                          </td>
                          <td className="py-3 px-4 space-x-2">
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
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                          No attendance records found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(calendarData).length > 0 ? (
                  Object.entries(calendarData).map(([date, records]) => (
                    <Card key={date} className="p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </h3>
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800">
                          {records.length} Records
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {records.map((record: Attendance) => (
                          <div
                            key={`${date}-${record.employee_number}`}
                            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium">{record.employee?.full_name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{record.employee_number}</p>
                            </div>
                            <Badge className={getStatusBadgeColor(record.status)}>{record.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-500 dark:text-slate-400">
                    No attendance records found matching your filters.
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {isAddModalOpen && <AddAttendanceModal onClose={closeAddModal} onSubmit={handleAddAttendance} />}
        {isUpdateModalOpen && selectedAttendance && (
          <UpdateAttendanceModal attendance={selectedAttendance} onClose={closeUpdateModal} />
        )}
        {isBulkAddModalOpen && (
          <BulkAddAttendanceModal
            onClose={closeBulkAddModal}
            onSubmitFile={handleBulkAddAttendance}
            onSubmitManual={handleManualBulkAdd}
          />
        )}
      </div>
    </AppLayout>
  )
}

export default AttendanceIndex

