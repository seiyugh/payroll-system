<?php

// database/seeders/PayrollEntrySeeder.php

namespace Database\Seeders;

use App\Models\PayrollEntry;
use App\Models\Employee; // Ensure you import the Employee model
use Illuminate\Database\Seeder;

class PayrollEntrySeeder extends Seeder
{
    public function run()
    {
        // Ensure that you have at least one employee in your Employee table
        $employee = Employee::factory()->create(); // Creates a random employee

        // Create PayrollEntry using the employee_number from the created Employee
        PayrollEntry::factory()->count(50)->create([
            'employee_number' => $employee->employee_number, // Link the payroll entry to the employee
        ]);
    }
}
