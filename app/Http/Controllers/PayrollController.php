<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\PayrollEntry;
use App\Models\PayrollPeriod;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Throwable;
use App\Http\Controllers\Controller;

class PayrollController extends Controller {
  // Basic CRUD Operations
  public function index(Request $request)
  {
      try {
          // Start with a base query
          $query = PayrollEntry::with(['employee', 'payrollPeriod']);
          
          // Apply search filter if provided
          if ($request->has('search') && !empty($request->search)) {
              $search = $request->search;
              $query->whereHas('employee', function($q) use ($search) {
                  $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('employee_number', 'like', "%{$search}%");
              });
          }
          
          // Apply status filter if provided
          if ($request->has('status') && !empty($request->status)) {
              $query->where('status', $request->status);
          }
          
          // Apply period filter if provided - using week_id instead of period_start
          if ($request->has('period') && !empty($request->period)) {
              $query->where('week_id', $request->period);
          }
      
          // Get all entries for summary calculations - this query is not affected by pagination
          $allEntries = PayrollEntry::get();
      
          // Calculate summary statistics from all entries
          $totalGrossPay = $allEntries->sum('gross_pay');
          $totalNetPay = $allEntries->sum('net_pay');
          $totalDeductions = $allEntries->sum('total_deductions');
          $completedCount = $allEntries->filter(function($entry) {
              return in_array(strtolower($entry->status), ['paid', 'approved']);
          })->count();
          $pendingCount = $allEntries->filter(function($entry) {
              return in_array(strtolower($entry->status), ['pending', 'generated']);
          })->count();
      
          // Paginate the results
          $perPage = $request->input('per_page', 10); // Default 10 items per page
          $page = $request->input('page', 1);
          $paginatedEntries = $query->paginate($perPage);
      
          // Transform the paginated data
          $transformedEntries = $paginatedEntries->getCollection()->map(function($payroll) {
              return [
                  'id' => $payroll->id,
                  'employee_number' => $payroll->employee_number,
                  'full_name' => $payroll->employee ? $payroll->employee->full_name : '',
                  'department' => $payroll->employee ? $payroll->department : null,
                  'position' => $payroll->employee ? $payroll->position : null,
                  'week_id' => $payroll->week_id,
                  'daily_rate' => $payroll->daily_rate,
                  'basic_salary' => $payroll->basic_salary ?? 0,
                  'gross_pay' => (string)$payroll->gross_pay,
                  'sss_deduction' => (string)$payroll->sss_deduction,
                  'philhealth_deduction' => (string)$payroll->philhealth_deduction,
                  'pagibig_deduction' => (string)$payroll->pagibig_deduction,
                  'tax_deduction' => (string)$payroll->tax_deduction,
                  'cash_advance' => (string)$payroll->cash_advance,
                  'loan' => (string)$payroll->loan,
                  'vat' => (string)$payroll->vat,
                  'other_deductions' => (string)$payroll->other_deductions,
                  'short' => (string)$payroll->short,
                  'total_deductions' => (string)$payroll->total_deductions,
                  'net_pay' => (string)$payroll->net_pay,
                  'ytd_earnings' => (string)$payroll->ytd_earnings,
                  'thirteenth_month_pay' => (string)$payroll->thirteenth_month_pay,
                  'status' => $payroll->status,
                  'created_at' => $payroll->created_at,
                  'updated_at' => $payroll->updated_at,
              ];
          });
      
          // Create a new paginator with the transformed data
          $paginatedResult = new \Illuminate\Pagination\LengthAwarePaginator(
              $transformedEntries,
              $paginatedEntries->total(),
              $paginatedEntries->perPage(),
              $paginatedEntries->currentPage(),
              ['path' => \Request::url(), 'query' => $request->query()]
          );
      
          // Add summary statistics
          $summary = [
              'totalGrossPay' => $totalGrossPay,
              'totalNetPay' => $totalNetPay,
              'totalDeductions' => $totalDeductions,
              'completedCount' => $completedCount,
              'pendingCount' => $pendingCount,
              'totalCount' => $allEntries->count()
          ];

          // Always return a successful response, even with empty results
          return Inertia::render('Payroll/Index', [
              'payrollEntries' => $paginatedResult,
              'payrollSummary' => $summary,
              'employees' => Employee::all(),
              'payrollPeriods' => PayrollPeriod::all(),
              'filters' => $request->only(['search', 'status', 'period']),
          ]);
      } catch (\Exception $e) {
          Log::error('Payroll Index Error: ' . $e->getMessage());
          return Inertia::render('Payroll/Index', [
              'error' => 'Failed to retrieve payrolls.',
              'payrollEntries' => [],
              'payrollSummary' => [
                  'totalGrossPay' => 0,
                  'totalNetPay' => 0,
                  'totalDeductions' => 0,
                  'completedCount' => 0,
                  'pendingCount' => 0,
                  'totalCount' => 0
              ],
              'employees' => [],
              'payrollPeriods' => [],
          ]);
      }
  }

