# BMS end-to-end tests (local only)

Never point these at production.

1. Start Postgres and the dummy inbox:
   `docker compose -f woodland-server-nest/docker-compose.local.yml up -d`
   Mailpit web inbox: http://localhost:8025 (SMTP on :1025).
2. Start the server with mail pointed at Mailpit, never at the live Office365 account:
   ```powershell
   $env:SMTP_HOST="localhost"; $env:SMTP_PORT="1025"; $env:SMTP_USER="x"; $env:SMTP_PASS="x"
   $env:MAIL_FROM="bms@bms.test"; $env:MAIL_REDIRECT_TO=""; $env:MAIL_DISABLED="false"
   cd woodland-server-nest; npx prisma migrate deploy; npm run start:dev
   ```
3. Run everything: `cd woodland_client; E2E_API_URL=http://127.0.0.1:5002/api npx playwright test tests/e2e --workers=1`
   (the local server listens on 5002; `--workers=1` stops two files logging in as admin at once).
   Files: `bms.flow` (landlord/contractor/session), `bms.ui` (browser), `bms.modules` (every module + occupancy), `bms.transactions` (transaction edge cases).

Optional env: `E2E_API_URL`, `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`, `MAILPIT_URL`,
`E2E_LANDLORD_EMAIL` (a specific landlord address instead of a generated one; it must
not already exist). The five test mailboxes (landlord, contractor, finance1, finance2,
basic) are created per run and can be read in the Mailpit web inbox.
