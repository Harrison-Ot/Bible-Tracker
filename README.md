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

- The dashboard provides all 66 books, chapter validation, a reading heatmap, streaks, and a paginated journal with reflections and entry removal.
- Reading dates cannot be in the future. Existing future records are excluded from streaks and the heatmap.
- The reader preserves the translation across navigation and stops at the final chapter. Verse highlighting supports keyboard activation and stays in browser storage.
- The daily verse rotates through a bundled KJV selection without an external request.
- Bible text is fetched from bible-api.com and cached on the server for 30 days. Uncached passages require connectivity. Network failures and invalid provider responses produce controlled errors.
- Journal entries belong to the signed-in user; other users cannot delete them. Chat requires an accepted connection.
- The service worker offers an offline fallback and static asset caching. It does not provide a fully offline Bible.

Set `APP_DEBUG=false`, HTTPS, production mail, durable storage, scheduled backups, and appropriate database credentials before deployment. Never commit `.env` or account secrets.
