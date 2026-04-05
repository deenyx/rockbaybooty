# Quick Start Guide

## 1️⃣ Install Dependencies
```bash
npm install
```

## 2️⃣ Setup PostgreSQL Database

### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker run --name socialnet-db \
  -e POSTGRES_DB=social_network \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Wait a few seconds for it to start
```

### Option B: Local PostgreSQL
Create database manually:
```bash
createdb social_network
```

## 3️⃣ Environment Configuration
```bash
# Copy example env
cp .env.example .env.local

# Edit .env.local with your database credentials
# DATABASE_URL="postgresql://postgres:password@localhost:5432/social_network"
# JWT_SECRET="replace-with-long-random-secret"
# NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
# NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="unsigned-upload-preset"
```

## 4️⃣ Database Migration
```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# This will create all tables
```

## 5️⃣ Create Invitation Codes
```bash
# Open Prisma Studio
npx prisma studio

# Click on "InviteCode" table
# Click "Add record"
# Fill:
#   - code: "DEMO123" (or any code)
#   - status: "active"
# Click "Save"
```

## 6️⃣ Start Development Server
```bash
npm run dev
```

Navigate to: **http://localhost:3000**

## 🧪 Test the Flow

1. **Landing Page** → `http://localhost:3000`
   - Click "Get Started" or "Join Now"
   - Enter passcode: `DEMO123`

2. **Onboarding** → `http://localhost:3000/onboarding?passcode=DEMO123`
   - Fill out interview questions (9 steps)
   - Click "Complete"

3. **Dashboard** → `http://localhost:3000/dashboard`
   - Welcome page (placeholder for features)

## 📂 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── onboarding/        # Onboarding flow
│   ├── dashboard/         # Protected dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/landing page
│   └── globals.css        # Global styles
├── lib/
│   ├── constants.ts       # Config constants
│   ├── types.ts           # TypeScript types
│   └── api.ts             # API utilities
└── middleware.ts          # Auth middleware

prisma/
└── schema.prisma          # Database schema
```

## 🗄️ Database Tables

- **User** - Account info, passcodes, status
- **Profile** - Demographics, interests, photos
- **InviteCode** - Access codes for new users
- **OnboardingResponse** - Saved interview answers
- **Group** - Community groups
- **ChatRoom** - Messaging channels
- **Classified** - Marketplace listings

## 🔧 Useful Commands

```bash
# View/manage database GUI
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Generate new code after schema change
npx prisma generate

# View database schema
npx prisma db push

# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Format code
npx prettier --write .

# TypeScript check
tsc --noEmit
```

## 🚀 Next Steps After Getting Started

1. **Create More Test Accounts**: Generate additional invite codes and test multiple user flows
2. **Customize Colors**: Edit `tailwind.config.ts` to match your branding
3. **Add Password Setup**: Modify onboarding to require password entry
4. **Email Integration**: Setup SendGrid/Mailgun in `.env.local`
5. **Member Search**: Build the member discovery page
6. **Profile Photo Upload**: Integrate image storage (Cloudinary/S3)

## ⚠️ Common Issues

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# or specify different port
npm run dev -- -p 3001
```

**Database connection error:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env.local
- Ensure database exists: `psql -l`

**Prisma migration error:**
```bash
# Reset schema (wipes database)
npx prisma migrate reset

# Or manually delete prisma/migrations folder
```

**Module not found:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## 📞 Troubleshooting

1. Check Node version: `node --version` (should be 18+)
2. Clear cache: `npm cache clean --force && rm -rf node_modules`
3. Reinstall: `npm install`
4. Check logs: `npm run dev` output for errors

## 📖 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Ready to develop!** Start with the landing page at `http://localhost:3000`
