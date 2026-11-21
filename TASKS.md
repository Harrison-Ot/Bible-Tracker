# Bible Tracker tasks

Updated: 2026-11-16

Status: [ ] planned, [x] complete. Phases 1-6 are implemented and verified with automated checks and synthetic browser data. Physical-device review and an always-on production scheduler remain planned. Current Windows reminder scheduling and real inbox delivery are verified.

## Phase 1 - Daily reading experience (complete)
- [x] Redesign the dashboard around Continue Reading, compact statistics, and today's plans.
- [x] Remember the last successfully opened chapter and translation per account, across devices.
- [x] Add journal search by reflection/passage, book and date filters, with persistent pagination.
- [x] Allow users to edit their own reflections, with validation and ownership checks.
- [x] Unify dashboard, journal and logging form colors for light and dark modes.
- [x] Replace sidebar links to unfinished Reports/Groups pages with working navigation.
- [x] Improve empty states, keyboard focus, mobile wrapping and save feedback in changed screens.
- [x] Verify the batch with feature tests, TypeScript checks and a production build.

## Phase 2 - Reading comfort and mobile navigation (implemented; physical-device review pending)
- [x] Review the built dashboard, reader, journal and Bible browsing screens on desktop/mobile with synthetic data in Chrome, in light/dark modes.
- [x] Add saved font-size, line-spacing and reading-width preferences, scoped per account on the current device.
- [x] Add distraction-free reading mode with touch exit, Escape support and automatic cleanup when leaving the reader.
- [x] Add mobile quick navigation for Home, Bible, Plans and Journal, with current-page indicators and phone safe-area spacing.
- [x] Apply the shared theme to Bible book/chapter browsing and the reader.
- [x] Fix explicit Light/System theme behavior and react to system theme changes.
- [x] Add empty-passage, audio-error and reading-save-error feedback; improve dark-mode error/removal contrast.
- [x] Review community, authentication and settings screens in both themes at 320/390/1440px; fix notification header wrapping, chat grid clipping and shared theme colors.
- [x] Review implemented reading, journal, plans, community, authentication and settings loading/error/completion states; add community busy/error/success feedback and settings save confirmations.
- [x] Make password visibility keyboard-accessible; associate form errors with inputs and announce validation errors.
- [x] Prevent duplicate community submissions and recover buttons after validation, HTTP and network failures.
- [ ] Perform physical-device and live-data smoke review, including browser audio, email delivery and mobile keyboard/safe-area behavior.

## Phase 3 - Reminders and saved verses (local delivery verified; production host pending)
- [x] Store reminder time, timezone, reading days and opt-in preferences, with verified-account settings and validation.
- [x] Schedule email reminders with per-local-date duplicate prevention, dry-run support, and signed unsubscribe confirmation.
- [x] Configure the local Windows scheduler and verify real Gmail delivery with a controlled inbox-confirmed test.
- [ ] Configure an always-on production scheduler for delivery when this development PC is off or signed out.
- [x] Sync highlights and bookmarks to each user's account, separately per translation.
- [x] Import existing device highlights explicitly by chapter and chosen translation, without duplicates or deleting originals.
- [x] Add a private saved-verses library with passage/text search, book/type/translation filters, pagination and removal.

## Phase 4 - Flexible plans and reports (complete)
- [x] Add private book-range plans, chapters-per-reading pace, selected weekdays, start dates and a personal weekly chapter goal.
- [x] Add pause/resume, remaining-schedule edits and journal-based catch-up that preserve completed readings.
- [x] Add private progress reports for unique chapters, all 66 books and the last eight weeks of activity.
- [x] Add completion feedback, weekly-goal progress and chapter/book/plan milestones.

## Phase 5 - Group reading (complete)
- [x] Implement private group creation, account-bound invitations, membership and owner/admin/member roles.
- [x] Add independent shared guided plans, explicit journal-verified check-ins and passage discussions.
- [x] Add membership privacy, post removal/locking, role management, ownership transfer and deletion controls.

## Phase 6 - Offline passages (complete)
- [x] Confirm WEB permissions and limit explicit downloads to 50 chapters or 10 MB per device.
- [x] Add explicit chapter downloads, availability indicators and a public offline reader with cold-reload support.
- [x] Add download removal, persistence requests, storage usage and explicit device reset controls.
- [x] Add opt-in account-bound offline logs, same-account sync, durable replay receipts and recoverable failures.

