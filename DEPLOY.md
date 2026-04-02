# Deployment Targets

Use the deployment flow that matches your target platform:

- Vercel: `npm run build:vercel`
- VPS: `npm run build:vps` then `npm run db:deploy` during rollout

Do not mix the two flows.

## Vercel Deployment

Deploy this app to Vercel with a managed PostgreSQL database and environment
variables configured in the Vercel project.

### Required Build Command

Use:

```bash
npm run build:vercel
```

This runs:

1. `prisma migrate deploy`
2. `next build`

### Required Environment Variables (Vercel Project)

Set these in Vercel for the target environments you use (Production/Preview):

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_API_URL`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

### Vercel Notes

- Use `prisma migrate deploy` for deploys. Do not use `prisma migrate dev`.
- If the deployment fails, inspect logs from the failing deployment ID:

```bash
npx vercel inspect <deployment-id> --logs
```

## VPS Deployment

Deploy this Next.js app to a Linux VPS with Nginx as a reverse proxy and
`systemd` managing the Node process. PostgreSQL is hosted by a managed provider;
the app itself is stateless.

## Prerequisites

On the VPS (Ubuntu 22.04 / Debian 12 recommended):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
node -v   # must be 20.x or later
```

## Directory Layout

```
/var/www/rockbaybooty/    ← app root (git clone here)
  .env.production         ← secret env file, never commit this
  .next/                  ← built app output
  public/                 ← static assets
  deploy/                 ← service and Nginx config templates
```

## Environment Variables

Create `/var/www/rockbaybooty/.env.production` on the VPS (mode `640`, owned
by the service user — typically `www-data`):

```env
# Required
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
JWT_SECRET="replace-with-a-random-string-of-at-least-32-characters"
NEXT_PUBLIC_API_URL="https://your-domain.com"

# LiveKit (required for /chat live room)
LIVEKIT_URL="wss://your-livekit-server.livekit.cloud"
LIVEKIT_API_KEY="your-api-key"
LIVEKIT_API_SECRET="your-api-secret"

# SMTP transactional email
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="you@your-domain.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="RockBayBooty <you@your-domain.com>"

# Optional feature flags
# MAX_MEMBER_COUNT=500
# CLOSED_GROUP_ENABLED=false
# REQUIRE_SIGNUP_INVITE=true
```

`NODE_ENV=production` is set in the systemd unit file and must **not** appear
in `.env.production` to avoid conflicts.

## Database

Provision a PostgreSQL 15+ instance at a managed host (Neon, Supabase, Railway,
or DigitalOcean Managed Postgres).

Run migrations before the first deploy — from your workstation or the VPS:

```bash
DATABASE_URL="your-production-database-url" npm run db:deploy
```

Never use `prisma migrate dev` in production.

## First Deploy

```bash
# 1. Clone, install, build
git clone https://github.com/deenyx/rockbaybooty.git /var/www/rockbaybooty
cd /var/www/rockbaybooty
npm ci --omit=dev
npm run build:vps

# 2. Run database migrations
NODE_ENV=production npm run db:deploy

# 3. Install the systemd service
sudo cp deploy/rockbaybooty.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable rockbaybooty
sudo systemctl start rockbaybooty
sudo systemctl status rockbaybooty

# 4. Configure Nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/rockbaybooty
# Edit the file: replace YOUR_DOMAIN with your actual domain name
sudo nano /etc/nginx/sites-available/rockbaybooty
sudo ln -s /etc/nginx/sites-available/rockbaybooty \
           /etc/nginx/sites-enabled/rockbaybooty
sudo nginx -t && sudo systemctl reload nginx

# 5. Issue TLS certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 6. Create at least one active invite code
DATABASE_URL="..." npx prisma studio
# Create an InviteCode record: code = YOURCODE, status = active
```

## Subsequent Deploys

```bash
cd /var/www/rockbaybooty
git pull
npm ci --omit=dev
npm run build:vps
NODE_ENV=production npm run db:deploy
sudo systemctl restart rockbaybooty
```

## Logs

```bash
sudo journalctl -u rockbaybooty -f            # live log tail
sudo journalctl -u rockbaybooty --since today  # today's entries
```

## Rollback

```bash
git log --oneline                    # find the prior commit
git checkout <prior-commit-hash>
npm ci --omit=dev && npm run build
sudo systemctl restart rockbaybooty
```

## Validation Checklist

After deploy, verify:

1. Landing page loads at your domain over HTTPS.
2. HTTP redirects to HTTPS automatically.
3. A valid invite code passes the onboarding gate.
4. Onboarding creates a user and redirects to `/dashboard`.
5. Protected routes (`/dashboard`, `/profile`, `/search`, `/chat`) redirect to
   `/welcome` when accessed without an auth cookie.
6. Logout clears the session.
7. `/api/chat/token` returns a valid LiveKit token and the live room connects.
8. Email delivery works (check `journalctl` if emails are missing).

## Media Storage

Profile photos are currently stored as base64 data URLs in the database.
This is fine for early deployments but does not scale with explicit media volume.

Before enabling broad media uploads, migrate to an object-storage provider that
explicitly permits lawful adult content:

1. Provision an S3-compatible bucket.
2. Add a server-side signed-upload endpoint that issues short-lived presigned
   PUT URLs — never accept raw uploads into the app process.
3. Store only the object key and metadata in the database (`prisma/schema.prisma`).
4. Serve media via short-lived presigned GET URLs to enforce access control and
   prevent direct public enumeration of objects.

## Hardening Checklist (post-first-deploy)

- [ ] Enable automatic daily PostgreSQL backups at your DB provider.
- [ ] Set up log rotation for `/var/log/nginx/`.
- [ ] Configure `ufw` or `iptables`: allow 22 (SSH), 80, 443; block everything else.
- [ ] Add Nginx `limit_req_zone` rate limiting (see `deploy/nginx.conf` comments).
- [ ] Monitor disk, memory, and service health with a simple uptime monitor.
- [ ] Rotate `JWT_SECRET` and LiveKit credentials after initial setup.