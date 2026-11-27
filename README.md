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
- Downloads provides explicitly saved WEB chapters and a public offline reader. Account pages need a connection; this is a bounded chapter library, with no full-Bible download.

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
## Private reading groups

Open `/groups` from the sidebar to create a private group or respond to an invitation. Only members can open a group. Owners and admins invite their verified accepted connections through the recipient's Reading groups inbox. Invitations last seven days and are account-bound; no invitation email or WhatsApp message is sent. Repeating a pending invitation does not extend its expiry. Removed members need a new invitation to rejoin.

Owners edit group details, assign admin/member roles, transfer ownership and delete the group. Admins invite, revoke invitations, remove regular members, moderate reflections and manage the shared reading. Owners must transfer ownership or delete their groups before leaving or deleting their account. Transfer and group deletion require the exact group name. Pending invitations issued by managers who leave, are removed or are demoted are revoked.

A manager can start a public guided plan for the group. The group has its own reading position and start date. Members log passages privately, then explicitly share a check-in after every assigned chapter appears in their own journal from the group's run start through today. Only the check-in name and completion are shared. Journals, notes, saved verses, reports and personal plans remain private. Managers advance readings when the group is ready; this does not write journal entries, enroll readers or alter their personal plan progress. Starting a new shared run retains prior run/check-in records in the database; the workspace shows the current run.

Passage discussions contain plain-text reflections of up to 2,000 characters tied to a valid book/chapter. Authors can remove their own reflections; owners/admins can remove any reflection and pause member posting. Removal permanently clears the text and leaves a notice. Request tokens prevent duplicate creation/posts, and stale advancement requests cannot advance again.

Leaving or being removed preserves existing group reflections/check-in records; departed members are excluded from the current check-in list. Account deletion removes that account's group reflections and check-ins. Deleting a group removes its memberships, invitations, reflections and shared runs/check-ins while preserving personal journals and plans. Run pending migrations when updating; existing group owners receive an owner membership during migration.

## Offline passages and reading logs

