<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reading_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // "Bible in a Year"
            $table->string('slug')->unique();
            $table->unsignedSmallInteger('duration_days');
            $table->timestamps();
        });

        Schema::create('plan_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reading_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('day_number');
            $table->string('book');
            $table->string('chapters'); // "1-3" or "1", kept as a string to allow ranges
            $table->timestamps();
        });

        Schema::create('user_plan_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reading_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('current_day')->default(1);
            $table->date('started_on');
            $table->timestamps();

            $table->unique(['user_id', 'reading_plan_id']); // one active run per plan per user
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_plan_progress');
        Schema::dropIfExists('plan_days');
        Schema::dropIfExists('reading_plans');
    }
};