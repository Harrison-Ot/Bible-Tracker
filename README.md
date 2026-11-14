# Bible Tracker

A personal Bible reading journal built with Laravel, Inertia, React, and TypeScript. Read Scripture, listen with browser speech synthesis, highlight verses on your device, follow reading plans, track streaks, and connect with other readers.

## Local setup

Requires PHP 8.3+, Composer, Node.js, and npm. PHP must have the database driver configured in your environment (SQLite is the default).

```sh
composer install
npm install
```

Copy `.env.example` to `.env`, configure your database and mail settings, then run:

```sh
php artisan key:generate
php artisan migrate
php artisan db:seed --class=ReadingPlanSeeder
npm run build
composer dev
```

Use the reading-plan seeder above to install the four built-in plans. Review the other seeders before using them; they can create project-specific user accounts. Never run personal account seeders against production without reviewing their credentials.

## Verification

```sh
php artisan test
npm run types:check
npm run build
```

`composer ci:check` also runs repository-wide formatting, linting, and PHP static analysis.

## Reading and privacy

- The dashboard provides Continue Reading, active-plan shortcuts, today's unique chapter count, a reading heatmap, streaks, and reading logging for all 66 books.
- Continue Reading saves the last successfully opened chapter and translation to the account. Failed, empty, and prefetched passages do not change it. Run pending migrations when updating the application.
- The journal at /journal searches reflections and passages (for example, John 3), filters by book and date, and keeps filters across pagination. Users can edit their own reflections or remove their own entries.
- See TASKS.md for completed work, verification results, and the remaining feature/UI backlog.
- Reading dates cannot be in the future. Existing future records are excluded from streaks and the heatmap.
- The reader preserves the translation across navigation and stops at the final chapter. Verse highlighting supports keyboard activation and stays in browser storage.
- Reading appearance offers text size, line spacing, and width controls, saved per account on the current device. Focus mode hides navigation; use Exit focus or Escape to return.
- Mobile quick navigation links Home, Bible, Plans, and Journal. Reading actions sit above the navigation bar; phone safe-area spacing is supported.
- Light and Dark choices override the system theme. System follows device theme changes, including while the app is open.
- The daily verse rotates through a bundled KJV selection without an external request.
- Bible text is fetched from bible-api.com and cached on the server for 30 days. Uncached passages require connectivity. Network failures and invalid provider responses produce controlled errors.
- Journal entries belong to the signed-in user; other users cannot delete them. Chat requires an accepted connection.
- Community actions show progress, success and recoverable failure feedback, and prevent duplicate clicks. Settings show inline save confirmations. Authentication/settings validation messages are associated with fields, and password visibility controls support keyboard use.
- The service worker offers an offline fallback and static asset caching. It does not provide a fully offline Bible.

Set `APP_DEBUG=false`, HTTPS, production mail, durable storage, scheduled backups, and appropriate database credentials before deployment. Never commit `.env` or account secrets.

## Reading reminders

Verified readers can opt in at `/settings/reminders`, choosing a time, IANA timezone and reading days. Reminders start disabled. Each email links to settings and a signed public unsubscribe confirmation; opening the link alone does not disable anything.

Run pending migrations when updating. Configure a real mail transport for delivery (`MAIL_MAILER=log` only writes mail to logs). The deployment must invoke Laravel's scheduler every minute using its normal cron/task runner:

```sh
php artisan schedule:run
```

For local scheduler development, use `php artisan schedule:work`. No queue worker is required for these reminders: the scheduled command sends them synchronously. Do not start the scheduler against real accounts when testing mail; use notification fakes or the dry run:

```sh
php artisan readings:send-reminders --dry-run
php artisan schedule:list
```

The command accepts a 15-minute delay after the chosen local time. Later missed windows and nonexistent spring-forward minutes are skipped. A unique reminder/local-date record prevents another automatic attempt on the same local day, including repeated daylight-saving minutes. Failed or interrupted sends remain recorded rather than being automatically retried after an ambiguous transport outcome. Inspect `reading_reminder_deliveries` (`pending`, `sent`, `failed`, `skipped`) and application logs when investigating delivery issues. Delivery records are removed with the account.