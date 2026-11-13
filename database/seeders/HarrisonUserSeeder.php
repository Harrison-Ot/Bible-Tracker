<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use LogicException;

class HarrisonUserSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            throw new LogicException('The local Harrison user seeder cannot run in production.');
        }

        User::query()->updateOrCreate(
            ['email' => 'harrisonopondo4696@gmail.com'],
            [
                'name' => 'Harrison Opondo',
                'password' => 'password',
            ],
        );
    }
}
