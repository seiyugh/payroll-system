<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payroll_entries', function (Blueprint $table) {
            $table->id();
            $table->string('employee_number');
            $table->unsignedBigInteger('payroll_period_id');
            $table->decimal('gross_pay', 10, 2);
            $table->decimal('sss_deduction', 10, 2)->nullable();
            $table->decimal('philhealth_deduction', 10, 2)->nullable();
            $table->decimal('pagibig_deduction', 10, 2)->nullable();
            $table->decimal('tax_deduction', 10, 2)->nullable();
            $table->decimal('cash_advance', 10, 2)->nullable();
            $table->decimal('loan', 10, 2)->nullable();
            $table->decimal('vat', 10, 2)->nullable();
            $table->decimal('other_deductions', 10, 2)->nullable();
            $table->decimal('total_deductions', 10, 2)->nullable();
            $table->decimal('net_pay', 10, 2);
            $table->decimal('ytd_earnings', 10, 2)->nullable();
            $table->decimal('thirteenth_month_pay', 10, 2)->nullable();
            $table->string('status');
            $table->json('daily_rates')->nullable();
            $table->timestamps();
            
            $table->foreign('employee_number')->references('employee_number')->on('employees')->onDelete('cascade');
            $table->foreign('payroll_period_id')->references('id')->on('payroll_periods')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_entries');
    }
};