## Verification log
- `php artisan test --compact`: 93 passed, 4 skipped; 520 assertions (97 tests total).
- `php vendor/bin/phpstan analyse --no-progress -v`: passed, zero errors.
- `npm.cmd run types:check`: passed.
- `npm.cmd run build`: passed; Laravel route helpers regenerated.
- Frontend lint for changed TypeScript files: passed.
- Changed PHP files formatted with Pint; frontend files formatted with the project formatter.
- `git diff --check`: passed.
- Applied migration `2026_11_14_000001_add_last_reading_to_users_table` to the configured database.
- Fixed pre-existing `.env` syntax errors in MAIL_PASSWORD quoting and trailing characters after MAIL_FROM_NAME. Secret values were not added to tracked files.
- Phase 2 browser review: headless Chrome with synthetic Inertia page data using the production build; no real account data or external API calls.
- Browser checks passed: theme selection/system changes, preference reload/reset, focus enter/exit, mobile navigation, action-bar placement, highlight reload, malformed/blocked storage, and no horizontal overflow at 320/390/768/1440px.
- Eight screenshots and report are saved locally under storage/app/private/ui-review/ (ignored by Git). The local review runner is review.mjs in that directory.
- Phase 2 regression suite: 93 passed, 4 skipped, 520 assertions; TypeScript and changed frontend lint checks passed. Production build passed.
- Physical-device and live-data integration review remain planned; automated browser tests use synthetic accounts, pages and mutation responses.

## Implementation notes
- Continue Reading remembers the last successfully opened chapter and translation per account. Empty/failed provider responses and prefetches do not replace it. Existing users fall back to their latest non-future reading log when available.
- Dashboard statistics count distinct book/chapter combinations read today. The activity heatmap continues to show logged entries, including rereads.
- Dashboard plan cards show current day and completed-day progress and link to the existing daily assignments.
- Journal search combines keyword, book and inclusive date filters. Pagination keeps the query. Reflection editing changes only the owner's note, with a 1,000-character limit.
- Unfinished Reports and Groups navigation links are removed until those features are implemented.

- Reader appearance preferences save on the current device under an account-specific key. New highlights and bookmarks are saved to the account; older device highlight keys are retained for explicit import.
- Focus mode hides the sidebar, page header, mobile navigation and install prompt. An exit control stays available in the reading action bar.

