# UpgradeCafe Environment Variables & Configuration Guide

## 1. Required Variables Reference

| Variable | Description | Example / Default | Required in Production |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:pw@db.ref.supabase.co:5432/postgres` | **YES** |
| `BETTER_AUTH_SECRET` | 32+ character random secret for signing session tokens | Generate with `openssl rand -base64 32` | **YES** |
| `BETTER_AUTH_URL` | Base canonical application URL | `https://admin.upgradecafe.com` | **YES** |
| `NEXT_PUBLIC_APP_URL` | No longer needed; the auth client uses the current site origin | Leave unset | No |
| `BETTER_AUTH_API_KEY` | Better Auth Infrastructure API key used by the Dash plugin | Copy from your Better Auth Infrastructure project | Required to connect Dash |
| `BETTER_AUTH_API_URL` | Optional Better Auth Infrastructure API endpoint override | Use the endpoint shown in your project settings | No |
| `BETTER_AUTH_KV_URL` | Better Auth Infrastructure identify/KV endpoint for the server plugin | Use the identify endpoint shown in your project settings | No (recommended for Dash identification) |
| `NEXT_PUBLIC_BETTER_AUTH_KV_URL` | Public identify/KV endpoint used by the browser Sentinel client | Use the identify endpoint shown in your project settings | No (recommended for browser identification) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint for distributed rate limiting | `https://[project].upstash.io` | No (recommended for distributed limits) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST bearer token | `AX...` | No (recommended for distributed limits) |
| `R2_ACCOUNT_ID` | Cloudflare Account ID | `e2a4...` | No (required for real uploads) |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API token Access Key | `9a7b...` | No (required for real uploads) |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API token Secret Key | `8f1c...` | No (required for real uploads) |
| `R2_BUCKET_NAME` | R2 Bucket Name for assets | `upgradecafe-assets` | No (required for real uploads) |
| `R2_PUBLIC_URL` | Public CDN domain associated with the R2 bucket | `https://assets.upgradecafe.com` | No (required for public asset URLs) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud OAuth credentials | No (enables Google sign-in) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud OAuth credentials | No (enables Google sign-in) |
| `SUPER_ADMIN_EMAIL` | Initial Super Admin email provisioned via `npm run db:seed` | Your platform admin email | Required for first seed |
| `SUPER_ADMIN_PASSWORD` | Initial Super Admin password; at least 12 characters | Set a unique secret locally | Required for first seed |

Production startup fails when `DATABASE_URL` or `BETTER_AUTH_SECRET` is missing. Set `BETTER_AUTH_URL` to the deployed app URL for working authentication callbacks. The browser auth client uses the current site origin, so it works on localhost and Vercel without `NEXT_PUBLIC_APP_URL`. Redis and R2 can be connected later; rate limiting uses an in-memory fallback without Redis, while real asset uploads require R2. Google sign-in is enabled only when both Google variables are set. Use `npm run db:admin` only when you intend to create or reset the configured Super Admin password.

---

## 2. Setting Up External Services

### A. Supabase (PostgreSQL)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** → **Database**.
3. Copy the **Connection String (URI)** and set it as `DATABASE_URL`.

### B. Upstash Redis (Rate Limiting)
1. Create a Redis database at [upstash.com](https://upstash.com).
2. Under the **REST API** section, copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. If not configured during local dev, an in-memory sliding-window fallback is used automatically.

### C. Cloudflare R2 (Storage)
1. In the Cloudflare dashboard, navigate to **R2**.
2. Create a bucket named `upgradecafe-assets`.
3. Go to **Manage R2 API Tokens** and create a token with **Object Read & Write** permissions.
4. Copy `Account ID`, `Access Key ID`, and `Secret Access Key`.
5. Connect a custom domain or enable the public R2 dev URL for `R2_PUBLIC_URL`.
