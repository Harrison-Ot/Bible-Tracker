<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g. "streak_7", "book_finished_john"
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->nullable(); // emoji or icon name for now
            $table->timestamps();
        });

        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained()->cascadeOnDelete();
            $table->timestamp('earned_at');

            $table->unique(['user_id', 'badge_id']); // can't earn the same badge twice
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('badges');
    }
};