<?php

namespace App\Notifications;

use App\Models\ConnectionRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ConnectionRequestNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ConnectionRequest $connectionRequest,
        private string $kind = 'connection_request',
        private ?string $message = null,
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'kind' => $this->kind,
            'connection_request_id' => $this->connectionRequest->id,
            'sender_id' => $this->connectionRequest->sender->id,
            'sender_name' => $this->connectionRequest->sender->name,
            'message' => $this->message ?? $this->connectionRequest->sender->name.' wants to connect with you.',
        ];
    }
}