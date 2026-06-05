# Admin Control Panel v1

## Goals
- Give admins a fast safety and account-ops cockpit.
- Keep moderator powers narrower than admin powers.
- Make every action auditable.
- Start with low-risk, high-value controls that fit current schema.

## Role Model

### Support
- Read-only account lookup.
- Password-reset and login-help workflows.
- No suspensions or role changes.

### Moderator
- Review reports and moderation queue.
- Warn/suspend/reactivate standard members.
- Add case notes and resolution reason.
- No role escalation and no admin account edits.

### Admin
- Everything moderators can do.
- Manage moderator assignments.
- Manage account status for non-supreme members.
- Access safety analytics and abuse patterns.

### Supreme Admin
- Full staff and policy control.
- Can modify admin accounts and override policy locks.
- Break-glass actions and platform emergency controls.

## v1 Screens

### 1) Admin Home
- KPI cards:
  - Total members
  - Active members
  - Suspended members
  - Burner accounts
  - Onboarding not completed
- Member controls table (latest 25 users):
  - Display name + username
  - Role
  - Status
  - Email verified
  - Message count, video count
  - Joined date
  - Last-seen proxy (updatedAt)
- Fast action:
  - Suspend/reactivate member

### 2) Members Detail (v1.1)
- Search and filters:
  - Role, status, email verified, onboarding step
- Member 360 panel:
  - Account timeline
  - Safety actions and notes
  - Messaging/video velocity indicators

### 3) Reports Queue (v1.2)
- Open, under review, resolved tabs
- Severity level and SLA timer
- Action templates and close reasons

## Data Access Rules

### Moderator can see
- Public profile fields
- Account status and moderation history
- Report counts and latest incidents

### Admin can additionally see
- Cross-account abuse indicators
- Full action timeline
- Staff notes and internal risk flags

### Restricted by default
- Full private contact details
- Raw device fingerprint and full IP history
- Internal risk model internals

## v1 Actions (Current Build)
- Suspend member
- Reactivate member
- Prevent non-supreme admins from changing supreme admin status
- Prevent self-suspension

## v1 API Surface

### PATCH /api/admin/members/:memberId/status
Request body:
```json
{ "status": "active" }
```
or
```json
{ "status": "suspended" }
```

Rules:
- Requires authenticated admin or supreme admin.
- Standard admin cannot modify supreme admin.
- Actor cannot modify own status.

## Audit Requirements (Next)
- Create immutable `AdminAuditLog` table:
  - id
  - actorUserId
  - targetUserId
  - action
  - beforeState (json)
  - afterState (json)
  - reason
  - createdAt
- Log every state mutation from admin APIs.

## Suggested Prisma Additions (Next)
- `Report` model:
  - reporterId, targetId, reason, details, status, reviewedBy, reviewedAt, actionTaken
- `Block` model:
  - blockerId, blockedId, createdAt
- `ModerationCase` model:
  - targetId, severity, state, assignedTo, summary, openedAt, closedAt
- `AdminAuditLog` model:
  - immutable events for compliance and rollback analysis

## Rollout Plan
1. v1 (now): admin home, member status actions, role gating.
2. v1.1: member search + member 360 detail.
3. v1.2: reports queue + case management.
4. v1.3: analytics dashboards + policy automation.

## Security Notes
- Keep role checks server-side only.
- Never trust role claims from client payloads.
- Enforce least privilege by role.
- Add rate limits to admin mutation endpoints.
- Require reason text for every punitive action in v1.1.
