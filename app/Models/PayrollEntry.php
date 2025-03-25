<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_number',
        'payroll_period_id',
        'gross_pay',
        'sss_deduction',
        'philhealth_deduction',
        'pagibig_deduction',
        'tax_deduction',
        'cash_advance',
        'loan',
        'vat',
        'other_deductions',
        'total_deductions',
        'net_pay',
        'ytd_earnings',
        'thirteenth_month_pay',
        'status',
        'daily_rates',
    ];

    protected $casts = [
        'gross_pay' => 'decimal:2',
        'sss_deduction' => 'decimal:2',
        'philhealth_deduction' => 'decimal:2',
        'pagibig_deduction' => 'decimal:2',
        'tax_deduction' => 'decimal:2',
        'cash_advance' => 'decimal:2',
        'loan' => 'decimal:2',
        'vat' => 'decimal:2',
        'other_deductions' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'ytd_earnings' => 'decimal:2',
        'thirteenth_month_pay' => 'decimal:2',
        'daily_rates' => 'decimal:2',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['full_name'];

    /**
     * Get the employee that owns the payroll entry.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_number', 'employee_number');
    }

    /**
     * Get the payroll period that owns the payroll entry.
     */
    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    /**
     * Get the full name of the employee.
     *
     * @return string
     */
    public function getFullNameAttribute()
    {
        return $this->employee ? $this->employee->full_name : '';
    }
}