  // FIXED: Enhanced store method with better error handling and debugging
  public function store(Request $request)
  {
      try {
          DB::beginTransaction();
          
          // Log the raw request data
          Log::info('Raw payroll creation request data:', $request->all());
          
          // Validate the request data
          $validated = $request->validate([
              'employee_number' => 'required|exists:employees,employee_number',
              'week_id' => 'required|exists:payroll_periods,week_id',
              'daily_rate' => 'nullable|numeric',
              'gross_pay' => 'required|numeric',
              'sss_deduction' => 'required|numeric',
              'philhealth_deduction' => 'required|numeric',
              'pagibig_deduction' => 'required|numeric',
              'tax_deduction' => 'required|numeric',
              'cash_advance' => 'numeric|nullable',
              'loan' => 'numeric|nullable',
              'vat' => 'numeric|nullable',
              'other_deductions' => 'numeric|nullable',
              'short' => 'numeric|nullable',
              'ytd_earnings' => 'numeric|nullable',
              'thirteenth_month_pay' => 'numeric|nullable',
              'status' => 'required|string',
          ]);

          // Set default values for nullable fields
          $validated['cash_advance'] = $validated['cash_advance'] ?? 0;
          $validated['loan'] = $validated['loan'] ?? 0;
          $validated['vat'] = $validated['vat'] ?? 0;
          $validated['other_deductions'] = $validated['other_deductions'] ?? 0;
          $validated['short'] = $validated['short'] ?? 0;
          $validated['ytd_earnings'] = $validated['ytd_earnings'] ?? 0;
          $validated['thirteenth_month_pay'] = $validated['thirteenth_month_pay'] ?? 0;

          // Calculate derived fields
          $validated['total_deductions'] = $validated['sss_deduction'] + 
                                         $validated['philhealth_deduction'] + 
                                         $validated['pagibig_deduction'] + 
                                         $validated['tax_deduction'] + 
                                         $validated['cash_advance'] + 
                                         $validated['loan'] + 
                                         $validated['vat'] + 
                                         $validated['other_deductions'] + 
                                         $validated['short'];
          
          $validated['net_pay'] = $validated['gross_pay'] - $validated['total_deductions'];

          // Log the data before creation
          Log::info('Creating payroll entry with validated data:', [
              'validated_data' => $validated
          ]);

          Log::info('About to create PayrollEntry with data:', [
              'employee_number' => $validated['employee_number'],
              'week_id' => $validated['week_id'],
              'gross_pay' => $validated['gross_pay'],
              'net_pay' => $validated['net_pay'],
              'total_deductions' => $validated['total_deductions'],
              'status' => $validated['status']
          ]);

          // Create a new PayrollEntry instance and set its properties
          $payroll = new PayrollEntry();
          foreach ($validated as $key => $value) {
              $payroll->$key = $value;
          }
          
          // Save the model
          $saved = $payroll->save();
          
          if (!$saved) {
              throw new \Exception('Failed to save payroll entry');
          }

          // Log the result
          Log::info('Create result:', [
              'payroll_id' => $payroll->id,
              'payroll' => $payroll->toArray(),
              'saved' => $saved
          ]);
          
          DB::commit();

          if ($request->wantsJson()) {
              return response()->json([
                  'success' => true,
                  'message' => 'Payroll created successfully!',
                  'payroll' => $payroll
              ]);
          }

          return redirect()->back()->with('success', 'Payroll created successfully!');
      } catch (\Exception $e) {
          DB::rollBack();
          Log::error('Error storing payroll: ' . $e->getMessage());
          Log::error('Stack trace: ' . $e->getTraceAsString());
          
          if ($request->wantsJson()) {
              return response()->json([
                  'success' => false,
                  'message' => 'Failed to store payroll: ' . $e->getMessage()
              ], 500);
          }
          
          return redirect()->back()->with('error', 'Failed to store payroll: ' . $e->getMessage());
      }
  }

