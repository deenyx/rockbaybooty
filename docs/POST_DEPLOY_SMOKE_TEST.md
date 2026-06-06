# Post-Deploy Smoke Test Checklist

Run this checklist after every production deploy.

## Goal
- Catch critical flow regressions in under 5 minutes.
- Verify auth + media policy behavior did not break.

## 1. Basic Reachability
- Open `/welcome` and verify page renders.
- Open `/signup` and verify form loads.
- Open `/login` and verify form loads.
- Open `/camera` while logged in and verify camera module renders.

## 2. Signup + Auth
- Create a new test account via `/signup`.
- Verify API returns success and starter PIN is shown.
- Log in with credentials and verify redirect to dashboard.
- Confirm logout works and returns to welcome/login.

## 3. Camera + Media Capture
- Open `/camera`.
- Grant camera + microphone permissions.
- Capture one photo and verify success message.
- Record one short video and verify success message.

## 4. Profile Media Persistence
- Open `/profile`.
- Confirm newly captured photo appears in gallery.
- Confirm profile includes new video URL in API response:
  - `GET /api/member/profile`

## 5. Tier Policy Validation
- Paid member account:
  - Verify photo and video upload remain available.
- Free unpaid account:
  - Verify cap behavior at 10 photos and 3 videos.
- Burner account:
  - Verify photo-only behavior.
  - Verify burner photos are watermarked.
  - Verify burner cap blocks after 5 photos.

## 6. API Checks
- `GET /api/member/media` returns policy + counts.
- `POST /api/member/media` rejects over-limit uploads with 4xx.
- `POST /api/member/media` rejects burner video uploads.

## 7. Rollback Trigger
Roll back immediately if any of these fail:
- Signup returns 5xx.
- Login is broken for standard members.
- Camera cannot initialize for users with permissions granted.
- Tier limits are bypassed.

## Optional Automation
- Run automated policy tests:
  - `npm run test:media-policy`
- Run all tests:
  - `npm test`
