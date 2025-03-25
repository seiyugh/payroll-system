<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\User;
use App\Models\PayrollPeriod;
use App\Models\PayrollEntry;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Seed Employees
        $employees = Employee::factory(10)->create();

        // Seed Users, Payroll Periods, Payroll Entries
        $employees->each(function ($employee) {
            User::factory()->create([
                'employee_number' => $employee->employee_number
            ]);

            $payrollPeriod = PayrollPeriod::factory()->create([
                'employee_number' => $employee->employee_number
            ]);

            PayrollEntry::factory()->create([
                'employee_number' => $employee->employee_number,
                'payroll_period_id' => $payrollPeriod->id
            ]);
        });

        // Generate Attendance for Each Employee
        $attendanceRecords = [];
        $startDate = Carbon::now()->subDays(30);
        $endDate = Carbon::now();

        foreach ($employees as $employee) {
            for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
                $dayOfWeek = $date->format('N');
                $dailyRate = $employee->daily_rate;

                if ($dayOfWeek <= 5) {
                    $status = 'Present';
                    $adjustment = (random_int(0, 100) < 15) ? random_int(-100, 200) : 0;
                } else {
                    $status = 'Day Off';
                    $adjustment = 0;
                }

                if (!Attendance::where('employee_number', $employee->employee_number)
                    ->where('work_date', $date->format('Y-m-d'))
                    ->exists()) {

                    $attendanceRecords[] = [
                        'employee_number' => $employee->employee_number,
                        'work_date' => $date->format('Y-m-d'),
                        'daily_rate' => $dailyRate,
                        'adjustment' => $adjustment,
                        'status' => $status,
                    ];
                }
            }
        }

        // Insert attendance in bulk
        if (!empty($attendanceRecords)) {
            Attendance::insert($attendanceRecords);
        }
    }
}
