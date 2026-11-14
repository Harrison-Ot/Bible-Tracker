<?php

use App\Models\ReadingReminder;
use App\Models\User;
use App\Notifications\ReadingReminderNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

function reminderForReader(User $user, array $attributes = []): ReadingReminder
{
    return $user->readingReminder()->create(array_replace([
        'enabled' => true, 'time' => '08:00', 'timezone' => 'Africa/Nairobi', 'days' => [0, 6],
    ], $attributes));
}

beforeEach(function () {
    $this->withoutVite();
    Notification::fake();
    $this->travelTo(Carbon::parse('2026-11-14 05:00:00', 'UTC'));
});

afterEach(function () {
    $this->travelBack();
});

it('requires a verified account for reminder settings', function () {
    $this->get('/settings/reminders')->assertRedirect('/login');
    $this->patch('/settings/reminders', [])->assertRedirect('/login');
    $this->actingAs(User::factory()->unverified()->create())->get('/settings/reminders')->assertRedirect('/email/verify');
});

it('defaults reminders to off without creating an opt in', function () {
    $this->actingAs(User::factory()->create())->get('/settings/reminders')->assertOk()->assertInertia(fn ($page) => $page
        ->component('settings/reminders')->where('reminder.enabled', false)->where('reminder.time', '08:00')
        ->where('reminder.timezone', 'UTC')->has('reminder.days', 7));
    $this->assertDatabaseCount('reading_reminders', 0);
});

it('saves and updates only the authenticated readers schedule', function () {
    $user = User::factory()->create();
    $other = reminderForReader(User::factory()->create(), ['time' => '12:00']);
    $settings = ['enabled' => true, 'time' => '07:30', 'timezone' => 'Europe/London', 'days' => [1, 3, 5], 'user_id' => $other->user_id];
    $this->actingAs($user)->patch('/settings/reminders', $settings)->assertRedirect('/settings/reminders')->assertSessionHasNoErrors();
    $this->get('/settings/reminders')->assertOk()->assertInertia(fn ($page) => $page
        ->where('reminder.enabled', true)->where('reminder.time', '07:30')->where('reminder.days', [1, 3, 5]));
    expect($other->fresh()->time)->toBe('12:00');
    $this->patch('/settings/reminders', [...$settings, 'enabled' => false, 'days' => []])->assertSessionHasNoErrors();
    expect($user->readingReminder()->first()->enabled)->toBeFalse();
    $this->assertDatabaseCount('reading_reminders', 2);
    Notification::assertNothingSent();
});

it('validates schedule values and requires days when enabled', function () {
    $this->actingAs(User::factory()->create())->patch('/settings/reminders', [
        'enabled' => true, 'time' => '25:99', 'timezone' => 'Unknown/Timezone', 'days' => [],
    ])->assertSessionHasErrors(['time', 'timezone', 'days']);
    $this->patch('/settings/reminders', ['enabled' => true, 'time' => '08:00', 'timezone' => 'UTC', 'days' => [7]])->assertSessionHasErrors('days.0');
    $this->patch('/settings/reminders', ['enabled' => true, 'time' => '08:00', 'timezone' => 'UTC', 'days' => [1, 1]])->assertSessionHasErrors('days.0');
    $this->assertDatabaseCount('reading_reminders', 0);
});

it('delivers once per reader local date even on repeated command runs', function () {
    $user = User::factory()->create();
    $reminder = reminderForReader($user);
    $this->artisan('readings:send-reminders')->assertSuccessful();
    $this->artisan('readings:send-reminders')->assertSuccessful();
    Notification::assertSentToTimes($user, ReadingReminderNotification::class, 1);
    $this->assertDatabaseHas('reading_reminder_deliveries', ['reading_reminder_id' => $reminder->id, 'delivery_date' => '2026-11-14', 'status' => 'sent']);
    $this->travelTo(Carbon::parse('2026-11-15 05:00:00', 'UTC'));
    $this->artisan('readings:send-reminders')->assertSuccessful();
    Notification::assertSentToTimes($user, ReadingReminderNotification::class, 2);
});

it('does not send for disabled unverified wrong-day early or stale schedules', function () {
    reminderForReader(User::factory()->create(), ['enabled' => false]);
    reminderForReader(User::factory()->unverified()->create());
    reminderForReader(User::factory()->create(), ['days' => [1]]);
    reminderForReader(User::factory()->create(), ['time' => '08:01']);
    reminderForReader(User::factory()->create(), ['time' => '07:45']);
    $this->artisan('readings:send-reminders')->assertSuccessful();
    Notification::assertNothingSent();
    $this->assertDatabaseCount('reading_reminder_deliveries', 0);
});

it('allows a short scheduler delay within fifteen minutes', function () {
    $user = User::factory()->create();
    reminderForReader($user, ['time' => '07:46']);
    $this->artisan('readings:send-reminders')->assertSuccessful();
    Notification::assertSentTo($user, ReadingReminderNotification::class);
});

