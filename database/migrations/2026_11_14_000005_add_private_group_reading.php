<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->boolean('discussions_locked')->default(false);
            $table->uuid('creation_token')->nullable()->unique();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('current_run_id')->nullable();
        });
        Schema::table('group_user', fn (Blueprint $table) => $table->string('role', 12)->default('member'));
        foreach (DB::table('groups')->get(['id', 'owner_id']) as $group) {
            DB::table('group_user')->updateOrInsert(['group_id' => $group->id, 'user_id' => $group->owner_id], ['role' => 'owner', 'created_at' => now(), 'updated_at' => now()]);
            DB::table('groups')->where('id', $group->id)->update(['created_by_id' => $group->owner_id]);
        }
        Schema::create('group_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('inviter_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 12)->default('pending');
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->unique(['group_id', 'recipient_id']);
            $table->index(['recipient_id', 'status']);
        });
        Schema::create('group_reading_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reading_plan_id')->constrained()->restrictOnDelete();
            $table->uuid('creation_token');
            $table->unsignedSmallInteger('current_day')->default(1);
            $table->date('started_on');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->unique(['group_id', 'creation_token']);
        });
        Schema::create('group_reading_checkins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_reading_run_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('day_number');
            $table->timestamp('checked_in_at');
            $table->unique(['group_reading_run_id', 'user_id', 'day_number'], 'group_checkin_once');
        });
        Schema::create('group_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('post_token');
            $table->string('book_id', 4);
            $table->unsignedSmallInteger('chapter');
            $table->text('body')->nullable();
            $table->timestamp('removed_at')->nullable();
            $table->foreignId('removed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['group_id', 'user_id', 'post_token']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_posts');
        Schema::dropIfExists('group_reading_checkins');
        Schema::dropIfExists('group_reading_runs');
        Schema::dropIfExists('group_invitations');
        Schema::table('group_user', fn (Blueprint $table) => $table->dropColumn('role'));
        Schema::table('groups', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by_id');
            $table->dropColumn(['description', 'discussions_locked', 'creation_token', 'current_run_id']);
        });
    }
};
