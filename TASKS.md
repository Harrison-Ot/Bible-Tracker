# Bible Tracker tasks

Updated: 2026-11-14

Status: [ ] planned, [x] complete. Phases 1 and 2 are implemented and verified with automated checks and synthetic browser data. The Phase 3 reminder batch is also implemented. Physical-device/live-data review and the remaining phases are planned.

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

## Phase 3 - Reminders and saved verses
- [x] Store reminder time, timezone, reading days and opt-in preferences, with verified-account settings and validation.
- [x] Schedule email reminders with per-local-date duplicate prevention, dry-run support, and signed unsubscribe confirmation.
- [ ] Configure and verify the deployment scheduler and mail transport with a controlled live-delivery check.
- [ ] Sync highlights and bookmarks to each user's account.
- [ ] Import existing device highlights without duplicates.
- [ ] Add a searchable saved-verses library.

## Phase 4 - Flexible plans and reports
- [ ] Add custom reading goals and schedules.
- [ ] Add plan pause/resume and catch-up options that preserve completed readings.
- [ ] Add progress reports for unique chapters, books and weekly activity.
- [ ] Add useful completion feedback and milestones.

## Phase 5 - Group reading
- [ ] Implement group creation, invitations, membership and roles.
- [ ] Add shared reading plans and passage discussions.
- [ ] Add privacy controls and moderation for group content.

## Phase 6 - Offline passages
- [ ] Confirm translation permissions and define downloadable content limits.
- [ ] Add explicit passage downloads and offline availability indicators.
- [ ] Add download management and storage controls.
- [ ] Queue offline reading logs and handle synchronization without duplicates.

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

- Reader preferences save on the current device under an account-specific key. Highlights keep their existing storage format for the later synchronization/import work.
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