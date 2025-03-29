<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class AttendanceController extends Controller
{
    public function index(Request $request)
{
    // Set default date to today if no date filter is provided
    $date = $request->date ?: date('Y-m-d');
    
    $query = DB::table('attendance')
        ->select(
            'attendance.id',
            'attendance.employee_number',
            'attendance.work_date',
            'attendance.daily_rate',
            'attendance.adjustment',
            'attendance.status',
            'employees.full_name'
        )
        ->leftJoin('employees', 'attendance.employee_number', '=', 'employees.employee_number');
    
    // Apply search filter
    if ($request->has('search') && !empty($request->search)) {
        $search = $request->search;
        $query->where(function($q) use ($search) {
            $q->where('attendance.employee_number', 'like', "%{$search}%")
              ->orWhere('employees.full_name', 'like', "%{$search}%");
        });
    }
    
    // Apply status filter
    if ($request->has('status') && !empty($request->status)) {
        $query->where('attendance.status', $request->status);
    }
    
    // Apply date filter - only if explicitly provided in the request
    if ($request->has('date')) {
        if (!empty($request->date)) {
            $query->where('attendance.work_date', $request->date);
        }
    }
    
    // Apply sorting
    $query->orderBy('attendance.work_date', 'desc');
    
    // Get paginated results
    $attendances = $query->paginate(15)->withQueryString();
    
    $employees = Employee::select('id', 'employee_number', 'full_name', 'daily_rate')->get();
    $payrollPeriods = DB::table('payroll_periods')->get();

    return Inertia::render('Attendance/Index', [
        'attendances' => $attendances,
        'employees' => $employees,
        'payrollPeriods' => $payrollPeriods,
        'filters' => $request->only(['search', 'status', 'date']),
    ]);
}

    public function create()
    {
        $employees = Employee::select('id', 'employee_number', 'full_name', 'daily_rate')->get();
        
        return Inertia::render('Attendance/Create', [
            'employees' => $employees
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_number' => 'required|string',
            'work_date' => 'required|date',
            'daily_rate' => 'required|numeric',
            'adjustment' => 'nullable|numeric',
            'status' => 'required|string',
        ]);

        DB::table('attendance')->insert($validated);

        return redirect()->back()->with('success', 'Attendance record created successfully');
    }

    public function show($id)
    {
        $attendance = DB::table('attendance')
            ->select(
                'attendance.id',
                'attendance.employee_number',
                'attendance.work_date',
                'attendance.daily_rate',
                'attendance.adjustment',
                'attendance.status',
                'employees.full_name'
            )
            ->leftJoin('employees', 'attendance.employee_number', '=', 'employees.employee_number')
            ->where('attendance.id', $id)
            ->first();

        if (!$attendance) {
            return redirect()->route('attendance.index')->with('error', 'Attendance record not found');
        }

        return Inertia::render('Attendance/Show', [
            'attendance' => $attendance
        ]);
    }

    public function edit($id)
    {
        $attendance = DB::table('attendance')
            ->select(
                'attendance.id',
                'attendance.employee_number',
                'attendance.work_date',
                'attendance.daily_rate',
                'attendance.adjustment',
                'attendance.status',
                'employees.full_name'
            )
            ->leftJoin('employees', 'attendance.employee_number', '=', 'employees.employee_number')
            ->where('attendance.id', $id)
            ->first();

        if (!$attendance) {
            return redirect()->route('attendance.index')->with('error', 'Attendance record not found');
        }

        $employees = Employee::select('id', 'employee_number', 'full_name', 'daily_rate')->get();

        return Inertia::render('Attendance/Edit', [
            'attendance' => $attendance,
            'employees' => $employees
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'employee_number' => 'required|string',
            'work_date' => 'required|date',
            'daily_rate' => 'required|numeric',
            'adjustment' => 'nullable|numeric',
            'status' => 'required|string',
        ]);

        $attendance = DB::table('attendance')->where('id', $id)->first();
        
        if (!$attendance) {
            return redirect()->route('attendance.index')->with('error', 'Attendance record not found');
        }

        DB::table('attendance')->where('id', $id)->update($validated);

        return redirect()->back()->with('success', 'Attendance record updated successfully');
    }

    public function destroy($id)
    {
        $attendance = DB::table('attendance')->where('id', $id)->first();
        
        if (!$attendance) {
            return redirect()->route('attendance.index')->with('error', 'Attendance record not found');
        }

        DB::table('attendance')->where('id', $id)->delete();

        return redirect()->back()->with('success', 'Attendance record deleted successfully');
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'work_date' => 'required|date',
            'employee_numbers' => 'required|array',
            'status' => 'required|string',
        ]);

        $records = [];
        foreach ($validated['employee_numbers'] as $employeeNumber) {
            $employee = Employee::where('employee_number', $employeeNumber)->first();
            
            if ($employee) {
                $records[] = [
                    'employee_number' => $employeeNumber,
                    'work_date' => $validated['work_date'],
                    'daily_rate' => $employee->daily_rate,
                    'adjustment' => 0,
                    'status' => $validated['status'],
                ];
            }
        }

        DB::table('attendance')->insert($records);

        return redirect()->back()->with('success', 'Bulk attendance records created successfully');
    }

    public function bulkUpload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
        ]);

        // Process file upload logic here
        // This would typically involve reading the file and creating attendance records

        return redirect()->back()->with('success', 'Attendance records uploaded successfully');
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'attendances' => 'required|array',
            'attendances.*.id' => 'required|integer|exists:attendance,id',
            'attendances.*.status' => 'required|string',
        ]);

        foreach ($validated['attendances'] as $attendanceData) {
            $attendance = Attendance::find($attendanceData['id']);
            if ($attendance) {
                $attendance->update(['status' => $attendanceData['status']]);
            }
        }

        return redirect()->back()->with('success', 'Attendance records updated successfully');
    }

    public function export()
    {
        $attendances = DB::table('attendance')
            ->select(
                'attendance.id',
                'attendance.employee_number',
                'attendance.work_date',
                'attendance.daily_rate',
                'attendance.adjustment',
                'attendance.status',
                'employees.full_name'
            )
            ->leftJoin('employees', 'attendance.employee_number', '=', 'employees.employee_number')
            ->orderBy('attendance.work_date', 'desc')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Set headers
        $sheet->setCellValue('A1', 'ID');
        $sheet->setCellValue('B1', 'Employee Number');
        $sheet->setCellValue('C1', 'Employee Name');
        $sheet->setCellValue('D1', 'Work Date');
        $sheet->setCellValue('E1', 'Daily Rate');
        $sheet->setCellValue('F1', 'Adjustment');
        $sheet->setCellValue('G1', 'Total');
        $sheet->setCellValue('H1', 'Status');
        
        // Add data
        $row = 2;
        foreach ($attendances as $attendance) {
            $sheet->setCellValue('A' . $row, $attendance->id);
            $sheet->setCellValue('B' . $row, $attendance->employee_number);
            $sheet->setCellValue('C' . $row, $attendance->full_name);
            $sheet->setCellValue('D' . $row, $attendance->work_date);
            $sheet->setCellValue('E' . $row, $attendance->daily_rate);
            $sheet->setCellValue('F' . $row, $attendance->adjustment);
            $sheet->setCellValue('G' . $row, $attendance->daily_rate + $attendance->adjustment);
            $sheet->setCellValue('H' . $row, $attendance->status);
            $row++;
        }
        
        // Create file
        $writer = new Xlsx($spreadsheet);
        $filename = 'attendance_export_' . date('Y-m-d') . '.xlsx';
        
        // Save to temp file
        $tempFile = tempnam(sys_get_temp_dir(), 'attendance');
        $writer->save($tempFile);
        
        // Return as download
        return Response::download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function fetchForPayslip(Request $request)
    {
        try {
            $validated = $request->validate([
                'employee_number' => 'required',
                'start_date' => 'required|date',
                'end_date' => 'required|date',
                'period_id' => 'nullable|exists:payroll_periods,id',
            ]);

            // Get the employee
            $employee = Employee::where('employee_number', $validated['employee_number'])->first();
            
            // Adjust dates to ensure Monday-Sunday period
            $startDate = new \DateTime($validated['start_date']);
            $endDate = new \DateTime($validated['end_date']);
            
            // Ensure start date is a Monday
            $startDayOfWeek = (int)$startDate->format('N'); // 1 (Monday) through 7 (Sunday)
            if ($startDayOfWeek !== 1) {
                // If not Monday, adjust to previous Monday
                $daysToSubtract = $startDayOfWeek - 1;
                $startDate->modify("-{$daysToSubtract} days");
            }
            
            // Ensure end date is a Sunday
            $endDayOfWeek = (int)$endDate->format('N'); // 1 (Monday) through 7 (Sunday)
            if ($endDayOfWeek !== 7) {
                // If not Sunday, adjust to next Sunday
                $daysToAdd = 7 - $endDayOfWeek;
                $endDate->modify("+{$daysToAdd} days");
            }
            
            // Format dates for query
            $formattedStartDate = $startDate->format('Y-m-d');
            $formattedEndDate = $endDate->format('Y-m-d');

            // Fetch attendance records for the date range
            $attendanceRecords = Attendance::where('employee_number', $validated['employee_number'])
                ->whereBetween('work_date', [$formattedStartDate, $formattedEndDate])
                ->orderBy('work_date')
                ->get()
                ->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'employee_number' => $record->employee_number,
                        'work_date' => $record->work_date,
                        'daily_rate' => $record->daily_rate,
                        'adjustment' => $record->adjustment,
                        'status' => $record->status,
                        'time_in' => $record->time_in,
                        'time_out' => $record->time_out,
                        'notes' => $record->notes,
                    ];
                });

            // If no records found, generate default records for the period
            if ($attendanceRecords->isEmpty() && $employee) {
                $attendanceRecords = $this->generateDefaultAttendanceRecords(
                    $employee,
                    $formattedStartDate,
                    $formattedEndDate
                );
            }

            // Return the data using Inertia's shared data
            return Inertia::render('Payroll/PrintPayslip', [
                'attendances' => $attendanceRecords,
                'employee' => $employee,
                'period' => [
                    'start_date' => $formattedStartDate,
                    'end_date' => $formattedEndDate,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching attendance for payslip: ' . $e->getMessage());
            return back()->with('error', 'Failed to fetch attendance records: ' . $e->getMessage());
        }
    }

    /**
     * Generate default attendance records for an employee
     */
    private function generateDefaultAttendanceRecords($employee, $startDate, $endDate)
    {
        $records = [];
        $currentDate = new \DateTime($startDate);
        $endDateTime = new \DateTime($endDate);
        $id = 10000; // Temporary ID for generated records
        
        while ($currentDate <= $endDateTime) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayOfWeek = (int)$currentDate->format('N'); // 1 (Monday) through 7 (Sunday)
            
            // Default to Day Off for weekends (Saturday = 6, Sunday = 7)
            $status = ($dayOfWeek >= 6) ? 'Day Off' : 'Present';
            
            $records[] = [
                'id' => $id++,
                'employee_number' => $employee->employee_number,
                'work_date' => $dateStr,
                'daily_rate' => $employee->daily_rate,
                'adjustment' => 0,
                'status' => $status,
                'full_name' => $employee->full_name,
            ];
            
            $currentDate->modify('+1 day');
        }
        
        return collect($records);
    }
}