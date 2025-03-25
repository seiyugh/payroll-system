<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'employee_number',
        'full_name',
        'username',
        'user_type',
        'password_hash',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected $casts = [
        'password_hash' => 'string',
    ];

    /**
     * Define the one-to-one relationship with the Employee model.
     */
public function employee()
{
    return $this->hasOne(Employee::class);
}

}