## Community, authentication and settings review
- `php artisan test --compact`: 93 passed, 4 skipped; 520 assertions.
- TypeScript, changed frontend lint, production build and `git diff --check`: passed.
- Headless Chrome: 12 screens reviewed in light/dark at 320/390/1440px; checked empty community states, long names/messages, unique element IDs and horizontal overflow.
- Browser interaction checks: duplicate connect clicks issue one mutation; progress and success feedback; buttons recover after validation/503/network failures; notification read/connection acceptance feedback; profile/password save confirmations; keyboard password visibility; field/error associations.
- Screenshots and passing report are in `storage/app/private/community-review/` (ignored by Git). Local runner: `storage/app/private/ui-review/community-review.mjs`.
- Screenshots exposed clipped chat Send controls despite no document overflow. Chat now uses `minmax(0, 1fr)` grid columns and constrained children; browser checks confirm the Send button stays inside the card.
- Community mutations preserve component state so feedback remains visible after redirects. Form fields now link to validation messages and settings navigation marks the current page.
- No external messages, emails or connection requests were sent during browser testing.
## Reminder implementation and verification
- Settings: `/settings/reminders`, linked from Settings. Email reminders default to off; creating an account or visiting settings does not opt in.
- A reminder stores enabled state, HH:mm time, IANA timezone and selected weekdays. Preferences are scoped to the signed-in verified account.
- `readings:send-reminders` is registered every minute with scheduler overlap protection. A unique reminder/local-date delivery ledger also prevents duplicate attempts across command runs and repeated DST minutes.
- Delivery has a 15-minute local-time window. Later missed reminders and nonexistent spring-forward minutes are skipped. A failed/ambiguous send is recorded as failed without automatic same-day retries; an interrupted attempt remains pending to avoid duplicate mail.
- Email includes a signed unsubscribe link. GET only shows confirmation; signed POST disables reminders without requiring login. Unsigned/tampered links are rejected. Account deletion cascades to preferences and delivery history.
- `php artisan test --compact`: 109 passed, 4 skipped; 638 assertions across 113 tests. All 16 new reminder tests passed.
- PHP static analysis: passed, zero errors. TypeScript, changed frontend lint, production build and diff whitespace checks passed.
- Headless Chrome with synthetic data: reminder settings in both themes at 320/390/1440px; opt-in, time/timezone/day persistence, rapid day selection, empty-day validation, turning off with no days, public unsubscribe confirmation/completion.
- Browser report and screenshots: `storage/app/private/reminder-review/`; local runner: `storage/app/private/ui-review/reminder-review.mjs`. These artifacts are ignored by Git.
- Applied migration `2026_11_14_000002_create_reading_reminders_tables` to the configured database.
- `php artisan readings:send-reminders --dry-run`: 0 due; no mail sent. `php artisan schedule:list` confirms the once-per-minute command.
- No real reminder emails were sent and no host-level scheduler was installed or started. The deployment needs a working mail transport and its usual Laravel scheduler runner.
## Saved verses implementation and verification
- `/saved-verses` is available from the sidebar and reader. Highlights and bookmarks are private to the account and translation; opening or refreshing a chapter loads its saved state across devices.
- Reader verse selection updates account highlights. Per-verse bookmark buttons work independently. Clearing chapter highlights preserves bookmarks, other chapters, other translations and other accounts.
- New saved text comes from the server's cached Bible provider response. Client-supplied text, book names and user IDs are not used. Removing existing flags and clearing highlights do not require a provider request.
- Unique account/book/chapter/verse/translation records prevent duplicate saves. Empty records are removed when both flags are off. Account deletion cascades to saved verses.
- Device import is an explicit action. Legacy highlights do not identify an account or translation, so users choose the translation. Original keys remain untouched; malformed values are ignored, complete chapters are validated before writes, and successful chapter imports remain saved if another chapter fails. Repeating imports does not duplicate records or clear bookmarks.
- Import requests are paced and guarded against duplicate clicks. Saves report network/session failures without claiming successful synchronization. No offline save queue or real-time cross-device push is implemented.
- Library search supports verse text and exact references such as John 3:16. Filters and pagination are account-scoped; passage links include the verse anchor.
- `php artisan test --compact`: 124 passed, 4 skipped; 804 assertions across 128 tests. All 15 new saved-verse tests passed.
- PHP static analysis passed with zero errors. TypeScript, changed frontend lint, production build and whitespace checks passed.
- Headless Chrome with synthetic API responses: saved highlight/bookmark reloads, translation separation, clear preserving bookmarks, explicit/repeated imports, duplicate click prevention, original storage retention, library search/removal, keyboard use, network/session failures and account saves with device storage blocked.
- Browser review covered reader/library at 320/390/1440px in light/dark modes. Screenshots and report: `storage/app/private/saved-verse-review/`; local runner: `storage/app/private/ui-review/saved-verse-review.mjs` (ignored by Git).
- Applied migration `2026_11_14_000003_create_saved_verses_table` to the configured database. All provider calls in automated tests were faked; no live user saves or messages were generated for verification.
## Phase 4 implementation and verification
- `/reading-plans/create` builds a private plan over a consecutive Bible-book range, with 1-20 chapters per reading, selected weekdays and a schedule date. Creation tokens make retries idempotent without resetting an existing run.
- Public curated plans remain available. Private plans are visible/actionable only to their owner. Pause/resume and schedule edits act on the current user's progress, with row locks and no reset of completed readings.
- Weekday schedules guide the next suggested reading date; reading ahead is allowed. Resuming keeps an existing future date or moves an overdue reading to the next selected day. Saving a remaining schedule uses a selected weekday on/after the chosen date and preserves pause state.
- Completing a reading uses matching journal chapters logged from the plan's original start date through today, across translations and canonical book names/IDs. Catch-up advances consecutive fully logged readings and stops at the first gap. It does not create journal entries or alter streak data.
- UI completion/catch-up requests include the expected reading number. Stale retries do not advance again. New completion events are recorded once per progress/reading; completed plans stay completed, including after journal deletions.
- Existing reading positions and original start dates are preserved. Migration sets their new schedule clock to its application date and defaults weekdays to daily. Historical completion dates are not invented; existing completed plans still count from their saved reading position.
- `/reports` shows lifetime unique valid chapters, all 66 book totals, reading days/log totals, completed plans, eight Monday-Sunday weeks and a weekly goal (default 7; range 1-1189). Rereads and translations do not inflate unique progress; future, unknown-book and out-of-range entries are excluded.
- Weekly activity counts distinct chapters within each week; the same chapter can contribute again in a different week. Bars compare with the current goal. Chapter/book milestones are derived from current journal data and update if those entries are removed; plan milestones use saved completion progress.
- Dashboard hides paused plans and links to reports. Plan/report screens provide empty, progress, error and completion feedback using the shared request handler.
- `php artisan test --compact`: 140 passed, 4 skipped; 994 assertions across 144 tests. All 16 Phase 4 tests passed, with existing plan and dashboard tests preserved.
- PHP static analysis passed with zero errors. TypeScript, changed frontend lint, production build and whitespace checks passed.
- Headless Chrome with synthetic data: plans/creator/reports at 320/390/1440px in light/dark; unique IDs, pause/resume, complete/catch-up, schedule preservation, custom range/pace/day creation, weekly-goal save/reload and network/HTTP failure recovery.
- Browser screenshots/report: `storage/app/private/phase-four-review/`; local runner: `storage/app/private/ui-review/phase-four-review.mjs` (ignored by Git).
- Applied migration `2026_11_14_000004_add_flexible_plans_and_reading_goals` to the configured database. No real user plans or journal entries were created by browser verification.

