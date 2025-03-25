<?php

namespace Database\Factories;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttendanceFactory extends Factory
{
    protected $model = Attendance::class;

    public function definition(): array
    {
        $employee = Employee::inRandomOrder()->first();
        
        do {
            $workDate = $this->faker->dateTimeBetween('-1 month', 'now')->format('Y-m-d');
        } while (
            Attendance::where('employee_number', $employee->employee_number)
                ->where('work_date', $workDate)
                ->exists()
        );

        $dayOfWeek = date('N', strtotime($workDate)); // 1 (Monday) to 7 (Sunday)
        $dailyRate = $employee->daily_rate; // Fixed this to daily_rate
        $isWorkday = ($dayOfWeek <= 5); // Monday to Friday are workdays
        $status = $isWorkday ? 'Present' : 'Day Off';
        $adjustment = 0;

        if ($isWorkday && $this->faker->boolean(10)) {
            $status = 'Absent';
            $dailyRate = 0;
        }

        if ($isWorkday && $this->faker->boolean(15)) {
            $adjustment = $this->faker->randomElement([-100, 50, 100, 200]);
        }

        return [
            'employee_number' => $employee->employee_number,
            'work_date' => $workDate,
            'daily_rate' => $dailyRate,
            'adjustment' => $adjustment,
            'status' => $status,
        ];
    }
}
