<?php

namespace Database\Factories;

use App\Models\PayrollPeriod;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayrollPeriodFactory extends Factory
{
    protected $model = PayrollPeriod::class;

    public function definition()
    {
        // Fetch a random employee to link the payroll period to
        $employee = Employee::inRandomOrder()->first();

        return [
            'employee_number' => $employee ? $employee->employee_number : 'EMP000',
            'period_start' => $this->faker->date(),
            'period_end' => $this->faker->date(),
            'payment_date' => $this->faker->date(),
            'status' => $this->faker->randomElement(['open', 'closed']),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
