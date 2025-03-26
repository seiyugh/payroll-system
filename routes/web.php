<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PayrollAutomationController;
use App\Http\Controllers\ProfileController;
use Inertia\Inertia;

// ✅ Public home page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->name('home');

// ✅ Move "fetch-for-payslip" outside middleware to test if it works
Route::get('/attendance/fetch-for-payslip', [AttendanceController::class, 'fetchForPayslip'])
    ->middleware('auth') // ✅ Requires authentication (optional)
    ->name('attendance.fetch-for-payslip');

// ✅ Authenticated user routes
Route::middleware(['auth', 'verified'])->group(function () {
    // ✅ Dashboard route
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ✅ Profile routes
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });

    // ✅ Employees Routes
    Route::prefix('employees')->group(function () {
        Route::get('/', [EmployeeController::class, 'index'])->name('employees.index');
        Route::get('/create', [EmployeeController::class, 'create'])->name('employees.create');
        Route::post('/', [EmployeeController::class, 'store'])->name('employees.store');
        Route::get('/{id}', [EmployeeController::class, 'show'])->name('employees.show');
        Route::get('/{id}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
        Route::put('/{id}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/{id}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
        Route::post('/bulk-store', [EmployeeController::class, 'bulkStore'])->name('employees.bulk.store');
    });

    // ✅ Payroll Routes
    Route::prefix('payroll')->group(function () {
        Route::get('/', [PayrollController::class, 'index'])->name('payroll.index');
        Route::post('/', [PayrollController::class, 'store'])->name('payroll.store');
        Route::get('/{id}', [PayrollController::class, 'show'])->name('payroll.show');
        Route::put('/{id}', [PayrollController::class, 'update'])->name('payroll.update');
        Route::delete('/{id}', [PayrollController::class, 'destroy'])->name('payroll.destroy');

        // Payroll Periods
        Route::post('/period', [PayrollController::class, 'createPeriod'])->name('payroll.period.store');
        Route::put('/period/{id}', [PayrollController::class, 'updatePeriod'])->name('payroll.period.update');
        Route::delete('/period/{id}', [PayrollController::class, 'destroyPeriod'])->name('payroll.period.destroy');

        // Payroll Automation
        Route::prefix('automation')->group(function () {
            Route::get('/', [PayrollAutomationController::class, 'index'])->name('payroll.automation');
            Route::post('/generate', [PayrollAutomationController::class, 'generatePayrolls'])->name('payroll.automation.generate');
            Route::post('/send-emails', [PayrollAutomationController::class, 'sendPayslipEmails'])->name('payroll.automation.send-emails');
        });

        // Generate payroll from attendance
        Route::post('/generate-from-attendance', [PayrollController::class, 'generateFromAttendance'])->name('payroll.generate-from-attendance');
    });

    // ✅ Attendance Routes
    Route::prefix('attendance')->group(function () {
        Route::get('/', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('/create', [AttendanceController::class, 'create'])->name('attendance.create');
        Route::post('/', [AttendanceController::class, 'store'])->name('attendance.store');
        Route::get('/{id}', [AttendanceController::class, 'show'])->name('attendance.show');
        Route::get('/{id}/edit', [AttendanceController::class, 'edit'])->name('attendance.edit');
        Route::put('/{id}', [AttendanceController::class, 'update'])->name('attendance.update');
        Route::delete('/{id}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');
        Route::match(['put', 'post'], '/bulk-update', [AttendanceController::class, 'bulkUpdate'])->name('attendance.bulk.update');

        // Additional routes for bulk operations and export
        Route::post('/bulk', [AttendanceController::class, 'bulkStore'])->name('attendance.bulk.store');
        Route::post('/bulk-upload', [AttendanceController::class, 'bulkUpload'])->name('attendance.bulk.upload');
        Route::get('/export', [AttendanceController::class, 'export'])->name('attendance.export');
    });
});

// ✅ Include additional route files
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