  // FIXED: Enhanced update method with better error handling and debugging
  public function update(Request $request, $id)
  {
      try {
          DB::beginTransaction();
          
          // Log the raw request data
          Log::info('Raw payroll update request data for ID ' . $id . ':', $request->all());
          
          // Find the payroll entry first to ensure it exists
          $payroll = PayrollEntry::findOrFail($id);
          
          // Validate the request data
          $validated = $request->validate([
              'employee_number' => 'required|exists:employees,employee_number',
              'week_id' => 'required|exists:payroll_periods,week_id',
              'daily_rate' => 'nullable|numeric|min:0',
              'gross_pay' => 'required|numeric|min:0',
              'sss_deduction' => 'required|numeric|min:0',
              'philhealth_deduction' => 'required|numeric|min:0',
              'pagibig_deduction' => 'required|numeric|min:0',
              'tax_deduction' => 'required|numeric|min:0',
              'cash_advance' => 'nullable|numeric|min:0',
              'loan' => 'nullable|numeric|min:0',
              'vat' => 'nullable|numeric|min:0',
              'other_deductions' => 'nullable|numeric|min:0',
              'short' => 'nullable|numeric|min:0',
              'ytd_earnings' => 'nullable|numeric|min:0',
              'thirteenth_month_pay' => 'nullable|numeric|min:0',
              'status' => 'required|string|in:generated,approved,paid,pending,rejected',
          ]);

          // Set default values for nullable fields
          $validated['cash_advance'] = $validated['cash_advance'] ?? 0;
          $validated['loan'] = $validated['loan'] ?? 0;
          $validated['vat'] = $validated['vat'] ?? 0;
          $validated['other_deductions'] = $validated['other_deductions'] ?? 0;
          $validated['short'] = $validated['short'] ?? 0;
          $validated['ytd_earnings'] = $validated['ytd_earnings'] ?? 0;
          $validated['thirteenth_month_pay'] = $validated['thirteenth_month_pay'] ?? 0;

          // Get the employee
          $employee = Employee::where('employee_number', $validated['employee_number'])->first();

          // Only apply short if employee is Allen One
          if (!$employee || $employee->department !== 'Allen One') {
              $validated['short'] = 0; // Force to 0 for non-Allen One employees
          }

          // Calculate derived fields
          $totalDeductions = $validated['sss_deduction'] +
                              $validated['philhealth_deduction'] +
                              $validated['pagibig_deduction'] +
                              $validated['tax_deduction'] +
                              $validated['cash_advance'] +
                              $validated['loan'] +
                              $validated['vat'] +
                              $validated['other_deductions'] +
                              ($validated['short'] ?? 0);

          $netPay = $validated['gross_pay'] - $totalDeductions;

          $validated['total_deductions'] = $totalDeductions;
          $validated['net_pay'] = $netPay;
          
          // Log the data before update
          Log::info('Before update', [
              'id' => $id,
              'validated_data' => $validated,
              'original_data' => $payroll->toArray()
          ]);

          Log::info('About to update PayrollEntry ID ' . $id . ' with data:', [
              'employee_number' => $validated['employee_number'],
              'week_id' => $validated['week_id'],
              'gross_pay' => $validated['gross_pay'],
              'net_pay' => $validated['net_pay'],
              'total_deductions' => $validated['total_deductions'],
              'status' => $validated['status']
          ]);

          // Update each property individually
          foreach ($validated as $key => $value) {
              $payroll->$key = $value;
          }
          
          // Save the changes
          $saved = $payroll->save();
          
          if (!$saved) {
              throw new \Exception('Failed to save updated payroll entry');
          }

          // Log the result
          Log::info('Update result', [
              'saved' => $saved,
              'after' => $payroll->fresh()->toArray()
          ]);
          
          DB::commit();

          if ($request->wantsJson()) {
              return response()->json([
                  'success' => true,
                  'message' => 'Payroll updated successfully!',
                  'payroll' => $payroll->fresh()
              ]);
          }

          return redirect()->back()->with('success', 'Payroll updated successfully!');
      } catch (\Exception $e) {
          DB::rollBack();
          Log::error('Error updating payroll: ' . $e->getMessage());
          Log::error('Stack trace: ' . $e->getTraceAsString());
          
          if ($request->wantsJson()) {
              return response()->json([
                  'success' => false,
                  'message' => 'Failed to update payroll: ' . $e->getMessage()
              ], 500);
          }
          
          return back()->with('error', 'Failed to update payroll: ' . $e->getMessage());
      }
  }

