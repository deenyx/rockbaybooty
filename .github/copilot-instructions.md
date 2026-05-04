# Project Guidelines

## Architecture
- This is a Next.js App Router project. The entry route in `src/app/page.tsx` redirects to `/welcome`.
- The current user flow is `/welcome` -> `/onboarding?passcode=...` -> `POST /api/auth/onboard` -> `/dashboard`.
- UI pages live under `src/app/**`. Shared client-side types, constants, and API helpers live under `src/lib/**`.
- Database models are defined in `prisma/schema.prisma`. Keep API route behavior aligned with the Prisma schema before changing onboarding or auth flows.

## Build And Validation
- Install and environment setup are documented in `README.md` and `QUICKSTART.md`. Link back to those docs instead of duplicating setup steps.
- Use these commands when validating changes:
  - `npm run lint`
  - `npm run build`
  - `npm run db:migrate` when Prisma schema changes
  - `npm run db:studio` when inspecting or creating invite codes during development
- There is no automated test suite in the repo yet. If you change behavior, validate the affected route or flow manually.

## Conventions
- Use TypeScript and preserve the existing no-semicolon style.
- Prefer the `@/` path alias for imports from `src`.
- Reuse shared constants and types from `src/lib/constants.ts` and `src/lib/types.ts` when a value or shape is used in multiple places.
- Keep route additions synchronized across the app. If a page should require authentication, update `src/middleware.ts` and keep any route constants in sync.
- Keep API responses consistent with the current pattern in `src/app/api/auth/onboard/route.ts`: JSON success payloads on success and `{ error: string }` on failure.

## Auth And Onboarding Gotchas
- Middleware protects `/dashboard`, `/profile`, `/search`, `/chat`, and `/groups` by checking for an `auth-token` JWT in cookies or the `Authorization` header.
- The onboarding API currently does not issue a JWT yet. Do not assume a successful onboarding response creates an authenticated session without implementing token creation and storage.
- Invite-code validation happens server-side against `InviteCode`. Do not move that validation entirely to the client.
- Personal codes must remain unique. Preserve the uniqueness check if you change how personal codes are generated.
- The onboarding page currently defines its question list inline. If you refactor that flow, keep the UI fields, API payload, and Prisma writes aligned.

## Environment Notes
- `DATABASE_URL` and `JWT_SECRET` must be present for database and auth-related work.
- `NEXT_PUBLIC_API_URL` is used by `src/lib/api.ts`; keep it correct for the environment you are targeting.
- Development requires at least one active invite code in the database. Use Prisma Studio or SQL to create one before testing the onboarding flow.

## Key References
- `README.md` for product overview and schema intent
- `QUICKSTART.md` for local setup and manual verification steps
- `prisma/schema.prisma` for current data model
- `src/middleware.ts` for auth-protected routes
- `src/app/api/auth/onboard/route.ts` for onboarding response and validation behavior
