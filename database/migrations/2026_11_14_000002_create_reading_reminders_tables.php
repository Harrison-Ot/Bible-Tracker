<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reading_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('enabled')->default(false)->index();
            $table->string('time', 5)->default('08:00');
            $table->string('timezone', 64)->default('UTC');
            $table->json('days');
            $table->timestamps();
        });
        Schema::create('reading_reminder_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reading_reminder_id')->constrained()->cascadeOnDelete();
            $table->date('delivery_date');
            $table->string('status', 12)->default('pending');
            $table->timestamps();
            $table->unique(['reading_reminder_id', 'delivery_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_reminder_deliveries');
        Schema::dropIfExists('reading_reminders');
    }
};
