"use client"

import { useState } from "react"

const AddAttendanceModal = ({ onClose, onSubmit }) => {
  const [employeeNumber, setEmployeeNumber] = useState("")
  const [workDate, setWorkDate] = useState("")
  const [dailyRate, setDailyRate] = useState("")
  const [adjustment, setAdjustment] = useState("0.00")
  const [status, setStatus] = useState("Present")

  const handleSubmit = (e) => {
    e.preventDefault()

    const data = {
      employee_number: employeeNumber,
      work_date: workDate,
      daily_rate: Number.parseFloat(dailyRate),
      adjustment: Number.parseFloat(adjustment),
      status,
    }

    onSubmit(data) // Pass the data back to parent component for processing
    onClose() // Close modal after submit
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Add Attendance</h2>
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
          <button type="submit">Add Attendance</button>
        </form>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export default AddAttendanceModal

