---
description: "Use when editing Next.js app UI files such as the welcome page, onboarding flow, or dashboard. Covers App Router client components, Tailwind styling, and keeping onboarding questions aligned with the API payload."
applyTo: "src/app/**/*.tsx"
---
# Frontend And Onboarding UI

- Preserve the existing visual direction on `/welcome` and `/onboarding`; extend the current Tailwind-based styling instead of replacing it with generic component-library patterns.
- Keep interactive pages as client components only when they use state, router APIs, search params, or browser APIs.
- The root route redirects to `/welcome`. Do not reintroduce product UI at `/` unless the navigation flow changes intentionally.
- If a page depends on `useSearchParams`, keep the Suspense pattern used by onboarding unless the route no longer needs client-side search param access.
- If you change onboarding questions, field names, or select options, update the submitted payload and keep it aligned with the onboarding API route and Prisma writes.
- When a value or label is shared across UI and server code, move it into `src/lib/constants.ts` instead of duplicating it in the page.
- Manually validate the real user path after UI changes: `/welcome` passcode entry, `/onboarding` completion, and the post-submit redirect.