<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reading_plans', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('description', 200)->nullable();
        });
        Schema::table('user_plan_progress', function (Blueprint $table) {
            $table->boolean('is_paused')->default(false);
            $table->json('reading_days')->nullable();
            $table->date('next_read_on')->nullable();
            $table->timestamp('completed_at')->nullable();
        });
        // Existing plans keep their reading position and begin their new calendar today.
        DB::table('user_plan_progress')->update(['next_read_on' => today()->toDateString()]);
        Schema::create('reading_plan_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_plan_progress_id')->constrained('user_plan_progress')->cascadeOnDelete();
            $table->unsignedSmallInteger('day_number');
            $table->timestamp('completed_at');
            $table->unique(['user_plan_progress_id', 'day_number']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('weekly_chapter_goal')->default(7);
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('weekly_chapter_goal'));
        Schema::dropIfExists('reading_plan_completions');
        Schema::table('user_plan_progress', fn (Blueprint $table) => $table->dropColumn(['is_paused', 'reading_days', 'next_read_on', 'completed_at']));
        Schema::table('reading_plans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn('description');
        });
    }
};
