<?php

namespace Database\Factories;

use App\Models\PayrollPeriod;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class PayrollPeriodFactory extends Factory
{
    protected $model = PayrollPeriod::class;

    public function definition()
    {
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        // Find the first Monday of the current month
        $startDate = Carbon::create($currentYear, $currentMonth, 1);
        while (!$startDate->isMonday()) {
            $startDate->addDay();
        }

        // Select a payroll period start date that is always a Monday
        $weeksToAdd = rand(0, 3); // Pick one of the first four weeks
        $startDate->addWeeks($weeksToAdd);

        // Ensure the selected period is still within the same month
        if ($startDate->month !== $currentMonth) {
            $startDate->subWeek(); // Prevent overflow into the next month
        }

        // Set end date to always be the following Sunday (7-day period)
        $endDate = (clone $startDate)->addDays(6);

        // Ensure end date is still within the same month
        if ($endDate->month !== $currentMonth) {
            $endDate = (clone $startDate)->endOfMonth(); // Set to last day if needed
        }

        // Set payment date exactly 4 weekdays after period_end
        $paymentDate = (clone $endDate);
        $daysAdded = 0;
        while ($daysAdded < 4) {
            $paymentDate->addDay();
            if (!$paymentDate->isWeekend()) {
                $daysAdded++;
            }
        }

        // Fetch an existing employee (or create one if none exist)
        $employee = Employee::inRandomOrder()->first() ?? Employee::factory()->create();

        return [
            'employee_number' => $employee->employee_number,
            'period_start' => $startDate->format('Y-m-d'),
            'period_end' => $endDate->format('Y-m-d'),
            'payment_date' => $paymentDate->format('Y-m-d'),
            'status' => $this->faker->randomElement(['open', 'closed']),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