## Phase 5 implementation and verification (2026-11-16)
- Added Reading groups to the sidebar, with a private group list, in-app invitation inbox and responsive group workspace in both themes. Drafts survive recoverable failures and discussion filtering; validation feedback belongs to the submitted form.
- Owners create/edit/delete groups, manage admin roles and transfer ownership with exact-name confirmation. Admins manage invitations, remove regular members, moderate discussions and advance shared readings. Members can leave; owners must transfer ownership or delete their groups before leaving or deleting their account.
- Invitations are addressed only to verified accepted connections, expire after seven days and require acceptance by that account. Repeated pending invitations do not extend expiry. Revoking, leaving, removal and admin demotion invalidate affected pending invitations. Old accepted invitations and old creation tokens cannot restore removed memberships.
- Invitations appear inside Reading groups; no invitation emails or WhatsApp messages are sent. Group membership and content are private. Client props contain member names/roles and explicitly shared content, without other members' emails, journals, notes, saved verses or personal reading history.
- Managers choose public guided plans. Shared runs have their own cursor and start date; replacing a run retains earlier run/check-in records in the database. The workspace displays the current run. Moving or completing a shared reading never creates journal entries or changes personal plan progress.
- Members explicitly share a check-in after logging every assigned chapter in their own journal from the run's start through today. Duplicate check-ins and stale advancement requests are safe. Current check-in lists exclude departed members.
- Passage reflections validate canonical book/chapter bounds and a 2,000-character plain-text limit. Request tokens prevent duplicate posts. Authors/moderators can permanently clear a reflection's text; a tombstone remains and retrying cannot restore it. Managers can pause member posting while retaining reading access.
- Leaving/removal retains prior posts and check-in records. Account deletion removes that account's posts and check-ins. Deleting a group removes its group data while preserving members' personal journals and plans.
- Mutations recheck current membership/roles under group row locks. Nested posts/invitations are group-scoped; private personal plans cannot be shared. Ownership transfer and group deletion require the current group name.
- `php artisan test --compact`: 166 passed, 4 skipped; 1,406 assertions across 170 tests. All 26 new Phase 5 tests passed.
- PHP static analysis: zero errors. TypeScript, changed frontend lint, production build, formatting and diff whitespace checks passed.
- Repaired the local mixed npm/pnpm dependency installation using the existing pnpm lockfile and cached packages, preserving the stale package in ignored private storage. No dependency versions or lockfiles were changed by this repair.
- Headless Chrome with synthetic accounts and mocked mutations: group list and owner/member workspace at 320/390/1440px in light/dark; no horizontal overflow, unique IDs, escaped text, creation/acceptance, check-in, plan completion/restart, post token rotation/removal, draft-preserving filters, invitation/revoke controls, locked member/admin permissions, account ownership guard, rename/transfer and network/HTTP/validation feedback.
- Browser screenshots/report: `storage/app/private/phase-five-review/`; local runner: `storage/app/private/ui-review/phase-five-review.mjs` (ignored by Git). These checks do not establish physical-device or live-account integration results.
- Applied migration `2026_11_14_000005_add_private_group_reading` to the configured database; all migrations are current. No real invitations, posts, check-ins, messages or emails were generated by automated verification.

