"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Head, router } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Clock,
  Settings,
  AlertCircle,
  CheckCircle,
  Play,
  Info,
  Download,
  Calendar,
  BarChart3,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Import the export utility
import { exportToCSV } from "@/utils/export-utils"

interface PayrollPeriod {
  id: number
  period_start: string
  period_end: string
  payment_date: string
  status: string
}

interface Employee {
  id: number
  employee_number: string
  full_name: string
  email: string
  daily_rate: number
  department: string
  position: string
}

interface AutomationHistory {
  id?: number
  date: string
  action: string
  period: string
  status: string
  details: string
}

interface PayrollAutomationProps {
  periods?: PayrollPeriod[]
  employees?: Employee[]
  automationHistory?: AutomationHistory[]
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
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
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

const PayrollAutomation = ({ periods = [], employees = [], automationHistory = [] }: PayrollAutomationProps) => {
  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [sendEmail, setSendEmail] = useState(true)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [logOutput, setLogOutput] = useState<string>("")
  const [showLogDialog, setShowLogDialog] = useState(false)
  const [payrollStatus, setPayrollStatus] = useState<string>("Pending")

  // Settings state
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [autoEmail, setAutoEmail] = useState(true)
  const [emailDay, setEmailDay] = useState("thursday")
  const [emailTime, setEmailTime] = useState("09:00")
  const [weeklySchedule, setWeeklySchedule] = useState(true)
  const [payoutDelay, setPayoutDelay] = useState(4)

  // History data
  const [historyData, setHistoryData] = useState<AutomationHistory[]>([])

  // Sample data for charts
  const attendanceData = [92, 95, 90, 94, 91, 93, 96]
  const attendanceLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const payrollTrends = [45000, 46500, 44800, 47200, 48500, 49000, 50200]
  const payrollLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"]

  // Load history data
  useEffect(() => {
    if (automationHistory && automationHistory.length > 0) {
      setHistoryData(automationHistory)
    } else {
      // Fallback to sample data if no history is provided
      setHistoryData([
        {
          date: new Date().toLocaleDateString(),
          action: "Generate Payrolls",
          period: "Current Period",
          status: "Success",
          details: "Generated payroll entries successfully",
        },
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          action: "Send Emails",
          period: "Previous Period",
          status: "Partial",
          details: "Sent 48 emails, 2 failed",
        },
      ])
    }
  }, [automationHistory])

