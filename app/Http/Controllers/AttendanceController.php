<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class AttendanceController extends Controller
{
    public function index()
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

        $employees = Employee::select('id', 'employee_number', 'full_name', 'daily_rate')->get();
        $payrollPeriods = DB::table('payroll_periods')->get();

        return Inertia::render('Attendance/Index', [
            'attendances' => $attendances,
            'employees' => $employees,
            'payrollPeriods' => $payrollPeriods,
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

    // Additional methods not in web.php but needed for functionality
    
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
}
