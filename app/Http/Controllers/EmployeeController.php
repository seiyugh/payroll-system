<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('perPage', 10);
        $page = $request->input('page', 1);
        $search = $request->input('search', '');
        $position = $request->input('position', '');
        $department = $request->input('department', '');
        $status = $request->input('status', '');
        $sort = $request->input('sort', 'employee_number');
        $direction = $request->input('direction', 'asc');
        
        $query = Employee::query();
        
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('employee_number', 'like', "%{$search}%");
            });
        }
        
        if (!empty($position)) {
            $query->where('position', $position);
        }
        
        if (!empty($department)) {
            $query->where('department', $department);
        }
        
        if (!empty($status)) {
            $query->where('employment_status', $status);
        }
        
        $query->orderBy($sort, $direction);
        $employees = $query->paginate($perPage);
        
        // Calculate stats from all employees, not just the paginated ones
        $allEmployees = Employee::all();
        $stats = [
            'totalEmployees' => $allEmployees->count(),
            'regularCount' => $allEmployees->where('employment_status', 'Regular')->count(),
            'probationaryCount' => $allEmployees->where('employment_status', 'Probationary')->count(),
            'departmentCount' => $allEmployees->pluck('department')->unique()->count(),
            'maleCount' => $allEmployees->where('gender', 'Male')->count(),
            'femaleCount' => $allEmployees->where('gender', 'Female')->count(),
            'averageAge' => round($allEmployees->avg('age'), 1),
            'averageYearsOfService' => round($allEmployees->avg('years_of_service'), 1),
            'totalDailyRate' => $allEmployees->sum('daily_rate')
        ];
        
        $departments = Employee::select('department')->distinct()->pluck('department');
        $positions = Employee::select('position')->distinct()->pluck('position');
        
        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'stats' => $stats,
            'departments' => $departments,
            'positions' => $positions,
            'filters' => $request->only(['search', 'position', 'department', 'status'])
        ]);
    }

    public function create()
    {
        return Inertia::render('Employees/Create', [
            'departments' => Employee::select('department')->distinct()->pluck('department'),
            'positions' => Employee::select('position')->distinct()->pluck('position')
        ]);
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
            'assigned_area' => 'nullable',
            'date_hired' => 'required|date',
            'employment_status' => 'required|in:Regular,Probationary,Project-Based',
            'daily_rate' => 'required|numeric',
            'civil_status' => 'required',
            'gender' => 'required',
            'birthdate' => 'required|date',
            'birth_place' => 'nullable',
            'age' => 'required|integer|min:18',
            'contacts' => 'required',
            'sss_no' => 'nullable',
            'tin_no' => 'nullable',
            'philhealth_no' => 'nullable',
            'pagibig_no' => 'nullable',
            'emergency_contact_name' => 'required',
            'emergency_contact_mobile' => 'required',
            'government_id' => 'boolean',
            'type_of_id' => 'nullable|in:PhilID,DL,Phi-health,SSS,UMID,POSTAL,Passport,Voters,TIN,D1',
            'clearance' => 'nullable|in:BARANGAY Clearance,NBI Clearance,Police Clearance',
            'contract' => 'required|in:SIGNED,NOT YET,REVIEW'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $data = $request->all();
        $data['years_of_service'] = now()->diffInYears($data['date_hired']);

        // Map form field names to database field names
        $fieldMappings = [
            'birthplace' => 'birth_place',
            'resignation_termination_date' => 'date_terminated_resigned',
        ];

        // Apply field mappings
        foreach ($fieldMappings as $formField => $dbField) {
            if (isset($data[$formField])) {
                $data[$dbField] = $data[$formField];
            }
        }

        Employee::create($data);

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
            'employee' => $employee,
            'departments' => Employee::select('department')->distinct()->pluck('department'),
            'positions' => Employee::select('position')->distinct()->pluck('position')
        ]);
    }

    // Fix the update method to ensure years_of_service is properly calculated and saved
    public function update(Request $request, $id)
    {
        // Find the employee manually since route model binding isn't working
        $employee = Employee::find($id);
        
        if (!$employee) {
            Log::error('Employee not found for update', ['id' => $id]);
            return redirect()->back()->with('error', 'Employee not found');
        }

        Log::info('Starting employee update', [
            'employee_id' => $employee->id,
            'employee_number' => $employee->employee_number,
            'submitted_employee_number' => $request->input('employee_number')
        ]);

        // Using Rule::unique to explicitly ignore the current employee
        $validator = Validator::make($request->all(), [
            'employee_number' => [
                'required',
                Rule::unique('employees')->ignore($employee->id)
            ],
            'full_name' => 'required',
            'last_name' => 'required',
            'first_name' => 'required',
            'address' => 'required',
            'position' => 'required',
            'department' => 'required',
            'assigned_area' => 'nullable',
            'date_hired' => 'required|date',
            'employment_status' => 'required|in:Regular,Probationary,Project-Based',
            'daily_rate' => 'required|numeric',
            'civil_status' => 'required',
            'gender' => 'required',
            'birthdate' => 'required|date',
            'age' => 'required|integer|min:18',
            'contacts' => 'required',
            'sss_no' => 'nullable',
            'tin_no' => 'nullable',
            'philhealth_no' => 'nullable',
            'pagibig_no' => 'nullable',
            'emergency_contact_name' => 'required',
            'emergency_contact_mobile' => 'required',
            'government_id' => 'boolean',
            'type_of_id' => 'nullable|in:PhilID,DL,Phi-health,SSS,UMID,POSTAL,Passport,Voters,TIN,D1',
            'clearance' => 'nullable|in:BARANGAY Clearance,NBI Clearance,Police Clearance',
            'contract' => 'required|in:SIGNED,NOT YET,REVIEW'
        ]);

        if ($validator->fails()) {
            Log::error('Employee update validation failed', [
                'employee_id' => $employee->id,
                'errors' => $validator->errors()->toArray()
            ]);
            
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $data = $request->all();
        
        // Always recalculate years_of_service based on date_hired
        if (isset($data['date_hired'])) {
            $hireDate = new \DateTime($data['date_hired']);
            $now = new \DateTime();
            $interval = $hireDate->diff($now);
            $data['years_of_service'] = $interval->y;
        } else {
            // If no date_hired is provided, use the existing one
            $hireDate = new \DateTime($employee->date_hired);
            $now = new \DateTime();
            $interval = $hireDate->diff($now);
            $data['years_of_service'] = $interval->y;
        }
        
        Log::info('Years of service calculated', [
            'employee_id' => $employee->id,
            'date_hired' => $data['date_hired'] ?? $employee->date_hired,
            'years_of_service' => $data['years_of_service']
        ]);

        // Map form field names to database field names
        $fieldMappings = [
            'birthplace' => 'birth_place',
            'resignation_termination_date' => 'date_terminated_resigned',
        ];

        // Apply field mappings
        foreach ($fieldMappings as $formField => $dbField) {
            if (isset($data[$formField])) {
                $data[$dbField] = $data[$formField];
                // Keep the original field too, in case it's needed elsewhere
            }
        }

        // Log the data being sent to the database
        Log::info('Employee update data prepared', [
            'employee_id' => $employee->id,
            'data' => $data
        ]);

        try {
            // Get the fillable fields from the model
            $fillableFields = $employee->getFillable();
            
            // Filter the data to only include fillable fields
            $filteredData = array_intersect_key($data, array_flip($fillableFields));
            
            Log::info('Filtered data for update', [
                'employee_id' => $employee->id,
                'filtered_data' => $filteredData
            ]);

            // Update only the fillable fields
            $employee->update($filteredData);
            
            Log::info('Employee updated successfully', ['employee_id' => $employee->id]);
            return redirect()->route('employees.index')->with('success', 'Employee updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating employee', [
                'employee_id' => $employee->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', 'Error updating employee: ' . $e->getMessage());
        }
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();
        return redirect()->route('employees.index')->with('success', 'Employee deleted successfully');
    }

    public function bulkStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        $file = $request->file('file');
        $data = array_map('str_getcsv', file($file->getPathname()));

        if (empty($data) || count($data) <= 1) {
            return redirect()->back()->with('error', 'CSV file is empty or not formatted properly.');
        }

        $header = array_map('trim', $data[0]);
        $rows = array_slice($data, 1);

        $employees = [];
        foreach ($rows as $row) {
            if (count($row) < count($header)) {
                continue;
            }

            $employeeData = array_combine($header, $row);
            
            if (empty($employeeData['employee_number'])) {
                continue;
            }

            // Map CSV fields to database fields
            $mappedData = [
                'employee_number' => $employeeData['employee_number'] ?? '',
                'full_name' => $employeeData['full_name'] ?? '',
                'last_name' => $employeeData['last_name'] ?? '',
                'first_name' => $employeeData['first_name'] ?? '',
                'middle_name' => $employeeData['middle_name'] ?? null,
                'id_no' => $employeeData['id_no'] ?? null,
                'gender' => $employeeData['gender'] ?? 'Male',
                'civil_status' => $employeeData['civil_status'] ?? 'Single',
                'position' => $employeeData['position'] ?? '',
                'department' => $employeeData['department'] ?? '',
                'assigned_area' => $employeeData['assigned_area'] ?? null,
                'address' => $employeeData['address'] ?? '',
                'age' => $employeeData['age'] ?? 0,
                'birthdate' => $employeeData['birthdate'] ?? now()->format('Y-m-d'),
                'birth_place' => $employeeData['birthplace'] ?? $employeeData['birth_place'] ?? null,
                'contacts' => $employeeData['contacts'] ?? '',
                'date_hired' => $employeeData['date_hired'] ?? now()->format('Y-m-d'),
                'years_of_service' => $employeeData['years_of_service'] ?? 0,
                'employment_status' => $employeeData['employment_status'] ?? 'Probationary',
                'daily_rate' => $employeeData['daily_rate'] ?? 0,
                'date_terminated_resigned' => $employeeData['date_terminated_resigned'] ?? $employeeData['resignation_termination_date'] ?? null,
                'sss_no' => $employeeData['sss_no'] ?? null,
                'tin_no' => $employeeData['tin_no'] ?? null,
                'philhealth_no' => $employeeData['philhealth_no'] ?? null,
                'pagibig_no' => $employeeData['pagibig_no'] ?? null,
                'ub_account' => $employeeData['ub_account'] ?? null,
                'emergency_contact_name' => $employeeData['emergency_contact_name'] ?? '',
                'emergency_contact_mobile' => $employeeData['emergency_contact_mobile'] ?? '',
                'email' => $employeeData['email'] ?? null,
                'resume' => isset($employeeData['resume']) ? (bool)$employeeData['resume'] : false,
                'id_status' => $employeeData['id_status'] ?? 'incomplete',
                'government_id' => isset($employeeData['government_id']) ? (bool)$employeeData['government_id'] : false,
                'type_of_id' => $employeeData['type_of_id'] ?? null,
                'clearance' => $employeeData['clearance'] ?? null,
                'id_number' => $employeeData['id_number'] ?? null,
                'staff_house' => isset($employeeData['staff_house']) ? (bool)$employeeData['staff_house'] : false,
                'birth_certificate' => isset($employeeData['birth_certificate']) ? (bool)$employeeData['birth_certificate'] : false,
                'marriage_certificate' => isset($employeeData['marriage_certificate']) ? (bool)$employeeData['marriage_certificate'] : false,
                'tor' => isset($employeeData['tor']) ? (bool)$employeeData['tor'] : false,
                'diploma_hs_college' => isset($employeeData['diploma_hs_college']) ? (bool)$employeeData['diploma_hs_college'] : false,
                'contract' => $employeeData['contract'] ?? 'NOT YET',
                'performance_evaluation' => isset($employeeData['performance_evaluation']) ? (bool)$employeeData['performance_evaluation'] : false,
                'medical_cert' => isset($employeeData['medical_cert']) ? (bool)$employeeData['medical_cert'] : false,
                'remarks' => $employeeData['remarks'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $employees[] = $mappedData;
        }

        if (!empty($employees)) {
            Employee::insert($employees);
            return redirect()->route('employees.index')->with('success', count($employees) . ' employees imported successfully.');
        }

        return redirect()->back()->with('error', 'No valid employees found in the CSV.');
    }
}