  // FIXED: Enhanced generatePayroll method with better error handling and debugging
  public function generatePayroll(Request $request)
  {
      try {
          $request->validate([
              'week_id' => 'required|exists:payroll_periods,week_id',
          ]);

          $weekId = $request->input('week_id');
          Log::info('Generating payroll for week_id: ' . $weekId);
          
          $payrollPeriod = PayrollPeriod::where('week_id', $weekId)->firstOrFail();
          $startDate = $payrollPeriod->period_start;
          $endDate = $payrollPeriod->period_end;

          $employees = Employee::all();
          Log::info('Found ' . $employees->count() . ' employees for payroll generation');

          DB::beginTransaction();
          
          $createdCount = 0;
          $skippedCount = 0;
          
          foreach ($employees as $employee) {
              // Check if payroll entry already exists for this employee and week
              $exists = PayrollEntry::where('employee_number', $employee->employee_number)
                  ->where('week_id', $weekId)
                  ->exists();
                  
              if ($exists) {
                  Log::info('Skipping payroll generation for employee ' . $employee->employee_number . ' - entry already exists');
                  $skippedCount++;
                  continue;
              }

              $basicSalary = $employee->monthly_salary ?? 0;
              $dailyRate = $employee->daily_rate ?? 0;
              $grossSalary = $dailyRate * 5; // Assuming 5 working days per week
              
              Log::info('Calculating payroll for employee: ' . $employee->employee_number, [
                  'basic_salary' => $basicSalary,
                  'daily_rate' => $dailyRate,
                  'gross_salary' => $grossSalary
              ]);

              // Calculate deductions
              $sssDeduction = $this->calculateSSS($grossSalary);
              $philhealthDeduction = $this->calculatePhilhealth($grossSalary);
              $pagibigDeduction = $this->calculatePagibig($grossSalary);
              $taxDeduction = $this->calculateTax($grossSalary);
              
              $totalDeductions = $sssDeduction + $philhealthDeduction + $pagibigDeduction + $taxDeduction;
              $netPay = $grossSalary - $totalDeductions;

              Log::info('Generating payroll for employee ' . $employee->employee_number, [
                  'week_id' => $weekId,
                  'daily_rate' => $dailyRate,
                  'gross_salary' => $grossSalary,
                  'deductions' => [
                      'sss' => $sssDeduction,
                      'philhealth' => $philhealthDeduction,
                      'pagibig' => $pagibigDeduction,
                      'tax' => $taxDeduction
                  ]
              ]);

              // Create payroll entry
              $payrollData = [
                  'employee_number' => $employee->employee_number,
                  'week_id' => $weekId,
                  'basic_salary' => $basicSalary,
                  'gross_pay' => $grossSalary,
                  'sss_deduction' => $sssDeduction,
                  'philhealth_deduction' => $philhealthDeduction,
                  'pagibig_deduction' => $pagibigDeduction,
                  'tax_deduction' => $taxDeduction,
                  'cash_advance' => 0,
                  'loan' => 0,
                  'vat' => 0,
                  'other_deductions' => 0,
                  'short' => 0,
                  'total_deductions' => $totalDeductions,
                  'net_pay' => $netPay,
                  'daily_rate' => $dailyRate,
                  'status' => 'generated',
                  'ytd_earnings' => 0,
                  'thirteenth_month_pay' => 0,
                  'created_at' => now(),
                  'updated_at' => now(),
              ];
              
              Log::info('Creating payroll entry with data:', $payrollData);
              
              // Create the entry
              $payroll = new PayrollEntry();
              foreach ($payrollData as $key => $value) {
                  $payroll->$key = $value;
              }
              
              $saved = $payroll->save();
              
              if (!$saved) {
                  throw new \Exception('Failed to save payroll entry for employee ' . $employee->employee_number);
              }
              
              Log::info('Created payroll entry ID: ' . $payroll->id);
              $createdCount++;
          }

          DB::commit();
          Log::info('Payroll generation completed. Created: ' . $createdCount . ', Skipped: ' . $skippedCount);
          
          return redirect()->route('payroll.index')
              ->with('success', 'Payroll generated successfully for the period. Created: ' . $createdCount . ', Skipped: ' . $skippedCount);
      } catch (Throwable $e) {
          DB::rollback();
          Log::error('Payroll generation failed: ' . $e->getMessage());
          Log::error('Stack trace: ' . $e->getTraceAsString());
          return redirect()->back()
              ->with('error', 'Payroll generation failed: ' . $e->getMessage());
      }
  }

