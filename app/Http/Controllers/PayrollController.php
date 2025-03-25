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
            // Validate request
            $validator = Validator::make($request->all(), [
                'payroll_period_id' => 'required|exists:payroll_periods,id',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            $payrollPeriod = PayrollPeriod::findOrFail($request->input('payroll_period_id'));

            // Get all attendances within the payroll period
            $attendances = Attendance::whereBetween('work_date', [
                $payrollPeriod->period_start,
                $payrollPeriod->period_end
            ])->get();

            if ($attendances->isEmpty()) {
                return redirect()->back()->with('error', 'No attendance records found for this payroll period.');
            }

            // Get all unique employee numbers from attendance records
            $employeeNumbers = $attendances->pluck('employee_number')->unique();

            // Retrieve employees in a single query
            $employees = Employee::whereIn('employee_number', $employeeNumbers)->get()->keyBy('employee_number');

            // Process payroll for each employee
            foreach ($attendances->groupBy('employee_number') as $employeeNumber => $employeeAttendances) {
                $employee = $employees->get($employeeNumber);

                if (!$employee) {
                    Log::warning("Employee not found: {$employeeNumber}");
                    continue;
                }

                $grossPay = 0;
                $dailyRates = 0;

                foreach ($employeeAttendances as $attendance) {
                    if ($attendance->status === 'Present') {
                        $grossPay += $attendance->daily_rate;
                        $dailyRates += $attendance->daily_rate;
                    }
                    $grossPay += $attendance->adjustment; // Add adjustments if any
                }

                // Deduction calculations
                $sssDeduction = max(0, $grossPay * 0.0363);
                $philhealthDeduction = max(0, $grossPay * 0.03);
                $pagibigDeduction = 100;
                $taxDeduction = max(0, ($grossPay > 20833) ? ($grossPay - 20833) * 0.20 : 0);

                $totalDeductions = $sssDeduction + $philhealthDeduction + $pagibigDeduction + $taxDeduction;
                $netPay = max(0, $grossPay - $totalDeductions);

                // Create or update payroll entry
                PayrollEntry::updateOrCreate(
                    [
                        'employee_number' => $employeeNumber,
                        'payroll_period_id' => $payrollPeriod->id,
                    ],
                    [
                        'gross_pay' => $grossPay,
                        'sss_deduction' => $sssDeduction,
                        'philhealth_deduction' => $philhealthDeduction,
                        'pagibig_deduction' => $pagibigDeduction,
                        'tax_deduction' => $taxDeduction,
                        'total_deductions' => $totalDeductions,
                        'net_pay' => $netPay,
                        'daily_rates' => $dailyRates,
                        'status' => 'generated',
                    ]
                );
            }

            return redirect()->back()->with('success', 'Payroll generated successfully!');
        } catch (\Exception $e) {
            Log::error('Payroll Generation Error: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to generate payroll.');
        }
    }
}
