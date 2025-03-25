<?php

namespace App\Http\Controllers;

use App\Models\PayrollPeriod;
use App\Models\Employee;
use App\Models\PayrollEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PayrollAutomationController extends Controller
{
    /**
     * Display the payroll automation settings page.
     */
    public function index()
    {
        $periods = PayrollPeriod::orderBy('period_end', 'desc')->get();
        $employees = Employee::select('id', 'employee_number', 'full_name', 'email')->get();
        
        return Inertia::render('Payroll/Automation', [
            'periods' => $periods,
            'employees' => $employees,
        ]);
    }
    
    /**
     * Generate payrolls for a specific period.
     */
    public function generatePayrolls(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:payroll_periods,id',
            'send_email' => 'boolean',
        ]);
        
        try {
            $periodId = $request->input('period_id');
            $sendEmail = $request->input('send_email', false);
            
            // Build the command
            $command = "payroll:generate --period_id={$periodId}";
            if ($sendEmail) {
                $command .= " --send-email";
            }
            
            // Run the command
            $exitCode = Artisan::call($command);
            
            // Get the output
            $output = Artisan::output();
            
            if ($exitCode === 0) {
                return redirect()->back()->with('success', 'Payrolls generated successfully!');
            } else {
                return redirect()->back()->with('error', 'Failed to generate payrolls.');
            }
            
        } catch (\Exception $e) {
            Log::error('Error generating payrolls: ' . $e->getMessage());
            
            return redirect()->back()->with('error', 'An error occurred while generating payrolls: ' . $e->getMessage());
        }
    }
    
    /**
     * Send payslip emails for a specific period.
     */
    public function sendPayslipEmails(Request $request)
    {
        $request->validate([
            'period_id' => 'required|exists:payroll_periods,id',
            'employee_ids' => 'array',
            'employee_ids.*' => 'exists:employees,id',
        ]);
        
        try {
            // Logic to send payslip emails
            // This would typically call a service or job to handle the email sending
            
            return redirect()->back()->with('success', 'Payslip emails sent successfully!');
            
        } catch (\Exception $e) {
            Log::error('Error sending payslip emails: ' . $e->getMessage());
            
            return redirect()->back()->with('error', 'An error occurred while sending payslip emails: ' . $e->getMessage());
        }
    }
}

