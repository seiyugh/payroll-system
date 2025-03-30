<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employee extends Model
{
    use HasFactory;

    // Comment out or remove these lines as they don't match your database structure
    // protected $primaryKey = 'employee_number';
    // protected $keyType = 'string';
    // public $incrementing = false;

    protected $fillable = [
        'employee_number',
        'full_name',
        'last_name',
        'first_name',
        'middle_name',
        'address',
        'position',
        'department',
        'assigned_area',
        'date_hired',
        'years_of_service',
        'employment_status',
        'date_of_regularization',
        'status_201',
        'resignation_termination_date',
        'daily_rate',
        'civil_status',
        'gender',
        'birthdate',
        'birthplace',
        'age',
        'contacts',
        'id_status',
        'sss_no',
        'tin_no',
        'philhealth_no',
        'pagibig_no',
        'emergency_contact_name',
        'emergency_contact_mobile',
        'email',
    ];

    /**
     * Get the payroll entries for this employee.
     */
    public function payrollEntries(): HasMany
    {
        return $this->hasMany(PayrollEntry::class, 'employee_number', 'employee_number');
    }

    /**
     * Get the attendance records for this employee.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'employee_number', 'employee_number');
    }
}