it('uses the readers weekday and date across the UTC date boundary', function () {
    $this->travelTo(Carbon::parse('2026-11-13 10:05:00', 'UTC'));
    $user = User::factory()->create();
    $reminder = reminderForReader($user, ['timezone' => 'Pacific/Kiritimati', 'time' => '00:00', 'days' => [6]]);
    $this->artisan('readings:send-reminders')->assertSuccessful();
    Notification::assertSentTo($user, ReadingReminderNotification::class);
    $this->assertDatabaseHas('reading_reminder_deliveries', ['reading_reminder_id' => $reminder->id, 'delivery_date' => '2026-11-14']);
});

it('does not repeat mail when daylight saving time repeats the chosen minute', function () {
    $user = User::factory()->create();
    reminderForReader($user, ['timezone' => 'America/New_York', 'time' => '01:30', 'days' => [0]]);
    $this->travelTo(Carbon::parse('2026-11-01 05:30:00', 'UTC'));
    $this->artisan('readings:send-reminders')->assertSuccessful();
    $this->travelTo(Carbon::parse('2026-11-01 06:30:00', 'UTC'));
    $this->artisan('readings:send-reminders')->assertSuccessful();
    Notification::assertSentToTimes($user, ReadingReminderNotification::class, 1);
});

it('skips a nonexistent daylight saving time minute rather than delivering hours late', function () {
    reminderForReader(User::factory()->create(), ['timezone' => 'America/New_York', 'time' => '02:30', 'days' => [0]]);
    $this->travelTo(Carbon::parse('2026-03-08 07:00:00', 'UTC'));
    $this->artisan('readings:send-reminders')->assertSuccessful();
    Notification::assertNothingSent();
});

it('dry runs without sending mail or claiming a delivery', function () {
    reminderForReader(User::factory()->create());
    $this->artisan('readings:send-reminders', ['--dry-run' => true])->expectsOutput('1 reminder(s) due. No mail sent.')->assertSuccessful();
    $this->assertDatabaseCount('reading_reminder_deliveries', 0);
    Notification::assertNothingSent();
});

it('records transport failure without automatically retrying an ambiguous send', function () {
    $reminder = reminderForReader(User::factory()->create());
    Notification::shouldReceive('sendNow')->once()->andThrow(new RuntimeException('Transport unavailable'));
    $this->artisan('readings:send-reminders')->assertFailed();
    $this->artisan('readings:send-reminders')->assertSuccessful();
    $this->assertDatabaseHas('reading_reminder_deliveries', ['reading_reminder_id' => $reminder->id, 'status' => 'failed']);
});

it('requires confirmation before unsubscribing without login', function () {
    $reminder = reminderForReader(User::factory()->create());
    $url = URL::signedRoute('reminders.unsubscribe', ['readingReminder' => $reminder->id]);
    $this->get($url)->assertOk()->assertInertia(fn ($page) => $page->component('reminders/unsubscribe')->where('unsubscribed', false));
    expect($reminder->fresh()->enabled)->toBeTrue();
    $this->post($url)->assertRedirect($url);
    expect($reminder->fresh()->enabled)->toBeFalse();
    $this->get($url)->assertOk()->assertInertia(fn ($page) => $page->where('unsubscribed', true));
    $this->post($url)->assertRedirect($url);
    $this->artisan('readings:send-reminders')->assertSuccessful();
    Notification::assertNothingSent();
});

it('rejects unsigned and tampered unsubscribe links without changing another readers reminder', function () {
    $first = reminderForReader(User::factory()->create());
    $second = reminderForReader(User::factory()->create());
    $this->post('/reading-reminders/'.$first->id.'/unsubscribe')->assertForbidden();
    $url = URL::signedRoute('reminders.unsubscribe', ['readingReminder' => $first->id]);
    $this->post(str_replace('/'.$first->id.'/unsubscribe', '/'.$second->id.'/unsubscribe', $url))->assertForbidden();
    expect($first->fresh()->enabled)->toBeTrue()->and($second->fresh()->enabled)->toBeTrue();
});

it('composes mail with a dashboard action and signed unsubscribe link', function () {
    $user = User::factory()->create();
    $reminder = reminderForReader($user);
    $notification = new ReadingReminderNotification($reminder);
    expect($notification->via($user))->toBe(['mail'])
        ->and($notification->toMail($user)->actionUrl)->toBe(route('dashboard'));
    $rendered = (string) $notification->toMail($user)->render();
    expect($rendered)->toContain('/reading-reminders/'.$reminder->id.'/unsubscribe?signature=')
        ->and($rendered)->toContain('/settings/reminders');
});

it('removes reminder preferences and delivery history when an account is deleted', function () {
    $user = User::factory()->create();
    reminderForReader($user);
    $this->artisan('readings:send-reminders')->assertSuccessful();
    $user->delete();
    $this->assertDatabaseCount('reading_reminders', 0);
    $this->assertDatabaseCount('reading_reminder_deliveries', 0);
});