## Phase 6 implementation and verification (2026-11-16)
- Confirmed WEB public-domain text permissions with the publisher: https://www.ebible.org/eng-web/copyright.htm. Provider usage terms prohibit full-Bible API downloads: https://bible-api.com/#terms-of-use. Offline downloads support WEB only, one explicit chapter at a time, with a device limit of 50 chapters/10 MB and a per-chapter payload cap of 256 KiB. The authenticated download endpoint is rate limited and reuses the existing server passage cache.
- Added Downloads to the sidebar and chapter download/availability controls to the reader. The server validates canonical book/chapter bounds, provider translation/license metadata, ordered verse numbers and nonempty text. Only public passage text and licensing metadata enter device downloads; personal page props and saved verses are excluded.
- Added a standalone public `/offline` reader. The service worker prepares its entry, imports, styles and font assets before a download is confirmed. Readiness checks also require the public shell to reference its built manifest entry; a development-only shell cannot claim success. A disconnected full-page navigation or Inertia visit can open the public shell; cold reloads work for downloaded chapters. Other translations require an explicit WEB selection rather than silently changing text.
- Device IndexedDB transactions enforce chapter count/size and a 200-log device queue without evicting earlier records. Failed, blocked or full storage does not produce a success claim. Download removal keeps pending logs. An explicit confirmed device reset clears all local downloads, queues and logging opt-ins, without deleting server journal entries.
- Offline logging requires an opt-in on the signed-in account's Downloads page. The offline reader queues chapter/date records for the last enabled account; it does not expose account names, emails or existing private journal history. Normal sign-out disables further offline logging; a different signed-in account also clears the previous opt-in. Existing queues remain bound to their original account.
- The main WEB reader can queue an explicit Mark as read while disconnected or after a network failure, when the account opted in. Feedback distinguishes device-pending logs from confirmed journal/streak updates. Offline logs contain chapter/date only, without reflections, highlights or bookmarks.
- Returning to an authenticated app page or reconnecting syncs only that account's pending logs and refreshes page data after confirmation. Downloads also offers manual retry/review/discard controls. Authentication, session, validation, server and network failures retain unconfirmed records. Validation/conflict failures wait for explicit retry. Future dates are checked against the server's current application date; they are never silently shifted.
- The sync endpoint verifies the submitted owner against the current verified session and serializes writes with a user row lock. Durable account/token/payload-hash receipts prevent duplicate application after lost responses or concurrent retries. Existing matching online entries are reconciled without overwriting notes. A deleted confirmed entry is not recreated by a later replay; receipts cascade with the account.
- Service-worker caching is limited to the public offline shell, build assets and public fallback/icons. Account HTML, JSON, avatars and mutation responses are not cached. The prior static-cache version is removed on activation. Offline saved-verse changes and account/group/plan screens still require connectivity. No sync occurs while the app is closed.
- `php artisan test --compact`: 181 passed, 4 skipped; 1,525 assertions across 185 tests. All 15 new Phase 6 tests passed. PHP static analysis, TypeScript, changed frontend lint, production build, formatting and whitespace checks passed.
- Browser review used real Chrome service workers, Cache Storage and IndexedDB with synthetic accounts and mocked API responses. Checks covered both themes at 320/390/1440px, cold disconnected reloads, offline Inertia navigation, translation selection, pending-log deduplication, ambiguous responses/retries, account switching, validation/session recovery, chapter/byte/queue limits, download removal, device reset, blocked storage and sign-out.
- Browser screenshots/report: `storage/app/private/phase-six-review/`; local runner: `storage/app/private/ui-review/phase-six-review.mjs` (ignored by Git). These results do not establish physical-device/browser-specific storage eviction or production delivery behavior.
- Applied migration `2026_11_16_000006_create_offline_reading_receipts_table` to the configured database. Automated verification created no live-account downloads, queued logs, journal entries, messages or emails; provider calls in backend tests were faked.

