# fuxem Next Coding Tasks

## Onboarding & Profiles
- Update onboarding flow to include crossdresser-centric options (pronouns, gender, intentions)
- Add profile privacy settings (public, members-only, private)
- Ensure profile edit UI supports all new fields

## Chat & Video Rooms
- Refine chat/video UX for consent (e.g., explicit accept for private calls/messages)
- Add block/report options to chat UI
- Test camera/mic permissions and reconnect behavior

## Groups & Classifieds
- Scaffold group and classifieds modules if not present
- Add moderation tools for posts and group management

## Discovery & Search
- Implement search filters (interests, location, kinks, relationship type)
- Add online status and verification filters

## Moderation & Safety
- Implement reporting and blocking everywhere
- Create moderation dashboard for admin users
- Display and enforce community guidelines

## Documentation
- Keep README, roadmap, and user flows up to date as features evolve

---

These tasks should be prioritized based on user feedback and MVP requirements.

## Handoff Snapshot (May 21, 2026)
- Active implementation scope: `werk/`.
- Repo root includes multiple copies/snapshots, so confirm target before editing.
- `werk/src/app/welcome/page.tsx` must remain unchanged unless explicitly requested.
- Last accidental formatting-only change on welcome page was reverted.
- Working tree was clean after that revert.

## Handoff Snapshot (Auth Update)
- Access codes now enforced in API: `0000`, `5555`, `9999` only.
- `9999` now creates a burner preview session (7-day cookie) with middleware read-only API enforcement.
- Temporary admin entry added: `3333` on PIN box routes to `/admin_auth`.
- `/admin_auth` accepts one passphrase field and calls `/api/auth/admin-auth`.
- Default temporary passphrase is `alljackedup` (override via `TEMP_ADMIN_PASSPHRASE` in environment).
