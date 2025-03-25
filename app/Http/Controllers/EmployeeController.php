<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::all();
        
        return Inertia::render('Employees/Index', [
            'employees' => $employees
        ]);
    }

    public function create()
    {
        return Inertia::render('Employees/Create');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_number' => 'required|unique:employees,employee_number',
            'full_name' => 'required',
            'last_name' => 'required',
            'first_name' => 'required',
            'address' => 'required',
            'position' => 'required',
            'department' => 'required',
            'date_hired' => 'required|date',
            'years_of_service' => 'required|integer',
            'employment_status' => 'required',
            'daily_rate' => 'required|integer',
            'civil_status' => 'required',
            'gender' => 'required',
            'birthdate' => 'required|date',
            'age' => 'required|integer',
            'contacts' => 'required',
            'emergency_contact_name' => 'required',
            'emergency_contact_mobile' => 'required',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        Employee::create($request->all());

        return redirect()->route('employees.index')->with('success', 'Employee created successfully');
    }

    public function show(Employee $employee)
    {
        return Inertia::render('Employees/Show', [
            'employee' => $employee
        ]);
    }

    public function edit(Employee $employee)
    {
        return Inertia::render('Employees/Edit', [
            'employee' => $employee
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $validator = Validator::make($request->all(), [
            'employee_number' => 'required|unique:employees,employee_number,' . $employee->id,
            'full_name' => 'required',
            'last_name' => 'required',
            'first_name' => 'required',
            'address' => 'required',
            'position' => 'required',
            'department' => 'required',
            'date_hired' => 'required|date',
            'years_of_service' => 'required|integer',
            'employment_status' => 'required',
            'daily_rate' => 'required|integer',
            'civil_status' => 'required',
            'gender' => 'required',
            'birthdate' => 'required|date',
            'age' => 'required|integer',
            'contacts' => 'required',
            'emergency_contact_name' => 'required',
            'emergency_contact_mobile' => 'required',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $employee->update($request->all());

        return redirect()->route('employees.index')->with('success', 'Employee updated successfully');
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();

        return redirect()->route('employees.index')->with('success', 'Employee deleted successfully');
    }

    public function bulkStore(Request $request)
    {
        Log::info('Bulk store method triggered'); // Log that the method is called
    
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt',
        ]);
    
        if ($validator->fails()) {
            Log::error('Validation failed', ['errors' => $validator->errors()]);
            return redirect()->back()->withErrors($validator);
        }
    
        $file = $request->file('file');
        Log::info('File received', ['filename' => $file->getClientOriginalName()]);
    
        $data = array_map('str_getcsv', file($file->getPathname()));
    
        if (empty($data) || count($data) <= 1) {
            Log::error('CSV file is empty or not formatted properly');
            return redirect()->back()->with('error', 'CSV file is empty or not formatted properly.');
        }
    
        $header = array_map('trim', $data[0]); // Get the CSV headers
        $rows = array_slice($data, 1); // Remove header row
    
        $employees = [];
        foreach ($rows as $row) {
            if (count($row) < count($header)) {
                Log::warning('Skipping incomplete row', ['row' => $row]);
                continue;
            }
    
            $employeeData = array_combine($header, $row);
            Log::info('Processing row', ['data' => $employeeData]);
    
            if (empty($employeeData['employee_number']) || empty($employeeData['full_name']) || empty($employeeData['position'])) {
                Log::warning('Skipping row due to missing required fields', ['data' => $employeeData]);
                continue;
            }
    
            $employees[] = [
                'employee_number' => $employeeData['employee_number'],
                'full_name' => $employeeData['full_name'],
                'last_name' => $employeeData['last_name'] ?? null,
                'first_name' => $employeeData['first_name'] ?? null,
                'middle_name' => $employeeData['middle_name'] ?? null,
                'address' => $employeeData['address'] ?? null,
                'position' => $employeeData['position'],
                'department' => $employeeData['department'] ?? null,
                'assigned_area' => $employeeData['assigned_area'] ?? null,
                'date_hired' => $employeeData['date_hired'] ?? null,
                'years_of_service' => $employeeData['years_of_service'] ?? null,
                'employment_status' => $employeeData['employment_status'] ?? 'Probationary',
                'date_of_regularization' => $employeeData['date_of_regularization'] ?? null,
                'status_201' => 'incomplete',
                'resignation_termination_date' => $employeeData['resignation_termination_date'] ?? null,
                'daily_rate' => $employeeData['daily_rate'] ?? 1,
                'civil_status' => $employeeData['civil_status'] ?? 'Single',
                'gender' => $employeeData['gender'] ?? 'Male',
                'birthdate' => $employeeData['birthdate'] ?? null,
                'birthplace' => $employeeData['birthplace'] ?? null,
                'age' => $employeeData['age'] ?? null,
                'contacts' => $employeeData['contacts'] ?? null,
                'id_status' => 'incomplete',
                'sss_no' => $employeeData['sss_no'] ?? null,
                'tin_no' => $employeeData['tin_no'] ?? null,
                'philhealth_no' => $employeeData['philhealth_no'] ?? null,
                'pagibig_no' => $employeeData['pagibig_no'] ?? null,
                'emergency_contact_name' => $employeeData['emergency_contact_name'] ?? null,
                'emergency_contact_mobile' => $employeeData['emergency_contact_mobile'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
    
        if (empty($employees)) {
            Log::error('No valid employees found in the CSV.');
            return redirect()->back()->with('error', 'No valid employees found in the CSV.');
        }
    
        Employee::insert($employees);
        Log::info('Employees inserted into database', ['count' => count($employees)]);
    
        return redirect()->route('employees.index')->with('success', 'Employees imported successfully.');
    }
    
}

