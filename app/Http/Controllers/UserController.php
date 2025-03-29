<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index()
    {
        $users = User::all();

        return Inertia::render('Settings/Users', [
            'users' => $users
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'employee_number' => 'required|string|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'user_type' => 'required|string|in:admin,user',
        ]);

        $user = User::create([
            'full_name' => $request->full_name,
            'username' => $request->username,
            'employee_number' => $request->employee_number,
            'password_hash' => Hash::make($request->password), // ✅ Hashing correctly
            'user_type' => $request->user_type,
        ]);

        return redirect()->back()->with('success', 'User created successfully');
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'user_type' => 'required|string|in:admin,user',
        ]);

        // Prevent updating employee_number to maintain data integrity
        $user->update([
            'full_name' => $request->full_name,
            'username' => $request->username,
            'user_type' => $request->user_type,
        ]);

        // If password is provided, update it
        if ($request->filled('password')) {
            $request->validate([
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            $user->update([
                'password_hash' => Hash::make($request->password),
            ]);
        }

        return redirect()->back()->with('success', 'User updated successfully');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        // Prevent deleting your own account
        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'You cannot delete your own account');
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully');
    }
}
