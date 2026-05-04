---
description: "Use when editing auth routes, onboarding APIs, Prisma schema, middleware, or shared API contracts. Covers server-side validation, response shape, protected routes, and schema synchronization."
applyTo: "src/app/api/**/*.ts,prisma/**,src/middleware.ts,src/lib/api.ts,src/lib/constants.ts,src/lib/types.ts"
---
# API, Auth, And Data Contracts

- Keep `prisma/schema.prisma`, request validation, shared types/constants, and API responses in sync when changing onboarding or authentication behavior.
- Validate invite codes on the server against `InviteCode`. Client-side checks can improve UX, but they must not replace server-side validation.
- Preserve the current response pattern: success returns JSON payloads, failure returns `{ error: string }` with an appropriate status code.
- Personal codes must remain unique. If you change generation logic, keep a collision check before persisting the user.
- Middleware currently expects an `auth-token` JWT, but the onboarding route does not issue one. Do not assume onboarding creates an authenticated session unless you implement token creation and storage end to end.
- If you add a protected page or authenticated API flow, update `src/middleware.ts` and keep route constants aligned with the new behavior.
- After Prisma schema changes, run `npm run db:migrate` and manually verify the affected flow with a real invite code from Prisma Studio.