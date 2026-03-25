# Vercel Deployment

This app deploys cleanly to Vercel if you set up PostgreSQL, environment variables, and Prisma migrations correctly.

## Requirements

- A Vercel project connected to this repository
- A PostgreSQL database reachable from Vercel
- At least one active invite code in the production database

## Recommended Stack

- Hosting: Vercel
- Database: Neon, Supabase, Railway, or Vercel Postgres

## Required Environment Variables

Add these in Vercel Project Settings -> Environment Variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
JWT_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
NEXT_PUBLIC_API_URL="https://your-project-name.vercel.app"
```

Notes:

- `DATABASE_URL` must point at your production Postgres database.
- `JWT_SECRET` should be a strong random secret.
- `NEXT_PUBLIC_API_URL` is optional for this codebase because client API helpers support same-origin requests. Set it if you want an explicit canonical origin.

## Prisma In Production

Do not use `prisma migrate dev` in production.

Use:

```bash
npm run db:deploy
```

This repository includes:

- `postinstall`: runs `prisma generate`
- `db:deploy`: runs `prisma migrate deploy`
- `vercel-build`: runs `prisma migrate deploy && next build`

## Vercel Settings

Recommended settings in Vercel:

- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run vercel-build`

If you prefer to run database migrations manually, you can leave the Vercel build command as the default build and run `npm run db:deploy` yourself before the first production deploy.

## First Production Deploy

1. Create the production database.
2. Add the environment variables in Vercel.
3. Run production migrations.
4. Deploy the app.
5. Create at least one active invite code.
6. Test onboarding, login, dashboard access, and logout.

## Running Production Migrations Manually

From your machine:

```bash
DATABASE_URL="your-production-database-url" npm run db:deploy
```

## Create An Invite Code

You need at least one active invite code in production or onboarding will reject everyone.

One option is Prisma Studio:

```bash
DATABASE_URL="your-production-database-url" npx prisma studio
```

Create an `InviteCode` record with:

- `code`: `DEMO123` or another code
- `status`: `active`

## Validation Checklist

After deploy, verify:

1. The landing page loads.
2. A valid invite code passes the gate.
3. Onboarding creates a user and profile.
4. The dashboard loads for the new user.
5. Logout clears access to protected routes.

## Current Repo Notes

- Production builds already pass locally with `npm run build`.
- `npm run lint` is not yet a reliable deployment check because the workspace does not have a finalized ESLint setup.