Open `/downloads` from the sidebar, or use **Download chapter** in the WEB reader. Keep the tab connected until the download is confirmed. Downloads support World English Bible text only, whose publisher permits copying: [WEB permissions](https://www.ebible.org/eng-web/copyright.htm), verified 2026-11-16. The provider asks clients to avoid full-Bible downloads: [API usage terms](https://bible-api.com/#terms-of-use). This implementation offers individual chapters, limited to 50 chapters or 10 MB of passage data per browser/device, with a 256 KiB per-chapter cap and download throttling. It uses the existing 30-day server passage cache.

Open `/offline` to read downloaded passages without loading an account page. The download action prepares a public reader shell and its compiled assets before confirming success. It supports disconnected cold reloads, chapter selection and text sizing. A requested translation other than WEB is not silently substituted. Downloads contain public text and license metadata, and are visible to anyone using that browser. They do not follow the account to another device. Journals, notes, bookmarks, highlights and account/group/plan HTML or JSON are not cached.

The Downloads page shows chapter/storage usage, per-chapter removal, clear-downloads and a browser persistence request. Browser storage permissions, available space and eviction policies still apply. Removing downloads keeps queued logs. **Reset offline data on this device** explicitly clears local downloads, all accounts' pending logs and device logging opt-ins; it does not delete server journal entries. Clearing browser/site data can also permanently remove pending work, so confirm sync first.

While signed in, opt in to **Allow reading logs on this device while offline** on Downloads. Enable this only on a trusted device. The standalone reader can then queue a chapter and chosen date for the account that opted in. The main WEB reader also queues explicit reading saves when disconnected or after a network failure. Pending feedback means device storage, not confirmed journal/streak progress. No reflection text is queued. Repeated pending logs for the same account/chapter/translation/date occupy one slot; the device queue holds up to 200 logs and never silently evicts older ones.

Pending logs sync when that same account returns to an authenticated app page or reconnects. Successful automatic sync refreshes page data so journal-derived counts and reading checks update. Manual retry/review/discard is available on Downloads. No background synchronization runs while the app is closed. Signing out disables further offline logging, and signing in to a different account disables the previous account's opt-in. Older pending logs remain assigned to their original account and are not submitted under a different session. The public offline shell does not list existing private queued readings or account identifiers.

The server requires a verified matching account, CSRF protection, a valid canonical WEB passage and a nonfuture date in the application's calendar. Date conflicts remain pending for review/retry; dates are not silently changed. Network/session/server failures retain the queue. Validation/conflict failures require explicit retry. Durable account/operation/payload receipts make acknowledgements safe to replay, including after a lost response or deletion of a previously confirmed journal entry. A matching existing online chapter/date entry is reused without changing its reflection. Receipts are removed with the account.

Run pending migrations when updating and deploy the production build so `/build/manifest.json`, hashed assets, `/offline` and `/sw.js` are available. Service workers require HTTPS outside localhost. Use a production build for offline review; a development-server shell is not confirmed as ready. The public offline shell is prepared with credentials omitted. Cache storage includes the public shell/build assets/icons, never account HTML/JSON, avatars or mutation responses. Physical-device and production-network smoke checks remain separate from the automated Chrome review.

## Windows reminder scheduling

Reminder settings must be explicitly enabled at `/settings/reminders`. The local instance was configured on 2026-11-16 for a daily 19:00 Africa/Nairobi reminder, and a separate live test reached the user's inbox. Other accounts remain opt-in. Mail delivery uses the configured SMTP credentials; `MAIL_TIMEOUT` defaults to 15 seconds.

Install the persistent scheduler for this workspace from PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-reminder-scheduler.ps1 -PhpPath C:\xampp\php\php.exe
```

The default task name is `BibleTracker-ReadingReminders`. Use `-TaskName` for another workspace. The installer resolves the PHP executable and workspace paths, runs with the current user's limited interactive token, and does not store a Windows password. It refuses to replace a task assigned to a different project. Its windowless Windows Script Host action starts the PowerShell runner hidden from creation, avoiding the recurring console flash. It waits for the runner and preserves its exit code. Laravel's scheduler runs every minute; the queue listener alone does not run scheduled reminders.

Inspect it with:

```powershell
Get-ScheduledTask -TaskName BibleTracker-ReadingReminders
Get-ScheduledTaskInfo -TaskName BibleTracker-ReadingReminders
Get-Content storage/logs/scheduler.log -Tail 20
```

The task persists across restarts but runs only while that Windows account is signed in and the PC is awake. Existing reminder timing permits a delay of less than 15 minutes; later missed windows are skipped. Use the deployment's normal once-per-minute scheduler on an always-on host when delivery must continue while this PC is off. `APP_URL` must point to that deployment for links in email to work from other devices. Windows task output and the reminder delivery table diagnose execution and send attempts; only inbox confirmation establishes actual receipt.


## Reading music

Add your audio files directly to `public/songs/` (for example `public/songs/Amazing-Grace.mp3`). MP3 is recommended for broad browser support; M4A, OGG, WAV, AAC, FLAC, OPUS and WEBM files are also listed, with playback depending on the browser and codec. Subfolders and hidden files are ignored. File names become song titles, with hyphens and underscores displayed as spaces.

Reload a chapter to see new songs. No database migration, upload screen or frontend rebuild is needed when adding songs. Include the audio folder when deploying, or preserve it as persistent server storage if managing files directly on the host. These files are public at `/songs/...`; only place audio there that you intend to share publicly and have permission to distribute.

The reader offers a song selector and native play/pause, seek and volume controls. Playback starts only after the reader presses Play. Starting a song stops chapter narration; starting or resuming narration pauses the song. Changing songs pauses the old track. Previous/next chapter navigation keeps the same song playing at its current position. Pause uses the native audio controls; Stop song pauses and rewinds it. Leaving the reader stops audio. Song files are streamed separately and are not part of offline chapter downloads.


## Phone installation troubleshooting

The install button opens the browser's native PWA prompt directly, without an extra dialog. Browsers without that prompt show a single short message. Automatic prompts are not available in every browser. Production installation requires HTTPS. For iPhone, use Safari's Share menu, Add to Home Screen, and Open as Web App if offered. For Android, use the browser menu's Install app or Add to Home screen option. Links opened inside social or messaging apps may need to be opened in the full browser first.

If Android warns that the app was built for an older Android version, that warning concerns the installed Android package's target SDK. Browser-based installations can generate a WebAPK outside this repository. There is no Android Gradle project or targetSdkVersion setting in this Laravel app, and changing the web manifest does not upgrade a browser-generated package. Update the phone's browser and try installing the HTTPS website in updated Chrome, particularly if Samsung Internet generated the warning. Keep Play Protect enabled. Record the browser/version, Android version and live URL for further diagnosis if it persists.

References: https://developers.google.com/android/play-protect/warning-dev-guidance and https://web.dev/learn/pwa/installation.
