"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface BulkAddAttendanceModalProps {
  onClose: () => void
  onSubmitFile: (file: File) => void
  onSubmitManual: (date: string, employeeNumbers: string[]) => void
}

const BulkAddAttendanceModal = ({ onClose, onSubmitFile, onSubmitManual }: BulkAddAttendanceModalProps) => {
  const [selectedOption, setSelectedOption] = useState<"file" | "manual">("file")
  const [file, setFile] = useState<File | null>(null)
  const [employeeNumbers, setEmployeeNumbers] = useState<string>("")
  const [attendanceDate, setAttendanceDate] = useState<string>("")

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0]
      if (selectedFile) {
        setFile(selectedFile) // Store selected file
      }
    }
  }

  // Handle form submission based on selected option
  const handleSubmit = () => {
    if (selectedOption === "file" && file) {
      onSubmitFile(file) // Submit the file if option is "file"
    } else if (selectedOption === "manual" && employeeNumbers && attendanceDate) {
      const employeeNumbersArray = employeeNumbers.split(",").map((num) => num.trim())
      onSubmitManual(attendanceDate, employeeNumbersArray) // Submit manually entered data if option is "manual"
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center dark:text-black">
      <div className="bg-white p-6 rounded-md shadow-md max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">Bulk Add Attendance</h3>

        {/* Option Selection */}
        <div className="mb-4">
          <label>
            <input
              type="radio"
              checked={selectedOption === "file"}
              onChange={() => setSelectedOption("file")}
              className="mr-2"
            />
            Add by File
          </label>
          <br />
          <label>
            <input
              type="radio"
              checked={selectedOption === "manual"}
              onChange={() => setSelectedOption("manual")}
              className="mr-2"
            />
            Add Manually
          </label>
        </div>

        {/* File Upload Option */}
        {selectedOption === "file" && (
          <div className="mb-4">
            <input
              type="file"
              accept=".csv"
              className="border p-2 w-full"
              onChange={handleFileChange} // Handle file change
            />
          </div>
        )}

        {/* Manual Add Option */}
        {selectedOption === "manual" && (
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Date of Attendance</label>
              <input
                type="date"
                className="p-2 border w-full"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)} // Handle date input change
              />
            </div>
            <div>
              <label className="block mb-2">Employee Numbers (comma-separated)</label>
              <input
                type="text"
                className="p-2 border w-full"
                placeholder="e.g. 12345, 67890"
                value={employeeNumbers}
                onChange={(e) => setEmployeeNumbers(e.target.value)} // Handle employee number input change
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-4 mt-6">
          <Button variant="outline" onClick={onClose} className="dark:text-white">
            Cancel
          </Button>
          <Button variant="default" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BulkAddAttendanceModal