  // Select/deselect all employees
  const toggleAllEmployees = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(employees.map((emp) => emp.id.toString()))
    } else {
      setSelectedEmployees([])
    }
  }

  // Handle employee selection
  const toggleEmployee = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId))
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId])
    }
  }

  // Generate payrolls for selected period
  const handleGeneratePayrolls = () => {
    if (!selectedPeriod) {
      toast.error("Please select a payroll period")
      return
    }

    setIsGenerating(true)
    setLogOutput("")

    router.post(
      "/payroll/automation/generate",
      {
        period_id: selectedPeriod,
        send_email: sendEmail,
        status: payrollStatus, // Include the selected status
      },
      {
        onSuccess: (page) => {
          const { success, message, details } = page.props.flash || {}

          if (success) {
            toast.success(message || "Payrolls generated successfully!")
            setLogOutput(details || "Payrolls generated successfully!")
          } else {
            toast.error(message || "Failed to generate payrolls")
            setLogOutput(details || "Error occurred during payroll generation.")
          }

          setShowLogDialog(true)
          setIsGenerating(false)
        },
        onError: (errors) => {
          console.error("Error generating payrolls:", errors)
          toast.error("An error occurred while generating payrolls")
          setLogOutput("Error: " + JSON.stringify(errors))
          setShowLogDialog(true)
          setIsGenerating(false)
        },
      },
    )
  }

  // Send payslip emails
  const handleSendEmails = () => {
    if (!selectedPeriod) {
      toast.error("Please select a payroll period")
      return
    }

    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee")
      return
    }

    setIsSendingEmails(true)

    router.post(
      "/payroll/automation/send-emails",
      {
        period_id: selectedPeriod,
        employee_ids: selectedEmployees,
      },
      {
        onSuccess: (page) => {
          const { success, message } = page.props.flash || {}

          if (success) {
            toast.success(message || "Payslip emails sent successfully!")
          } else {
            toast.error(message || "Failed to send payslip emails")
          }

          setIsSendingEmails(false)
        },
        onError: (errors) => {
          console.error("Error sending payslip emails:", errors)
          toast.error("An error occurred while sending payslip emails")
          setIsSendingEmails(false)
        },
      },
    )
  }

  // Save automation settings
  const handleSaveSettings = () => {
    router.post(
      "/payroll/automation/settings",
      {
        auto_generate: autoGenerate,
        auto_email: autoEmail,
        email_day: emailDay,
        email_time: emailTime,
        weekly_schedule: weeklySchedule,
        payout_delay: payoutDelay,
      },
      {
        onSuccess: () => {
          toast.success("Automation settings saved successfully")
        },
        onError: () => {
          toast.error("Failed to save automation settings")
        },
      },
    )
  }

  // Export automation history
  const exportAutomationHistory = () => {
    toast.success("Exporting automation history...")

    try {
      // Generate filename with date
      const date = new Date().toISOString().split("T")[0]
      const filename = `payroll_automation_history_${date}.csv`

      // Export to CSV
      exportToCSV(historyData, filename)

      toast.success("Export completed successfully!")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export data. Please try again.")
    }
  }

  // Calculate next payout date
  const calculateNextPayoutDate = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Find the next Sunday
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    const nextSunday = new Date(today)
    nextSunday.setDate(today.getDate() + daysUntilSunday)

    // Add payout delay (default 4 days for Thursday)
    const payoutDate = new Date(nextSunday)
    payoutDate.setDate(nextSunday.getDate() + payoutDelay)

    return payoutDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Payroll", href: "/payroll" },
        { label: "Automation", href: "/payroll/automation" },
      ]}
    >
      <div className="flex-1 p-6 bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
        <Head title="Payroll Automation" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Payroll Automation</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Configure automatic payroll generation and email delivery based on attendance
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="dashboard" className="mb-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Play className="h-4 w-4 mr-2" />
              Manual Run
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Card */}
              <Card className="p-6 border border-slate-200 dark:border-slate-700 md:col-span-3">
                <h2 className="text-xl font-semibold mb-4">Automation Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <h3 className="font-medium">Payroll Automation</h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {autoGenerate ? "Enabled" : "Disabled"} - Payrolls will be{" "}
                      {autoGenerate ? "automatically" : "manually"} generated based on attendance
                    </p>
                    <div className="mt-3">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Schedule:</span>
                      <p className="text-sm font-medium">Weekly (Monday-Sunday)</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                      <h3 className="font-medium">Next Payout Date</h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Payouts are processed {payoutDelay} days after the end of each week
                    </p>
                    <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                      {calculateNextPayoutDate()}
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-amber-500 mr-2" />
                      <h3 className="font-medium">Email Notifications</h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {autoEmail ? "Enabled" : "Disabled"} - Payslips will be {autoEmail ? "automatically" : "manually"}{" "}
                      emailed to employees
                    </p>
                    <div className="mt-3">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Schedule:</span>
                      <p className="text-sm font-medium">
                        Every {emailDay.charAt(0).toUpperCase() + emailDay.slice(1)} at {emailTime}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Attendance Trends */}
              <Card className="p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold mb-4">Weekly Attendance Trends</h2>
                <div className="mt-2">
                  <SimpleChart data={attendanceData} labels={attendanceLabels} color="#22c55e" />
                </div>
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Average Attendance Rate</span>
                    <span className="text-sm font-medium">93%</span>
                  </div>
                  <Progress
                    value={93}
                    className="h-2 bg-slate-100 dark:bg-slate-700"
                    indicatorClassName="bg-green-500"
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Present</p>
                    <p className="font-medium">92%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Absent</p>
                    <p className="font-medium">5%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Day Off</p>
                    <p className="font-medium">3%</p>
                  </div>
                </div>
              </Card>

              {/* Payroll Trends */}
              <Card className="p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold mb-4">Weekly Payroll Trends</h2>
                <div className="mt-2">
                  <SimpleChart data={payrollTrends} labels={payrollLabels} color="#4f46e5" />
                </div>
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Average Weekly Payroll</span>
                    <span className="text-sm font-medium">₱47,314.29</span>
                  </div>
                  <Progress
                    value={80}
                    className="h-2 bg-slate-100 dark:bg-slate-700"
                    indicatorClassName="bg-indigo-500"
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <p className="text-xs text-slate-500 dark:text-slate-400">This Week</p>
                    <p className="font-medium">₱50,200.00</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Last Week</p>
                    <p className="font-medium">₱49,000.00</p>
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {historyData.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div
                        className={`p-2 rounded-full mr-3 ${
                          item.status === "Success"
                            ? "bg-green-100 text-green-500 dark:bg-green-900/20"
                            : "bg-amber-100 text-amber-500 dark:bg-amber-900/20"
                        }`}
                      >
                        {item.status === "Success" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.action}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.date} - {item.period}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 text-slate-600 border-slate-200 hover:border-slate-300 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
                  onClick={() => setActiveTab("history")}
                >
                  View All Activity
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0">
            <Card className="p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Automation Settings</h2>

              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  Configure how payrolls are automatically generated based on attendance and delivered to employees.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Automatic Payroll Generation</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Automatically generate payrolls at the end of each pay period based on attendance
                    </p>
                  </div>
                  <Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} />
                </div>

                {autoGenerate && (
                  <div className="pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md font-medium">Weekly Schedule (Monday-Sunday)</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Generate payrolls based on weekly attendance from Monday to Sunday
                        </p>
                      </div>
                      <Switch checked={weeklySchedule} onCheckedChange={setWeeklySchedule} />
                    </div>

                    <div>
                      <Label htmlFor="payoutDelay">Payout Delay (days after Sunday)</Label>
                      <select
                        id="payoutDelay"
                        className="mt-1 block w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        value={payoutDelay}
                        onChange={(e) => setPayoutDelay(Number.parseInt(e.target.value))}
                      >
                        <option value="1">1 day (Monday)</option>
                        <option value="2">2 days (Tuesday)</option>
                        <option value="3">3 days (Wednesday)</option>
                        <option value="4">4 days (Thursday)</option>
                        <option value="5">5 days (Friday)</option>
                      </select>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Payouts will be processed this many days after the end of each week
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Automatic Email Delivery</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Automatically send payslip emails to employees
                    </p>
                  </div>
                  <Switch checked={autoEmail} onCheckedChange={setAutoEmail} disabled={!autoGenerate} />
                </div>

                {autoEmail && (
                  <div className="pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-4">
                    <div>
                      <Label htmlFor="emailDay">Send emails on</Label>
                      <select
                        id="emailDay"
                        className="mt-1 block w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        value={emailDay}
                        onChange={(e) => setEmailDay(e.target.value)}
                      >
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="emailTime">Time</Label>
                      <input
                        id="emailTime"
                        type="time"
                        className="mt-1 block w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        value={emailTime}
                        onChange={(e) => setEmailTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Button onClick={handleSaveSettings} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save Settings
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Manual Run Tab */}
          <TabsContent value="manual" className="mt-0">
            <Card className="p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Manual Payroll Generation</h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="periodSelect">Select Payroll Period</Label>
                  <select
                    id="periodSelect"
                    className="mt-1 block w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    <option value="">Select a period</option>
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {new Date(period.period_start).toLocaleDateString()} -{" "}
                        {new Date(period.period_end).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Payroll Status</Label>
                  <RadioGroup
                    value={payrollStatus}
                    onValueChange={setPayrollStatus}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Pending" id="status-pending" />
                      <Label htmlFor="status-pending" className="cursor-pointer">
                        Pending
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Completed" id="status-completed" />
                      <Label htmlFor="status-completed" className="cursor-pointer">
                        Completed
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Rejected" id="status-rejected" />
                      <Label htmlFor="status-rejected" className="cursor-pointer">
                        Rejected
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="sendEmail" checked={sendEmail} onCheckedChange={(checked) => setSendEmail(!!checked)} />
                  <Label htmlFor="sendEmail">Send payslip emails after generation</Label>
                </div>

                <Button
                  onClick={handleGeneratePayrolls}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isGenerating || !selectedPeriod}
                >
                  {isGenerating ? "Generating..." : "Generate Payrolls"}
                </Button>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Manual Email Sending</h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="emailPeriodSelect">Select Payroll Period</Label>
                    <select
                      id="emailPeriodSelect"
                      className="mt-1 block w-full p-2 border rounded bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                      <option value="">Select a period</option>
                      {periods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {new Date(period.period_start).toLocaleDateString()} -{" "}
                          {new Date(period.period_end).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Select Employees</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="selectAll"
                          checked={selectedEmployees.length === employees.length}
                          onCheckedChange={toggleAllEmployees}
                        />
                        <Label htmlFor="selectAll">Select All</Label>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded p-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                      {employees.map((employee) => (
                        <div key={employee.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`employee-${employee.id}`}
                            checked={selectedEmployees.includes(employee.id.toString())}
                            onCheckedChange={() => toggleEmployee(employee.id.toString())}
                          />
                          <Label htmlFor={`employee-${employee.id}`} className="flex flex-col">
                            <span>
                              {employee.full_name} ({employee.employee_number})
                            </span>
                            {employee.email && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">{employee.email}</span>
                            )}
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {employee.department} - {employee.position} - Daily Rate: ₱{employee.daily_rate}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSendEmails}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={isSendingEmails || !selectedPeriod || selectedEmployees.length === 0}
                  >
                    {isSendingEmails ? "Sending..." : "Send Payslip Emails"}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            <Card className="p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Automation History</h2>
                <Button
                  variant="outline"
                  onClick={exportAutomationHistory}
                  className="border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export History
                </Button>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                      {historyData.length > 0 ? (
                        historyData.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.action}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.period}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.status === "Success"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : item.status === "Partial"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                }`}
                              >
                                {item.status === "Success" ? (
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                )}{" "}
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">
                            No automation history found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Log Output Dialog */}
        <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Payroll Generation Log</DialogTitle>
              <DialogDescription>Output from the payroll generation process</DialogDescription>
            </DialogHeader>

            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md max-h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
              {logOutput || "No output available"}
            </div>

            <DialogFooter>
              <Button onClick={() => setShowLogDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

export default PayrollAutomation

