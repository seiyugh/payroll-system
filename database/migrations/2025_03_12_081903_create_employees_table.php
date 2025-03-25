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
        Schema::create('employees', function (Blueprint $table) {
    $table->id();
    $table->string('employee_number', 10)->unique(); 
    $table->string('full_name');
    $table->string('last_name');
    $table->string('first_name');
    $table->string('middle_name')->nullable();
    $table->text('address');
    $table->string('position');
    $table->string('department');
    $table->text('assigned_area')->nullable();
    $table->date('date_hired');
    $table->integer('years_of_service');
    $table->string('employment_status');
    $table->date('date_of_regularization')->nullable();
    $table->string('status_201')->nullable();
    $table->date('resignation_termination_date')->nullable();
    $table->integer('daily_rate');
    $table->string('civil_status');
    $table->string('gender');
    $table->date('birthdate');
    $table->string('birthplace')->nullable(); 
    $table->integer('age');
    $table->string('contacts');
    $table->string('id_status', 50)->nullable(); // Changed to VARCHAR (string) with max length 50
    $table->string('sss_no')->nullable();
    $table->string('tin_no')->nullable();
    $table->string('philhealth_no')->nullable();
    $table->string('pagibig_no')->nullable();
    $table->string('emergency_contact_name');
    $table->string('emergency_contact_mobile');
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
