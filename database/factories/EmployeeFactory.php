<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition()
    {
        $position = $this->faker->randomElement(['Driver', 'Driver/Technician']);
        $rate = ($position === 'Driver') ? 600 : 700; // Logical rates

        $dateHired = $this->faker->dateTimeBetween('-10 years', 'now');
        $yearsOfService = now()->year - $dateHired->format('Y');

        return [
            'employee_number' => now()->year . '-' . str_pad($this->faker->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
            'full_name' => $this->faker->name,
            'last_name' => $this->faker->lastName,
            'first_name' => $this->faker->firstName,
            'middle_name' => $this->faker->optional()->lastName,
            'address' => $this->faker->address,
            'position' => $position,
            'department' => 'Logistics',
            'date_hired' => $dateHired->format('Y-m-d'),
            'years_of_service' => $yearsOfService,
            'employment_status' => ($yearsOfService > 1) ? 'active' : 'probationary',
            'daily_rate' => $rate, // Ensure the correct rate here
            'civil_status' => $this->faker->randomElement(['single', 'married']),
            'gender' => $this->faker->randomElement(['male', 'female']),
            'birthdate' => $this->faker->date('Y-m-d', '-30 years'),
            'age' => now()->year - date('Y', strtotime($this->faker->date('Y-m-d', '-30 years'))),
            'contacts' => $this->faker->e164PhoneNumber,
            'sss_no' => $this->faker->regexify('[0-9]{10}'),
            'tin_no' => $this->faker->regexify('[0-9]{9}'),
            'philhealth_no' => $this->faker->regexify('[0-9]{12}'),
            'pagibig_no' => $this->faker->regexify('[0-9]{12}'),
            'emergency_contact_name' => $this->faker->name,
            'emergency_contact_mobile' => $this->faker->numerify('09#########'),
        ];
    }
}
