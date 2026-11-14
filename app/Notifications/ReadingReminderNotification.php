<?php

namespace App\Notifications;

use App\Models\ReadingReminder;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class ReadingReminderNotification extends Notification
{
    public function __construct(public ReadingReminder $reminder) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $unsubscribe = URL::signedRoute('reminders.unsubscribe', ['readingReminder' => $this->reminder->id]);

        return (new MailMessage)
            ->subject('A little time in the Word')
            ->greeting('Your reading moment is here.')
            ->line('Take a little time to read, reflect, and continue your journey through Scripture.')
            ->action('Continue reading', route('dashboard'))
            ->line('You chose to receive reading reminders from Bible Tracker.')
            ->line('[Change your reminder schedule]('.route('reminders.edit').') or [unsubscribe from reminders]('.$unsubscribe.').');
    }
}
