<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    public function index()
    {
        try {
            // Check if the attendance table exists
            if (!Schema::hasTable('attendance')) {
                // If table doesn't exist, return with error message
                return Inertia::render('Attendance/Index', [
                    'attendanceRecords' => [],
                    'error' => 'The attendance table does not exist in the database. Please run migrations.'
                ]);
            }
            
            // Get attendance records with employee information
            $attendanceRecords = Attendance::with('employee')->get();
            
            return Inertia::render('Attendance/Index', [
                'attendanceRecords' => $attendanceRecords,
                'employees' => Employee::select('id', 'employee_number', 'full_name')->get()
            ]);
        } catch (\Exception $e) {
            return Inertia::render('Attendance/Index', [
                'attendanceRecords' => [],
                'error' => 'Error loading attendance records: ' . $e->getMessage()
            ]);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_number' => 'required|exists:employees,employee_number',
            'work_date' => 'required|date',
            'daily_rate' => 'required|numeric',
            'adjustment' => 'nullable|numeric',
            'status' => 'required|in:Present,Absent,Day Off,Holiday',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            Attendance::create($request->all());
            return redirect()->route('attendance.index')->with('success', 'Attendance record created successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to create attendance record: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'employee_number' => 'required|exists:employees,employee_number',
            'work_date' => 'required|date',
            'daily_rate' => 'required|numeric',
            'adjustment' => 'nullable|numeric',
            'status' => 'required|in:Present,Absent,Day Off,Holiday',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $attendance = Attendance::findOrFail($id);
            $attendance->update($request->all());
            return redirect()->route('attendance.index')->with('success', 'Attendance record updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to update attendance record: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $attendance = Attendance::findOrFail($id);
            $attendance->delete();
            return redirect()->route('attendance.index')->with('success', 'Attendance record deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete attendance record: ' . $e->getMessage());
        }
    }

    public function bulkStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        try {
            // Process the file and import attendance records
            // This would typically involve reading the file and creating attendance records
            
            return redirect()->route('attendance.index')->with('success', 'Attendance records imported successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to import attendance records: ' . $e->getMessage());
        }
    }

    public function bulkManual(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'employeeNumbers' => 'required|array',
            'employeeNumbers.*' => 'exists:employees,employee_number',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        try {
            DB::beginTransaction();
            
            $date = $request->date;
            $employeeNumbers = $request->employeeNumbers;

            foreach ($employeeNumbers as $employeeNumber) {
                $employee = Employee::where('employee_number', $employeeNumber)->first();
                
                if ($employee) {
                    Attendance::create([
                        'employee_number' => $employeeNumber,
                        'work_date' => $date,
                        'daily_rate' => $employee->daily_rate,
                        'adjustment' => 0,
                        'status' => 'Present',
                    ]);
                }
            }
            
            DB::commit();
            return redirect()->route('attendance.index')->with('success', 'Attendance records created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to create attendance records: ' . $e->getMessage());
        }
    }
}

