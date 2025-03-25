"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Inertia } from "@inertiajs/inertia"

const UpdateAttendanceModal = ({ attendance, onClose }) => {
  // Helper function to format the date in yyyy-MM-dd
  const formatDate = (date: string): string => {
    const d = new Date(date)
    return d.toISOString().split("T")[0] // Ensure the date format is yyyy-MM-dd
  }

  const [employeeNumber, setEmployeeNumber] = useState(attendance.employee_number)
  const [workDate, setWorkDate] = useState(formatDate(attendance.work_date))
  const [dailyRate, setDailyRate] = useState(attendance.daily_rate.toString())
  const [adjustment, setAdjustment] = useState(attendance.adjustment.toString())
  const [status, setStatus] = useState(attendance.status)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      employee_number: employeeNumber,
      work_date: workDate,
      daily_rate: Number.parseFloat(dailyRate),
      adjustment: Number.parseFloat(adjustment),
      status,
    }

    Inertia.put(`/attendance/${attendance.id}`, data)

    onClose() // Close modal after submit
  }

  useEffect(() => {
    setEmployeeNumber(attendance.employee_number)
    setWorkDate(formatDate(attendance.work_date)) // Reformat date if attendance is updated
    setDailyRate(attendance.daily_rate.toString())
    setAdjustment(attendance.adjustment.toString())
    setStatus(attendance.status)
  }, [attendance])

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Update Attendance</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Employee Number</label>
            <input type="text" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} required />
          </div>
          <div>
            <label>Work Date</label>
            <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} required />
          </div>
          <div>
            <label>Daily Rate</label>
            <input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} required />
          </div>
          <div>
            <label>Adjustment</label>
            <input type="number" value={adjustment} onChange={(e) => setAdjustment(e.target.value)} required />
          </div>
          <div>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Day Off">Day Off</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>
          <button type="submit">Update Attendance</button>
        </form>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export default UpdateAttendanceModal

