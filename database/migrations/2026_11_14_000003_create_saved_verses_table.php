<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_verses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('book_id', 4);
            $table->string('book', 50);
            $table->unsignedSmallInteger('chapter');
            $table->unsignedSmallInteger('verse');
            $table->string('translation', 30);
            $table->text('text');
            $table->boolean('highlighted')->default(false);
            $table->boolean('bookmarked')->default(false);
            $table->timestamps();
            $table->unique(['user_id', 'book_id', 'chapter', 'verse', 'translation']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_verses');
    }
};
