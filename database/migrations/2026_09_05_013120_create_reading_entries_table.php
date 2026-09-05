<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reading_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('read_on'); // the calendar day this counts toward — the heatmap key
            $table->string('book');
            $table->unsignedSmallInteger('chapter');
            $table->string('translation', 10)->default('web'); // matches the Bible API's translation codes
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_on']); // every heatmap/streak query filters by this
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reading_entries');
    }
};