<?php

namespace App\Http\Controllers;

use App\Models\PayrollEntry;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PayrollController extends Controller
{
    /**
     * Display a listing of the payroll entries.
     */
    public function index()
    {
        try {
            $payrolls = PayrollEntry::with(['employee', 'payrollPeriod'])
                ->get()
                ->map(function ($payroll) {
                    $payroll->full_name = $payroll->employee ? $payroll->employee->full_name : '';
                    return $payroll;
                });

            return Inertia::render('Payroll/Index', [
                'payrolls' => $payrolls,
                'employees' => Employee::all(),
                'payrollPeriods' => PayrollPeriod::all(),
            ]);
        } catch (\Exception $e) {
            Log::error('Payroll Index Error: ' . $e->getMessage());

            return Inertia::render('Payroll/Index', [
                'error' => 'Failed to retrieve payrolls.',
                'payrolls' => [],
                'employees' => [],
                'payrollPeriods' => [],
            ]);
        }
    }

    /**
     * Generate payroll entries from attendance.
     */
    public function generateFromAttendance(Request $request)
    {
        try {
            $validated = $request->validate([
                'payroll_period_id' => 'required|exists:payroll_periods,id',
                'include_daily_rates' => 'boolean',
                'respect_attendance_status' => 'boolean',
                'overwrite_existing' => 'boolean',
            ]);

            // Get the payroll period
            $payrollPeriod = PayrollPeriod::findOrFail($validated['payroll_period_id']);
            $overwriteExisting = $validated['overwrite_existing'] ?? false;

            // If not overwriting, check if payroll records exist
            if (!$overwriteExisting) {
                $existingCount = PayrollEntry::where('payroll_period_id', $payrollPeriod->id)->count();
                if ($existingCount > 0) {
                    return response()->json([
                        'message' => 'Payroll records already exist for this period. Set overwrite_existing to true to replace them.',
                    ], 422);
                }
            } else {
                // Delete existing payroll records for this period
                PayrollEntry::where('payroll_period_id', $payrollPeriod->id)->delete();
            }

            // Get all employees
            $employees = Employee::all();

            // Fetch attendance records
            $attendanceRecords = DB::table('attendance')
                ->whereBetween('work_date', [$payrollPeriod->period_start, $payrollPeriod->period_end])
                ->get()
                ->toArray();

            // Group attendance records by employee
            $attendanceByEmployee = [];
            foreach ($attendanceRecords as $record) {
                $employeeNumber = $record->employee_number;
                if (!isset($attendanceByEmployee[$employeeNumber])) {
                    $attendanceByEmployee[$employeeNumber] = [];
                }
                $attendanceByEmployee[$employeeNumber][] = $record;
            }

            // Create payroll records for each employee
            $payrollRecords = [];

            foreach ($employees as $employee) {
                $employeeAttendance = $attendanceByEmployee[$employee->employee_number] ?? [];
                $grossPay = 0;
                $dailyRates = [];

                if (count($employeeAttendance) > 0 && ($validated['respect_attendance_status'] ?? true)) {
                    foreach ($employeeAttendance as $record) {
                        $status = $record->status;
                        $dailyRate = $record->daily_rate ?? $employee->daily_rate;
                        $adjustment = $record->adjustment ?? 0;
                        $date = $record->work_date;

                        $amount = match (strtolower($status)) {
                            'present' => $dailyRate,
                            'half day' => $dailyRate / 2,
                            'absent', 'day off' => 0,
                            'holiday', 'leave' => $dailyRate,
                            default => $dailyRate,
                        };

                        $grossPay += $amount + $adjustment;

                        if ($validated['include_daily_rates'] ?? false) {
                            $dailyRates[] = [
                                'date' => $date,
                                'amount' => $dailyRate,
                                'status' => $status,
                                'adjustment' => $adjustment
                            ];
                        }
                    }
                } else {
                    // Default calculation based on working days
                    $startDate = new \DateTime($payrollPeriod->period_start);
                    $endDate = new \DateTime($payrollPeriod->period_end);
                    $interval = $startDate->diff($endDate);
                    $days = $interval->days + 1;

                    $grossPay = $employee->daily_rate * $days;
                }

                // Deduction calculations
                $sssDeduction = max(0, $grossPay * 0.0363);
                $philhealthDeduction = max(0, $grossPay * 0.03);
                $pagibigDeduction = 100;
                $taxDeduction = max(0, ($grossPay > 20833) ? ($grossPay - 20833) * 0.20 : 0);

                $totalDeductions = $sssDeduction + $philhealthDeduction + $pagibigDeduction + $taxDeduction;
                $netPay = max(0, $grossPay - $totalDeductions);

                // Create payroll record
                $payrollRecords[] = [
                    'employee_id' => $employee->id,
                    'employee_number' => $employee->employee_number,
                    'payroll_period_id' => $payrollPeriod->id,
                    'gross_pay' => $grossPay,
                    'sss_deduction' => $sssDeduction,
                    'philhealth_deduction' => $philhealthDeduction,
                    'pagibig_deduction' => $pagibigDeduction,
                    'tax_deduction' => $taxDeduction,
                    'total_deductions' => $totalDeductions,
                    'net_pay' => $netPay,
                    'daily_rates' => $validated['include_daily_rates'] ?? false ? json_encode($dailyRates) : null,
                    'status' => 'generated',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Insert payroll records
            if (!empty($payrollRecords)) {
                PayrollEntry::insert($payrollRecords);
            }

            return redirect()->back()->with('success', 'Payroll generated successfully!');
        } catch (\Exception $e) {
            Log::error('Payroll Generation Error: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to generate payroll.');
        }
    }

    public function update(Request $request, $id)
{
    try {
        $validated = $request->validate([
            'employee_number' => 'required|exists:employees,employee_number',
            'payroll_period_id' => 'required|exists:payroll_periods,id',
            'gross_pay' => 'required|numeric',
            'total_deductions' => 'required|numeric',
            'net_pay' => 'required|numeric',
            'daily_rates' => 'nullable|json',
        ]);

        $payroll = PayrollEntry::findOrFail($id);
        $payroll->update($validated);

        return redirect()->back()->with('success', 'Payroll updated successfully!');
    } catch (\Exception $e) {
        Log::error('Error updating payroll: ' . $e->getMessage());

        return redirect()->back()->with('error', 'Failed to update payroll.');
    }
}

    public function store(Request $request)
{
    try {
        $validated = $request->validate([
            'employee_number' => 'required|exists:employees,employee_number',
            'payroll_period_id' => 'required|exists:payroll_periods,id',
            'gross_pay' => 'required|numeric',
            'total_deductions' => 'required|numeric',
            'net_pay' => 'required|numeric',
            'daily_rates' => 'nullable|json',
        ]);

        PayrollEntry::create($validated);

        return redirect()->back()->with('success', 'Payroll created successfully!');
    } catch (\Exception $e) {
        Log::error('Error storing payroll: ' . $e->getMessage());

        return redirect()->back()->with('error', 'Failed to store payroll.');
    }
}

public function destroy($id)
{
    try {
        $payroll = PayrollEntry::findOrFail($id);
        $payroll->delete();

        return redirect()->back()->with('success', 'Payroll deleted successfully!');
    } catch (\Exception $e) {
        Log::error('Error deleting payroll: ' . $e->getMessage());

        return redirect()->back()->with('error', 'Failed to delete payroll.');
    }
}


}