  public function listPeriods(Request $request)
  {
      try {
          $query = PayrollPeriod::orderBy('period_start', 'desc');
          
          // Apply search filter if provided
          if ($request->has('search') && !empty($request->search)) {
              $search = $request->search;
              $query->where(function($q) use ($search) {
                  $q->where('week_id', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
              });
          }
          
          // Apply status filter if provided
          if ($request->has('status') && !empty($request->status)) {
              $query->where('status', $request->status);
          }
          
          $perPage = $request->input('per_page', 10); // Default 10 items per page
          $periods = $query->paginate($perPage);
          
          return response()->json([
              'success' => true,
              'periods' => $periods
          ]);
      } catch (\Exception $e) {
          Log::error('Error listing payroll periods: ' . $e->getMessage());
          return response()->json([
              'success' => false,
              'message' => 'Failed to fetch payroll periods'
          ], 500);
      }
  }

  public function show($id) {
      $payroll = PayrollEntry::with(['employee', 'payrollPeriod'])->findOrFail($id);

      $attendance = DB::table('attendance')
              ->select(
                  'id',
                  'employee_number',
                  'work_date',
                  'daily_rate',
                  'adjustment',
                  'status'
              )
              ->where('employee_number', $payroll->employee_number)
              ->get();

      return Inertia::render('Payroll/Show', [
              'payroll' => $payroll,
              'attendance' => $attendance
          ]);
  }

  public function destroy($id) {
      try {
          $payroll = PayrollEntry::findOrFail($id);
          $payroll->delete();

          return redirect()->back()->with('success', 'Payroll deleted successfully!');
      } catch (\Exception $e) {
          Log::error('Error deleting payroll: ' . $e->getMessage());
          return redirect()->back()->with('error', 'Failed to delete payroll.');
      }
  }

  public function generateFromAttendance(Request $request)
  {
      try {
          Log::info('Generating payroll from attendance with request data:', $request->all());
          
          $validated = $request->validate([
              'payroll_period_id' => 'required|exists:payroll_periods,id',
              'week_id' => 'required|exists:payroll_periods,week_id',
              'include_daily_rates' => 'boolean',
              'respect_attendance_status' => 'boolean',
              'overwrite_existing' => 'boolean',
          ]);

          Log::info('Validated data:', $validated);
          
          $payrollPeriod = PayrollPeriod::where('week_id', $validated['week_id'])->firstOrFail();
          $overwriteExisting = $validated['overwrite_existing'] ?? false;

          if (!$overwriteExisting && PayrollEntry::where('week_id', $validated['week_id'])->exists()) {
              Log::warning('Payroll records already exist for this period and overwrite_existing is false');
              return response()->json([
                  'message' => 'Payroll records already exist for this period. Set overwrite_existing to true to replace them.',
              ], 422);
          }

          if ($overwriteExisting) {
              $deletedCount = PayrollEntry::where('week_id', $validated['week_id'])->delete();
              Log::info("Deleted {$deletedCount} existing payroll entries for week_id: {$validated['week_id']}");
          }

          $employees = Employee::all();
          Log::info("Found {$employees->count()} employees");
          
          $attendanceRecords = DB::table('attendance')
              ->whereBetween('work_date', [$payrollPeriod->period_start, $payrollPeriod->period_end])
              ->get();
          Log::info("Found {$attendanceRecords->count()} attendance records in the period");

          $attendanceByEmployee = [];
          foreach ($attendanceRecords as $record) {
              $attendanceByEmployee[$record->employee_number][] = $record;
          }

          $payrollRecords = [];
          foreach ($employees as $employee) {
              $employeeAttendance = $attendanceByEmployee[$employee->employee_number] ?? [];
              $grossPay = 0;
              $dailyRates = [];

              if (count($employeeAttendance) > 0 && ($validated['respect_attendance_status'] ?? true)) {
                  foreach ($employeeAttendance as $record) {
                      $status = $record->status;
                      $dailyRate = $record->daily_rate ?? $employee->daily_rate;
                      $adjustment = $record->adjustment ?? 0;

                      $amount = match (strtolower($status)) {
                          'present' => $dailyRate,
                          'half day' => $dailyRate / 2,
                          'absent', 'day off' => 0,
                          default => $dailyRate,
                      };

                      $grossPay += $amount + $adjustment;

                      if ($validated['include_daily_rates'] ?? false) {
                          $dailyRates[] = [
                              'date' => $record->work_date,
                              'amount' => $dailyRate,
                              'status' => $status,
                              'adjustment' => $adjustment
                          ];
                      }
                  }
              } else {
                  $startDate = new \DateTime($payrollPeriod->period_start);
                  $endDate = new \DateTime($payrollPeriod->period_end);
                  $days = $startDate->diff($endDate)->days + 1;
                  $grossPay = $employee->daily_rate * $days;
              }

              $sssDeduction = $this->calculateSSS($grossPay);
              $philhealthDeduction = $this->calculatePhilhealth($grossPay);
              $pagibigDeduction = $this->calculatePagibig($grossPay);
              $taxDeduction = $this->calculateTax($grossPay);

              $totalDeductions = $sssDeduction + $philhealthDeduction + $pagibigDeduction + $taxDeduction;
              $netPay = max(0, $grossPay - $totalDeductions);

              $payrollRecords[] = [
                  'employee_number' => $employee->employee_number,
                  'week_id' => $payrollPeriod->week_id,
                  'basic_salary' => $employee->monthly_salary,
                  'gross_pay' => $grossPay,
                  'sss_deduction' => $sssDeduction,
                  'philhealth_deduction' => $philhealthDeduction,
                  'pagibig_deduction' => $pagibigDeduction,
                  'tax_deduction' => $taxDeduction,
                  'loan' => 0,
                  'other_deductions' => 0,
                  'short' => 0,
                  'total_deductions' => $totalDeductions,
                  'net_pay' => $netPay,
                  'daily_rate' => $employee->daily_rate,
                  'status' => 'generated',
                  'ytd_earnings' => 0,
                  'thirteenth_month_pay' => 0,
                  'created_at' => now(),
                  'updated_at' => now(),
              ];
          }

          Log::info("Prepared " . count($payrollRecords) . " payroll records for insertion");

          if (!empty($payrollRecords)) {
              try {
                  DB::beginTransaction();
                  PayrollEntry::insert($payrollRecords);
                  DB::commit();
                  Log::info("Successfully inserted " . count($payrollRecords) . " payroll records");
                  return redirect()->back()->with('success', 'Payroll generated successfully!');
              } catch (\Exception $e) {
                  DB::rollBack();
                  Log::error("Failed to insert payroll records: " . $e->getMessage());
                  return redirect()->back()->with('error', 'Failed to generate payroll: ' . $e->getMessage());
              }
          }

          return redirect()->back()->with('success', 'Payroll generated successfully!');
      } catch (\Exception $e) {
          Log::error('Payroll Generation Error: ' . $e->getMessage());
          Log::error('Stack trace: ' . $e->getTraceAsString());
          return redirect()->back()->with('error', 'Failed to generate payroll: ' . $e->getMessage());
      }
  }

  // Payroll Period Management
  public function createPeriod(Request $request)
  {
      DB::beginTransaction();
      
      try {
          $validated = $request->validate([
              'week_id' => 'required|integer',
              'period_start' => 'required|date',
              'period_end' => 'required|date|after_or_equal:period_start',
              'payment_date' => 'required|date|after_or_equal:period_end',
              'status' => 'required|string',
          ]);

          // Create the payroll period with all required fields
          $payrollPeriod = PayrollPeriod::create([
              'week_id' => $validated['week_id'],
              'period_start' => $validated['period_start'],
              'period_end' => $validated['period_end'],
              'payment_date' => $validated['payment_date'],
              'status' => $validated['status'],
              'description' => $request->description ?? null,
          ]);

          DB::commit();

          if ($request->wantsJson()) {
              return response()->json([
                  'success' => true,
                  'period' => $payrollPeriod,
                  'message' => 'Payroll period created successfully'
              ]);
          }

          return redirect()->back()->with('success', 'Payroll period created successfully!');
      } catch (\Exception $e) {
          DB::rollBack();
          Log::error('Error creating payroll period: ' . $e->getMessage());
          
          if ($request->wantsJson()) {
              return response()->json([
                  'success' => false,
                  'message' => 'Failed to create payroll period: ' . $e->getMessage()
              ], 500);
          }

          return redirect()->back()->with('error', 'Failed to create payroll period: ' . $e->getMessage());
      }
  }

  public function updatePeriod(Request $request, $id)
  {
      DB::beginTransaction();

      try {
          $validated = $request->validate([
              'week_id' => 'required|integer',
              'period_start' => 'required|date',
              'period_end' => 'required|date|after_or_equal:period_start',
              'payment_date' => 'required|date|after_or_equal:period_end',
              'status' => 'required|string',
          ]);

          // Find the payroll period by ID
          $payrollPeriod = PayrollPeriod::findOrFail($id);
          
          // Log the data being updated for debugging
          Log::info('Updating payroll period', [
              'id' => $id,
              'data' => $validated,
              'original' => $payrollPeriod->toArray()
          ]);
      
          // Update with all required fields
          $updated = $payrollPeriod->update([
              'week_id' => $validated['week_id'],
              'period_start' => $validated['period_start'],
              'period_end' => $validated['period_end'],
              'payment_date' => $validated['payment_date'],
              'status' => $validated['status'],
              'description' => $request->description ?? $payrollPeriod->description,
          ]);
      
          // Log the result of the update operation
          Log::info('Update result', ['updated' => $updated, 'after' => $payrollPeriod->fresh()->toArray()]);

          DB::commit();

          if ($request->wantsJson()) {
              return response()->json([
                  'success' => true,
                  'period' => $payrollPeriod->fresh(),
                  'message' => 'Payroll period updated successfully'
              ]);
          }

          return redirect()->back()->with('success', 'Payroll period updated successfully!');
      } catch (\Exception $e) {
          DB::rollBack();
          Log::error('Error updating payroll period: ' . $e->getMessage());
          Log::error('Stack trace: ' . $e->getTraceAsString());
      
          if ($request->wantsJson()) {
              return response()->json([
                  'success' => false,
                  'message' => 'Failed to update payroll period: ' . $e->getMessage()
              ], 500);
          }

          return redirect()->back()->with('error', 'Failed to update payroll period: ' . $e->getMessage());
      }
  }
  
  public function destroyPeriod(Request $request, $id)
  {
      DB::beginTransaction();
  
      try {
          $payrollPeriod = PayrollPeriod::findOrFail($id);
      
          // Check if there are any payroll entries associated with this period
          $hasEntries = PayrollEntry::where('week_id', $payrollPeriod->week_id)->exists();
      
          if ($hasEntries) {
              // Optionally, delete associated entries or prevent deletion
              if ($request->input('force_delete', false)) {
                  PayrollEntry::where('week_id', $payrollPeriod->week_id)->delete();
                  Log::info("Deleted associated payroll entries for period {$id} with week_id {$payrollPeriod->week_id}");
              } else {
                  throw new \Exception('Cannot delete period with associated payroll entries. Set force_delete=true to override.');
              }
          }
      
          $deleted = $payrollPeriod->delete();
          Log::info("Deleted payroll period {$id}: " . ($deleted ? 'success' : 'failed'));
      
          DB::commit();
      
          if ($request->wantsJson()) {
              return response()->json([
                  'success' => true,
                  'message' => 'Payroll period deleted successfully'
              ]);
          }
      
          return redirect()->back()->with('success', 'Payroll period deleted successfully!');
      } catch (\Exception $e) {
          DB::rollBack();
          Log::error('Error deleting payroll period: ' . $e->getMessage());
      
          if ($request->wantsJson()) {
              return response()->json([
                  'success' => false,
                  'message' => 'Failed to delete payroll period: ' . $e->getMessage()
              ], 500);
          }
      
          return redirect()->back()->with('error', 'Failed to delete payroll period: ' . $e->getMessage());
      }
  }

  // Payslip and Attendance Methods
  public function printPayslip($id) {
      try {
          $payroll = PayrollEntry::with(['employee', 'payrollPeriod'])->findOrFail($id);
          $payrollPeriod = $payroll->payrollPeriod;
          
          if (!$payrollPeriod) {
              return redirect()->back()->with('error', 'Payroll period not found');
          }
          
          $startDate = new \DateTime($payrollPeriod->period_start);
          $endDate = new \DateTime($payrollPeriod->period_end);
          $formattedStartDate = $startDate->format('Y-m-d');
          $formattedEndDate = $endDate->format('Y-m-d');

          $attendanceRecords = Attendance::where('employee_number', $payroll->employee_number)
              ->whereBetween('work_date', [$formattedStartDate, $formattedEndDate])
              ->orderBy('work_date')
              ->get();
              
          if ($attendanceRecords->isEmpty() && $payroll->daily_rates) {
              $dailyRates = is_string($payroll->daily_rates) 
                  ? json_decode($payroll->daily_rates, true) 
                  : $payroll->daily_rates;
                  
              if (is_array($dailyRates)) {
                  foreach ($dailyRates as $rate) {
                      $date = $rate['date'] ?? $rate['work_date'] ?? null;
                      if ($date) {
                          $attendanceRecords[] = new Attendance([
                              'id' => rand(1000, 9999),
                              'employee_number' => $payroll->employee_number,
                              'work_date' => $date,
                              'daily_rate' => $rate['daily_rate'] ?? $payroll->employee->daily_rate ?? 0,
                              'adjustment' => $rate['adjustment'] ?? 0,
                              'status' => $rate['status'] ?? 'Present',
                          ]);
                      }
                  }
              }
          }

          return Inertia::render('Payroll/PrintPayslip', [
              'payroll' => $payroll,
              'attendances' => $attendanceRecords,
              'period' => [
                  'id' => $payrollPeriod->id,
                  'period_start' => $formattedStartDate,
                  'period_end' => $formattedEndDate,
                  'week_id' => $payrollPeriod->week_id ?? null,
              ],
          ]);
      } catch (\Exception $e) {
          Log::error('Error preparing payslip data: ' . $e->getMessage());
          return back()->with('error', 'Failed to prepare payslip data: ' . $e->getMessage());
      }
  }

  public function fetchAttendanceForPayslip(Request $request)
  {
      try {
          $validated = $request->validate([
              'employee_number' => 'required',
              'week_id' => 'required|exists:payroll_periods,id',
              'start_date' => 'nullable|date',
              'end_date' => 'nullable|date',
          ]);

          $payrollPeriod = PayrollPeriod::findOrFail($validated['week_id']);
          $startDate = $validated['start_date'] ?? $payrollPeriod->period_start;
          $endDate = $validated['end_date'] ?? $payrollPeriod->period_end;
          
          $startDateTime = new \DateTime($startDate);
          $endDateTime = new \DateTime($endDate);
          
          $attendanceRecords = Attendance::where('employee_number', $validated['employee_number'])
              ->whereBetween('work_date', [$startDate, $endDate])
              ->orderBy('work_date')
              ->get();
              
          if ($attendanceRecords->isEmpty()) {
              $employee = Employee::where('employee_number', $validated['employee_number'])->first();
              
              if ($employee) {
                  $attendanceRecords = $this->generateDefaultAttendanceRecords(
                      $employee,
                      $startDate,
                      $endDate
                  );
              }
          }

          return response()->json([
              'success' => true,
              'attendances' => $attendanceRecords,
              'period' => [
                  'id' => $payrollPeriod->id,
                  'period_start' => $startDate,
                  'period_end' => $endDate,
                  'week_id' => $payrollPeriod->week_id ?? null,
              ],
          ]);
      } catch (\Exception $e) {
          Log::error('Error fetching attendance for payslip: ' . $e->getMessage());
          return response()->json([
              'success' => false,
              'message' => 'Failed to fetch attendance records: ' . $e->getMessage(),
          ], 500);
      }
  }

  public function generatePayslip($employeeId) {
      $employee = Employee::findOrFail($employeeId);
      $pdf = Pdf::loadView('payslip', compact('employee'))->setPaper('A4', 'portrait');

      return $pdf->stream("payslip.pdf");
  }

  // Helper Methods
  private function generateDefaultAttendanceRecords($employee, $startDate, $endDate) {
      $records = [];
      $currentDate = new \DateTime($startDate);
      $endDateTime = new \DateTime($endDate);
      $id = 10000;

      while ($currentDate <= $endDateTime) {
          $dateStr = $currentDate->format('Y-m-d');
          $status = "Present";

          $records[] = [
              'id' => $id++,
              'employee_number' => $employee->employee_number,
              'work_date' => $dateStr,
              'daily_rate' => $employee->daily_rate,
              'adjustment' => 0,
              'status' => $status,
              'time_in' => '08:00:00',
              'time_out' => '17:00:00',
              'full_name' => $employee->full_name,
          ];

          $currentDate->modify('+1 day');
      }

      return collect($records);
  }

  // Deduction Calculations
  public function calculateSSS($grossPay) {
      // Placeholder for SSS calculation logic
      return 500;
  }

  public function calculatePhilhealth($grossPay) {
      // Placeholder for PhilHealth calculation logic
      return 200;
  }

  public function calculatePagibig($grossPay) {
      // Placeholder for Pag-IBIG calculation logic
      return 100;
  }

  public function calculateTax($grossPay) {
      // Placeholder for Tax calculation logic
      return 300;
  }
}

