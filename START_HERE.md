# MySQL Exam Studio — complete source

A 65-question MySQL examination app with timed attempts, automatic objective scoring, written-answer self-review, and a downloadable PDF report card.

Live app: https://mysql-exam-studio.higgsfield.app

## What is included

- All 65 questions across seven sections, with server-side model answers and rubrics.
- Exam workspace, 90-minute timer, autosave, navigation, flags, and submission.
- Private same-browser attempt history and report pages.
- Objective scoring (50 marks) and written self-review (50 marks).
- Section and topic results, mistake reflections, PDF export, and print support.
- Complete React / TanStack Start source, styles, assets, vendored workspace packages, dependency lockfile, SQL schema, and tests.
- A separate local Worker configuration added for this export.

The app teaches MySQL. Its application database is Cloudflare D1 (SQLite); the migration is not a MySQL server schema. Written marks are self-reviewed using rubrics, not independently certified. Totals remain pending until written review is completed.

## Requirements

Use Node.js 22.12 or newer within the Node 22 release line, plus Bun. Dependency installation requires internet access. Commands below run from the extracted project's app directory.

## Install and check

    cd MySQL-Exam-Studio/app
    bun install --frozen-lockfile
    bun test tests/exam.test.ts
    bun run build

Keep the packages directory: those workspace packages are part of the source and are required by the build. The build outputs the server Worker to dist/server/server.js and static assets to dist/client.

## Run the complete app locally

The database-backed API needs the Cloudflare Worker runtime. The archive includes wrangler.local.jsonc with a local-only DB binding and placeholder database ID.

After the install and build steps above:

    bunx wrangler@4 d1 migrations apply mysql-exam-local --local --config wrangler.local.jsonc
    bunx wrangler@4 dev --config wrangler.local.jsonc --local --local-protocol https

Open the HTTPS localhost URL printed by Wrangler. Wrangler uses a development certificate; your browser may display a local certificate notice. The HTTPS configuration supports the application's Secure session cookie. Use the same browser profile for saved attempts.

These commands create a local SQLite-backed D1 database. They do not connect to the live site's database. Rebuild with bun run build and restart the Worker after editing source. Local runtime steps are supplied for setup; the production build and automated app tests were verified before export.

For UI development, bun run dev starts Vite. It is not the complete database-backed Worker runtime; use Wrangler above for exam saving and reports.

## Deploy

The existing app is already deployed on Higgsfield. Its app.manifest.json enables the D1 database; Higgsfield provisions the binding and generates its deployment configuration. The original wrangler.jsonc is retained unchanged.

For independent Cloudflare hosting, create your own D1 database, configure the DB binding with your database ID, apply migrations, and deploy the built Worker with its static assets. Do not deploy the local placeholder configuration unchanged.

## Key files

| File | Purpose |
| --- | --- |
| app/src/lib/question-bank.server.ts | All questions, correct answers, and rubrics |
| app/src/lib/scoring.server.ts | Objective marking and grade calculation |
| app/src/lib/exam.server.ts | Attempt, answer, review, and report API logic |
| app/src/routes/api/exam.ts | API endpoint and D1 binding |
| app/src/routes/index.tsx | Start page |
| app/src/routes/exam.tsx | Exam workspace |
| app/src/routes/reports.tsx | Attempt history and reports |
| app/src/lib/report-pdf.ts | PDF report-card export |
| app/src/exam.css | App styling |
| app/migrations/0001_mysql_exam.sql | Application database schema |
| app/tests/exam.test.ts | Automated behavior tests |
| app/wrangler.local.jsonc | Local full-stack runtime configuration |
| app/packages/ | Required vendored packages |

## Export notes

This archive contains all tracked files from the deployed source revision, plus this guide, the local runtime configuration, and SOURCE_VERSION.json. It excludes installed node_modules, build output, Git history, credentials, and live exam records. Install dependencies before running.

Verification before export: 5 tests passed, 182 assertions passed, and the production build completed successfully. Answer keys stay on the server during an active exam. Source recipients can inspect them in the question bank.

The supplied question 54 was corrected to delete only today's orders with a date condition. Incomplete question text for 57 and 58 was completed, and model answers for 61–65 were included.
