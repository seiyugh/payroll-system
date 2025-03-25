"use client"

import { useState } from "react"
import { Head } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Settings, AlertCircle, CheckCircle, Play, Info, Download } from "lucide-react"
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

// Import the export utility
import { exportToCSV } from "@/utils/export-utils"

interface PayrollAutomationProps {
  periods: any[]
  employees: any[]
}

const PayrollAutomation = ({ periods = [], employees = [] }: PayrollAutomationProps) => {
  const [activeTab, setActiveTab] = useState<string>("settings")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [sendEmail, setSendEmail] = useState(true)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [logOutput, setLogOutput] = useState<string>("")
  const [showLogDialog, setShowLogDialog] = useState(false)

  // Settings state
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [autoEmail, setAutoEmail] = useState(true)
  const [emailDay, setEmailDay] = useState("thursday")
  const [emailTime, setEmailTime] = useState("09:00")

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
  const handleGeneratePayrolls = async () => {
    if (!selectedPeriod) {
      toast.error("Please select a payroll period")
      return
    }

    setIsGenerating(true)
    setLogOutput("")

    try {
      const response = await fetch("/payroll/automation/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content"),
        },
        body: JSON.stringify({
          period_id: selectedPeriod,
          send_email: sendEmail,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setLogOutput(data.details || "Payrolls generated successfully!")
        setShowLogDialog(true)
      } else {
        toast.error(data.message || "Failed to generate payrolls")
        setLogOutput(data.details || "Error occurred during payroll generation.")
        setShowLogDialog(true)
      }
    } catch (error) {
      console.error("Error generating payrolls:", error)
      toast.error("An error occurred while generating payrolls")
      setLogOutput("Error: " + (error.message || "Unknown error occurred"))
      setShowLogDialog(true)
    } finally {
      setIsGenerating(false)
    }
  }

  // Send payslip emails
  const handleSendEmails = async () => {
    if (!selectedPeriod) {
      toast.error("Please select a payroll period")
      return
    }

    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee")
      return
    }

    setIsSendingEmails(true)

    try {
      const response = await fetch("/payroll/automation/send-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content"),
        },
        body: JSON.stringify({
          period_id: selectedPeriod,
          employee_ids: selectedEmployees,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message || "Failed to send payslip emails")
      }
    } catch (error) {
      console.error("Error sending payslip emails:", error)
      toast.error("An error occurred while sending payslip emails")
    } finally {
      setIsSendingEmails(false)
    }
  }

  // Save automation settings
  const handleSaveSettings = () => {
    toast.success("Automation settings saved successfully")
  }

  // Add this function to the component
  const exportAutomationHistory = () => {
    toast.success("Exporting automation history...")

    try {
      // Sample automation history data for export
      const exportData = [
        {
          Date: new Date().toLocaleDateString(),
          Action: "Generate Payrolls",
          Period: "Mar 18 - Mar 24, 2025",
          Status: "Success",
          Details: "Generated 50 payroll entries",
        },
        {
          Date: new Date().toLocaleDateString(),
          Action: "Send Emails",
          Period: "Mar 18 - Mar 24, 2025",
          Status: "Success",
          Details: "Sent 48 emails, 2 failed",
        },
        {
          Date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          Action: "Generate Payrolls",
          Period: "Mar 11 - Mar 17, 2025",
          Status: "Failed",
          Details: "Database connection error",
        },
      ]

      // Generate filename with date
      const date = new Date().toISOString().split("T")[0]
      const filename = `payroll_automation_history_${date}.csv`

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
              Configure automatic payroll generation and email delivery
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="settings" className="mb-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
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

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0">
            <Card className="p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Automation Settings</h2>

              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  Configure how payrolls are automatically generated and delivered to employees.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Automatic Payroll Generation</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Automatically generate payrolls at the end of each pay period
                    </p>
                  </div>
                  <Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} />
                </div>

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
                          <Label htmlFor={`employee-${employee.id}`}>
                            {employee.full_name} ({employee.employee_number})
                            {employee.email && (
                              <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                                - {employee.email}
                              </span>
                            )}
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
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date().toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">Generate Payrolls</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">Mar 18 - Mar 24, 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 mr-1" /> Success
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date().toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">Send Emails</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">Mar 18 - Mar 24, 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 mr-1" /> Success
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">Generate Payrolls</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">Mar 11 - Mar 17, 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            <AlertCircle className="h-4 w-4 mr-1" /> Failed
                          </span>
                        </td>
                      </tr>
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