## Reminder email delivery repair (2026-11-16)
- Root causes on the configured local instance: no reminder preferences existed for the sole account, and neither a scheduler process nor a Windows scheduled task was running. The queue listener does not replace the scheduler. Gmail SMTP was already correctly configured and authenticated successfully; no credentials were changed or printed.
- At the user's request, enabled daily reminders at 19:00 in Africa/Nairobi for the sole verified account, including all seven weekdays. A separate reminder delivery test was accepted by Gmail SMTP and the user confirmed it arrived in Inbox. That test did not claim or consume the scheduled daily delivery.
- Installed the hidden Windows task `BibleTracker-ReadingReminders`, running `schedule:run` every minute with `C:\xampp\php\php.exe`, the workspace as its working directory, the current user's interactive token and limited privileges. The trigger repeats indefinitely; it persists across restarts. Task state/last result were verified (`Ready`, exit 0), including subsequent automatic executions.
- Added reproducible `scripts/install-reminder-scheduler.ps1` and `scripts/run-scheduler.ps1`. The installer refuses to replace a task belonging to another project. Executions are hidden, overlapping task instances are ignored, and output is written under ignored `storage/logs/scheduler.log`.
- The current task runs while this Windows user is signed in and the PC is awake. It is not an always-on production host. Missed reminder windows retain the existing 15-minute policy rather than sending hours late. Hosting/scheduling on an always-on deployment remains open.
- Added a bounded SMTP timeout (`MAIL_TIMEOUT`, default 15 seconds). No mail passwords or other secrets were added to tracked files.
- `php artisan test --compact tests/Feature/ReadingReminderTest.php`: all 16 tests passed, 118 assertions. Both PowerShell scripts parsed successfully and the installed runner executed successfully. Diff whitespace and targeted PHP formatting checks passed.
- Verified the saved real schedule with a future-time dry run: exactly one reminder due at 2026-11-16 19:00 Africa/Nairobi; zero daily-delivery records were created by the check. Next scheduled reminder remains available for its actual delivery time.

## Reminder scheduler window fix (2026-11-16)
- Paused the every-minute Windows reminder task after the user reported recurring PowerShell windows. Other PowerShell sessions were not stopped.
- Replaced the direct console action with `wscript.exe //B //NoLogo` and `scripts/run-scheduler-hidden.wsf`. The windowless host launches the existing runner with window style 0 and waits for its exit code. Updated the installer so reinstalling preserves this fix.
- Re-enabled the task and observed no visible runner windows during the verification run. Subsequent automatic runs updated `storage/logs/scheduler.log` with successful exit 0. Daily 19:00 Africa/Nairobi reminders remain enabled; no additional test emails were sent.
- Verified installer PowerShell parsing, launcher XML parsing, task action and real scheduler execution. Application PHP and reminder timing logic were unchanged; no further application test run was needed for this launcher-only fix.


## Reading music (2026-11-21)
- Added a server-discovered audio library in `public/songs/`. Supported audio filenames become natural-sort song titles; URLs are encoded. Hidden files, non-audio files, subfolders and symbolic links are ignored. Empty or missing libraries return no songs.
- Added the reader song selector and native audio controls with explicit playback, no preload, and playback-error feedback. Starting songs cancels chapter narration; starting or resuming narration pauses music. Changing songs and leaving the reader pause audio. Stale speech callbacks cannot reset a newer narration session.
- Documented adding/deploying public song files in README. No database migration, upload endpoint, dependency or sample song was added.
- Targeted PHP tests passed (6 tests, 40 assertions), TypeScript and changed frontend lint passed, production build passed, and PHP static analysis passed with zero errors.
- Headless Chrome checks used synthetic page data, a generated WAV and mocked speech synthesis: song/narration mutual exclusion, narration pause/resume, song switching, playback failure feedback, navigation cleanup, empty library and mobile/desktop layouts. This does not establish real speech-engine or physical-device codec behavior. Review runner/screenshots are in ignored `storage/app/private/ui-review/music-review.mjs` and `storage/app/private/music-review/`.

- Full regression suite: 183 passed, 4 skipped (1,537 assertions across 187 tests). Disabled external SSR calls in the shared HTTP test setup after the running local Vite server caused five unrelated stray-request failures; application SSR configuration was unchanged. Final whitespace checks passed.


## Continuous reading music (2026-11-21)
- Previous/next chapter links preserve reader state and the existing audio element. Chapter changes still cancel the old chapter narration, but do not pause or restart a song. Paused songs keep their position while navigating.
- Added an explicit Stop song button that pauses and rewinds. Narration still pauses music, and leaving the reader releases playback.
- TypeScript, changed frontend lint, production build and whitespace checks passed. Headless Chrome with real generated WAV playback and mocked speech confirmed both chapter directions, audio identity/time preservation, paused-state preservation, Stop song, mutual exclusion and leaving-reader cleanup. Runner: ignored `storage/app/private/ui-review/continuous-music-review.mjs`.
