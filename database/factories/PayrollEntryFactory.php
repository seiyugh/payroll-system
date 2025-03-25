<?php

namespace Database\Factories;

use App\Models\PayrollEntry;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayrollEntryFactory extends Factory
{
    protected $model = PayrollEntry::class;

    public function definition()
    {
        // Select an existing employee to link with payroll
        $employee = Employee::inRandomOrder()->first();

        return [
            'employee_number' => $employee ? $employee->employee_number : 'EMP000',
            'payroll_period_id' => \App\Models\PayrollPeriod::factory(),
            'gross_pay' => $this->faker->randomFloat(2, 1000, 10000),
            'sss_deduction' => $this->faker->randomFloat(2, 50, 500),
            'philhealth_deduction' => $this->faker->randomFloat(2, 50, 500),
            'pagibig_deduction' => $this->faker->randomFloat(2, 50, 500),
            'tax_deduction' => $this->faker->randomFloat(2, 100, 1000),
            'other_deductions' => $this->faker->randomFloat(2, 0, 500),
            'net_pay' => function (array $attributes) {
                return $attributes['gross_pay'] - (
                    $attributes['sss_deduction'] +
                    $attributes['philhealth_deduction'] +
                    $attributes['pagibig_deduction'] +
                    $attributes['tax_deduction'] +
                    $attributes['other_deductions']
                );
            },
            'ytd_earnings' => $this->faker->randomFloat(2, 10000, 100000),
            'thirteenth_month_pay' => $this->faker->randomFloat(2, 1000, 3000),
            'status' => $this->faker->randomElement(['active', 'inactive']),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
