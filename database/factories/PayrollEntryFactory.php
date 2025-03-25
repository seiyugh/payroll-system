<?php

namespace Database\Factories;

use App\Models\PayrollEntry;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayrollEntryFactory extends Factory
{
    protected $model = PayrollEntry::class;

    public function definition()
    {
        // Select an existing employee or create one if none exist
        $employee = Employee::inRandomOrder()->first() ?? Employee::factory()->create();

        // Assign a daily rate (realistic values)
        $daily_rate = $this->faker->randomElement([600, 650, 450, 500, 550]);

        // Assume a 7-day payroll period
        $work_days = 7;
        $gross_pay = $daily_rate * $work_days;

        // Calculate deductions as percentages of gross pay
        $sss = round($gross_pay * 0.045, 2);  // 4.5% for SSS
        $philhealth = round($gross_pay * 0.03, 2);  // 3% for PhilHealth
        $pagibig = round($gross_pay * 0.02, 2);  // 2% for Pag-IBIG
        $tax = round($gross_pay * 0.12, 2);  // 12% tax
        $cash_advance = $this->faker->randomFloat(2, 0, 500);
        $loan = $this->faker->randomFloat(2, 0, 500);
        $vat = round($gross_pay * 0.05, 2);  // 5% VAT
        $other_deductions = $this->faker->randomFloat(2, 0, 300);

        // Total deductions
        $total_deductions = $sss + $philhealth + $pagibig + $tax + $cash_advance + $loan + $vat + $other_deductions;

        // Net pay calculation
        $net_pay = $gross_pay - $total_deductions;

        // YTD earnings: Assuming 3 months of work
        $ytd_earnings = $gross_pay * 12;

        // Thirteenth-month pay (basic calculation: total earnings / 12)
        $thirteenth_month_pay = round($ytd_earnings / 12, 2);

        return [
            'employee_number' => $employee->employee_number,
            'payroll_period_id' => PayrollPeriod::factory(),
            'gross_pay' => $gross_pay,
            'sss_deduction' => $sss,
            'philhealth_deduction' => $philhealth,
            'pagibig_deduction' => $pagibig,
            'tax_deduction' => $tax,
            'cash_advance' => $cash_advance,
            'loan' => $loan,
            'vat' => $vat,
            'other_deductions' => $other_deductions,
            'total_deductions' => $total_deductions,
            'net_pay' => $net_pay,
            'ytd_earnings' => $ytd_earnings,
            'thirteenth_month_pay' => $thirteenth_month_pay,
            'status' => $this->faker->randomElement(['active', 'inactive']),
            'daily_rates' => $daily_rate,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
