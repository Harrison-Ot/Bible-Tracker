<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('whatsapp_jid')->nullable(); // the WhatsApp group ID the bot posts to
            $table->string('invite_link')->nullable();
            $table->foreignId('owner_id')->constrained('users');
            $table->time('daily_nudge_time')->nullable(); // e.g. 07:00, for the daily reminder
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};