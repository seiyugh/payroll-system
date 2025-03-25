<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PayrollAutomationController;
use App\Http\Controllers\ProfileController;
use App\Models\Employee;
use Inertia\Inertia;

// Public home page
Route::get('/', function () {
    return Inertia::render('welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->name('home');

// Authenticated user routes
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard route
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    // Profile routes
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });

    // Employees Routes
    Route::prefix('employees')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Employees/Index', [
                'employees' => Employee::all()
            ]);
        })->name('employees.index');

        Route::get('/create', [EmployeeController::class, 'create'])->name('employees.create');
        Route::post('/', [EmployeeController::class, 'store'])->name('employees.store');
        Route::get('/{id}', [EmployeeController::class, 'show'])->name('employees.show');
        Route::get('/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
        Route::put('/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
        Route::post('/bulk-store', [EmployeeController::class, 'bulkStore'])->name('employees.bulk.store');
    });

    // Payroll Routes
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
    });

    // Attendance Routes
    Route::prefix('attendance')->group(function () {
        Route::get('/', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('/create', [AttendanceController::class, 'create'])->name('attendance.create');
        Route::post('/', [AttendanceController::class, 'store'])->name('attendance.store');
        Route::get('/{id}', [AttendanceController::class, 'show'])->name('attendance.show');
        Route::get('/{id}/edit', [AttendanceController::class, 'edit'])->name('attendance.edit');
        Route::put('/{id}', [AttendanceController::class, 'update'])->name('attendance.update');
        Route::delete('/{id}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');
    });
});

// Include additional route files
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
