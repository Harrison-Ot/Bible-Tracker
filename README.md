# Bible Tracker

A personal Bible reading journal built with Laravel, Inertia, React, and TypeScript. Read Scripture, listen with browser speech synthesis, save highlights and bookmarks across devices, follow reading plans, track streaks, and connect with other readers.

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
- The reader preserves the translation across navigation and stops at the final chapter. Verse highlighting supports keyboard activation; highlights and bookmarks save to the account, separately per translation.
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
## Saved verses and device import

Open `/saved-verses` from the sidebar or reader to search highlights and bookmarks by text or passage reference (for example, `John 3:16`), filter by book/type/translation, and return to the verse in its chapter. Saved content is private to the signed-in verified account. New saves use verse text validated by the server's Bible provider/cache. Run pending migrations when updating.

Selecting a verse toggles its account highlight; the bookmark button saves it independently. Clear highlights affects only the current chapter and translation and keeps bookmarks. Account changes appear on other devices when the chapter or library is opened/refreshed. Offline changes are not queued; failed saves show an error and do not display as successfully synchronized.

Older `highlights:BOOK:CHAPTER` entries in browser storage have no account or translation. The library offers explicit device import with a translation choice. It leaves the originals intact, preserves existing bookmarks and prevents duplicate saved records. Import only highlights you saved on that browser. Imports validate one chapter at a time; completed chapters remain saved if a later chapter fails, and retrying is safe. Chapter validation may require access to the Bible provider if the passage is not cached.
## Flexible plans and reading reports

Use `/reading-plans/create` to create a private plan over a consecutive Bible-book range. Choose 1-20 chapters per reading, weekdays, and a schedule date. The resulting number of readings is separate from calendar duration. Plans can be paused, resumed or rescheduled without losing completed readings. Existing curated plans remain available.

The next suggested date follows selected weekdays. Resume preserves a future date or moves an overdue reading to the next selected day. Schedule edits place the next unfinished reading on a selected weekday on/after the chosen date. They preserve the original start date and completed progress. Readers may log and complete passages ahead of schedule.

Completing a reading requires every assigned chapter to appear in the user's journal from the plan's original start date through today. Catch up logged readings credits consecutive fully read assignments and stops at the first gap. Reading while paused still counts after resuming. These actions do not create reading logs. UI requests include an expected reading number, and completion events are stored once. Custom creation tokens also prevent duplicate plans on request retries.

Open `/reports` for unique chapter progress, all 66 books, milestones and eight weeks of activity. Set a weekly unique-chapter goal there. Reports normalize book names/IDs and count each chapter once across translations. Weekly counts are distinct within each Monday-Sunday week; rereading a chapter in a different week counts toward that week's goal. Future and invalid entries are excluded. Journal-derived milestones update with the saved entries; plan completion progress is retained independently.

Run pending migrations when updating. Existing plans keep their reading position and start date; their new schedule begins on the migration's application date until adjusted. New completion history is recorded going forward, without inventing historical completion dates. Private custom plans and completion history cascade when an account is deleted.