<?php

namespace App\Http\Controllers;

use App\Models\PayrollEntry;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PayrollController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $payrolls = PayrollEntry::with(['employee', 'payrollPeriod'])->get()->map(function ($payroll) {
                // Add the full_name directly to the payroll object
                $payroll->full_name = $payroll->employee ? $payroll->employee->full_name : '';
                return $payroll;
            });
            $employees = Employee::all();
            $payrollPeriods = PayrollPeriod::all();

            return Inertia::render('Payroll/Index', [
                'payrolls' => $payrolls,
                'employees' => $employees,
                'payrollPeriods' => $payrollPeriods,
            ]);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            
            return Inertia::render('Payroll/Index', [
                'error' => 'Failed to retrieve payrolls.',
                'payrolls' => [],
                'employees' => [],
                'payrollPeriods' => [],
            ]);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Validate the request data
            $validator = Validator::make($request->all(), [
                'employee_number' => 'required|exists:employees,employee_number',
                'payroll_period_id' => 'required|exists:payroll_periods,id',
                'gross_pay' => 'required|numeric',
                'sss_deduction' => 'nullable|numeric',
                'philhealth_deduction' => 'nullable|numeric',
                'pagibig_deduction' => 'nullable|numeric',
                'tax_deduction' => 'nullable|numeric',
                'cash_advance' => 'nullable|numeric',
                'loan' => 'nullable|numeric',
                'vat' => 'nullable|numeric',
                'other_deductions' => 'nullable|numeric',
                'total_deductions' => 'nullable|numeric',
                'net_pay' => 'required|numeric',
                'ytd_earnings' => 'nullable|numeric',
                'thirteenth_month_pay' => 'nullable|numeric',
                'daily_rates' => 'nullable|array',
                'status' => 'required',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            // Create a new payroll record
            $payroll = PayrollEntry::create($request->all());

            return redirect()->route('payroll.index')->with('success', 'Payroll created successfully.');
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return redirect()->back()->with('error', 'Failed to create payroll: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $payroll = PayrollEntry::with(['employee', 'payrollPeriod'])->findOrFail($id);
            $payroll->full_name = $payroll->employee ? $payroll->employee->full_name : '';

            return Inertia::render('Payroll/Show', [
                'payroll' => $payroll,
            ]);
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return redirect()->route('payroll.index')->with('error', 'Payroll not found.');
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            // Validate the request data
            $validator = Validator::make($request->all(), [
                'employee_number' => 'required|exists:employees,employee_number',
                'payroll_period_id' => 'required|exists:payroll_periods,id',
                'gross_pay' => 'required|numeric',
                'sss_deduction' => 'nullable|numeric',
                'philhealth_deduction' => 'nullable|numeric',
                'pagibig_deduction' => 'nullable|numeric',
                'tax_deduction' => 'nullable|numeric',
                'cash_advance' => 'nullable|numeric',
                'loan' => 'nullable|numeric',
                'vat' => 'nullable|numeric',
                'other_deductions' => 'nullable|numeric',
                'total_deductions' => 'nullable|numeric',
                'net_pay' => 'required|numeric',
                'ytd_earnings' => 'nullable|numeric',
                'thirteenth_month_pay' => 'nullable|numeric',
                'daily_rates' => 'nullable|array',
                'status' => 'required',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            // Find the payroll record
            $payroll = PayrollEntry::findOrFail($id);

            // Update the payroll record
            $payroll->update($request->all());

            return redirect()->route('payroll.index')->with('success', 'Payroll updated successfully.');
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return redirect()->back()->with('error', 'Failed to update payroll: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $payroll = PayrollEntry::findOrFail($id);
            $payroll->delete();

            return redirect()->route('payroll.index')->with('success', 'Payroll deleted successfully.');
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return redirect()->route('payroll.index')->with('error', 'Failed to delete payroll: ' . $e->getMessage());
        }
    }

    /**
     * Create a new payroll period.
     */
    public function createPeriod(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'period_start' => 'required|date',
                'period_end' => 'required|date|after_or_equal:period_start',
                'payment_date' => 'required|date|after_or_equal:period_end',
                'status' => 'required|in:open,closed',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            $period = PayrollPeriod::create($request->all());

            return redirect()->route('payroll.index')->with('success', 'Payroll period created successfully.');
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return redirect()->back()->with('error', 'Failed to create payroll period: ' . $e->getMessage());
        }
    }

    /**
     * Update a payroll period.
     */
    public function updatePeriod(Request $request, string $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'period_start' => 'required|date',
                'period_end' => 'required|date|after_or_equal:period_start',
                'payment_date' => 'required|date|after_or_equal:period_end',
                'status' => 'required|in:open,closed',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            $period = PayrollPeriod::findOrFail($id);
            $period->update($request->all());

            return redirect()->route('payroll.index')->with('success', 'Payroll period updated successfully.');
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return redirect()->back()->with('error', 'Failed to update payroll period: ' . $e->getMessage());
        }
    }

    /**
     * Delete a payroll period.
     */
    public function destroyPeriod(string $id)
    {
        try {
            $period = PayrollPeriod::findOrFail($id);
            $period->delete();

            return redirect()->route('payroll.index')->with('success', 'Payroll period deleted successfully.');
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return redirect()->route('payroll.index')->with('error', 'Failed to delete payroll period: ' . $e->getMessage());
        }
    }
}

