# Kirtan

A Next.js application backed by Prisma + Supabase (Postgres + Storage).

## 1) Prerequisites

- Node.js 20+
- npm 10+
- A Supabase account

## 2) Supabase project setup (step-by-step)

### Step 1: Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New project**.
3. Choose your organization, set a project name, database password, and region.
4. Wait for provisioning to complete.

### Step 2: Get your database connection string for Prisma

1. In Supabase, open your project.
2. Go to **Project Settings → Database**.
3. Find **Connection string** and copy the URI.
4. Use that value for `DATABASE_URL` in your `.env` file.

> Tip: Prisma usually works best with the direct Postgres connection string, with `sslmode=require`.

### Step 3: Get your Supabase URL and API keys

1. Go to **Project Settings → API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Create a storage bucket for PDF uploads

1. Go to **Storage** in Supabase.
2. Click **Create bucket**.
3. Name it to match `SUPABASE_PDF_BUCKET` (default in this repo: `pdfs`).
4. Choose visibility:
   - **Public** if PDFs should be publicly accessible.
   - **Private** if access must be restricted.

### Step 5: Configure storage policies (if bucket is private)

If you keep the bucket private, add Row Level Security policies for `storage.objects` so your app can upload/read as needed.

Typical pattern:
- `SELECT` policy for authenticated/public users as required.
- `INSERT` policy for trusted users or service role operations.
- `DELETE/UPDATE` policies only if your app supports them.

If uploads are done only server-side with `SUPABASE_SERVICE_ROLE_KEY`, keep policies strict and avoid exposing service role credentials to the client.

## 3) Environment variables

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Fill in all values from your Supabase project:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PDF_BUCKET`
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`
- `PORT`

## 4) Local development

### Install dependencies

```bash
npm install
```

### Generate Prisma client

```bash
npm run prisma:generate
```

### Run database migrations

```bash
npm run prisma:migrate
```

### Seed the database

```bash
npm run prisma:seed
```

### Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5) Cloudflare Pages deployment

### Step 1: Connect repository

1. In Cloudflare dashboard, go to **Workers & Pages → Create application → Pages → Connect to Git**.
2. Select this repository and branch.

### Step 2: Build configuration

Use the Next.js-on-Pages build flow:

- **Framework preset:** `None` (custom)
- **Build command:** `npx @cloudflare/next-on-pages@1`
- **Build output directory:** `.vercel/output/static`
- **Root directory:** repository root (default)

`@cloudflare/next-on-pages` runs a Next.js build and prepares the output Pages expects.

### Step 3: Configure environment variables in Pages

In **Pages → Your project → Settings → Environment variables**, add the same variables as local `.env` (for both Preview/Production as needed):

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PDF_BUCKET`
- `NEXT_PUBLIC_APP_URL` (set this to your Pages domain)
- `NODE_ENV=production`

### Step 4: Prisma migration strategy for deploys

Cloudflare Pages build containers are ephemeral, so handle migrations outside of request-time code.

Recommended strategy:

1. Keep migration files in `prisma/migrations` committed to git.
2. Before (or immediately after) each production deploy, run:

```bash
npx prisma migrate deploy
```

3. Run this command from CI (e.g., GitHub Actions) using production `DATABASE_URL`.
4. Avoid `prisma migrate dev` in CI/production; use `migrate deploy` only.

Optional CI order:
1. Install dependencies
2. `npx prisma generate`
3. `npx prisma migrate deploy`
4. Build/deploy to Cloudflare Pages

---

If you change database schema locally, create a new migration with `npm run prisma:migrate`, commit it, and let CI apply it in production via `prisma migrate deploy`.
