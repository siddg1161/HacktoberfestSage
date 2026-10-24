# Backend authentication setup

This API uses Better Auth with the existing PostgreSQL database. Email/password
accounts and sessions are stored in Better Auth tables; DukaanPay business and
worker records remain in the existing application tables.

## First deployment

1. Copy `.env.example` to `.env` for local work, or add the same values in the
   hosting provider's environment settings.
2. Set `DATABASE_URL` to the PostgreSQL connection string.
3. Generate and set a unique `BETTER_AUTH_SECRET` with at least 32 characters:

   ```sh
   openssl rand -base64 32
   ```

4. Set `BETTER_AUTH_URL` to the public Express API URL, for example
   `https://api.example.com`.
5. Set `TRUSTED_ORIGINS` to the comma-separated frontend URLs allowed to use
   the API, for example `https://app.example.com`.
6. From `Backend`, create the Better Auth PostgreSQL tables once:

   ```sh
   npm run auth:migrate
   ```

Do not run the migration from multiple deploy instances simultaneously. It is
best run once in a CI/CD release step or from a trusted administrator machine.

## Authentication flow

- Better Auth is available at `/api/auth/*`.
- The React client sends session cookies with API calls.
- `GET /api/business/me` resolves the signed-in user to their worker and
  business workspace.
- Business, inventory, quote, and worker-management routes require a valid
  session. Worker lists are tenant-scoped, and changes to a team require an
  owner or manager role.
- The legacy email/PIN login endpoints are no longer mounted.
