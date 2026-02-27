# Sanatan Prompter

Mobile-first and desktop-friendly teleprompter for Hindi/Devanagari devotional texts with singer-friendly **Romanized (Latin)** output.

## Stack
- Next.js App Router + TypeScript
- Tailwind + shadcn-style UI components
- Prisma + PostgreSQL (Supabase)
- Supabase Storage (PDF uploads)

## Features
- `/library`: search, tag filtering, cards and quick open/edit links.
- `/upload`: two-step upload + review workflow with PDF extraction.
- `/t/[slug]`: teleprompter with autoscroll, mode toggles, shortcuts, fullscreen, mirror, and localStorage settings.
- `/edit/[id]`: edit lines, save new version and view version history.

## Romanization Rules
- Label is **Romanized (Latin)** (not translation).
- No diacritics.
- Title Case output.
- Special case: `श्री` => `Shri`.
- Warns if Devanagari leaks into romanized lines.

## Local setup
1. `cp .env.example .env`
2. `npm install`
3. `npx prisma generate`
4. `npx prisma migrate dev`
5. `npm run prisma:seed`
6. `npm run dev`

## Supabase setup (step-by-step)
1. Create a Supabase project at https://supabase.com.
2. Open **Project Settings → API**:
   - copy project URL into `SUPABASE_URL`
   - copy anon key into `SUPABASE_ANON_KEY`
   - copy service role key into `SUPABASE_SERVICE_ROLE_KEY`
3. Open **Project Settings → Database** and copy PostgreSQL connection string to `DATABASE_URL`.
4. Create storage bucket:
   - go to **Storage**
   - create bucket `pdfs` (or set custom name and update `SUPABASE_STORAGE_BUCKET`)
5. Ensure the service role key is only used server-side.

## Cloudflare Pages deployment
1. Push repo to Git provider.
2. In Cloudflare Pages, create a new project from the repo.
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
4. Keep `wrangler.toml` in the repo so Cloudflare picks up Worker compatibility settings (`nodejs_compat`) during deploy.
5. Add environment variables from `.env.example` in Pages settings.
6. Run DB migrations from CI/CD or manually before first production run:
   - `npx prisma migrate deploy`
7. Deploy.

## Useful commands
- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
