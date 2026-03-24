# SocialNet - Social Networking Platform

An exclusive, invite-only social networking platform with passcode-based onboarding. Users can connect for dating, hookups, friendships, or networking.

## Features (Prioritized)

### ✅ Phase 1: Core - Landing Page & Onboarding (Current)
- **Landing Page**: Beautiful hero page with invite button
- **Passcode Entry**: Initial gate with passcode validation
- **Interview-Style Onboarding**: Multi-step form collecting:
  - Basic info (name, email, age)
  - Profile details (gender, location)
  - Interests & intentions (what they're looking for)
  - Optional bio and interests
- **Profile Creation**: Auto-generates unique personal passcode for user
- **Database Ready**: PostgreSQL schema for users, profiles, and invite codes

### 📋 Phase 2: Core Features (Coming Soon)
- Member Search & Discovery
- Video Chat Rooms
- Real-time Messaging
- Groups & Communities
- Classified Sections

## Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── onboard/route.ts       # Onboarding endpoint
│   │   ├── layout.tsx                     # Root layout
│   │   ├── globals.css                    # Tailwind + global styles
│   │   ├── page.tsx                       # Landing page
│   │   ├── onboarding/
│   │   │   └── page.tsx                   # Multi-step onboarding
│   │   └── dashboard/
│   │       └── page.tsx                   # User dashboard (placeholder)
│   └── components/                        # Reusable components (future)
├── prisma/
│   └── schema.prisma                      # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.example
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Personal Passcodes
- **Security**: bcryptjs for password hashing

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database:
```bash
createdb social_network
```

Copy `.env.example` to `.env.local` and update:
```
DATABASE_URL="postgresql://user:password@localhost:5432/social_network"
JWT_SECRET="your-secret-key-here"
```

### 3. Run Migrations
```bash
npx prisma migrate dev --name init
```

### 4. Generate Invite Codes

Use Prisma Studio to create invite codes:
```bash
npx prisma studio
```

Or create via database directly:
```sql
INSERT INTO "InviteCode" (code, status) VALUES ('INVITE123', 'active');
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Flow

1. **User lands on homepage** (`/`)
   - Sees landing page with "Join Now" button
   - Enters passcode in modal

2. **Passcode validated**
   - Redirects to `/onboarding?passcode=INVITE123`

3. **Interview-style onboarding**
   - Multi-step form with progress bar
   - Validates each step before proceeding
   - Final submission creates account

4. **Account created**
   - User gets unique personal passcode
   - Profile auto-created with interview responses
   - Invite code marked as used
   - Redirects to dashboard

## API Endpoints

### POST `/api/auth/onboard`
Creates a new user account after passcode validation.

**Request**:
```json
{
  "passcode": "INVITE123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "age": 28,
  "gender": "Male",
  "location": "New York, NY",
  "lookingFor": "Dating",
  "bio": "...",
  "interests": "travel,music,fitness"
}
```

**Response**:
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "personalCode": "ABC12345"
  }
}
```

## Database Schema

### Users Table
- `id`: Unique identifier
- `email`: User email (unique)
- `personalCode`: Generated code (unique)
- `passwordHash`: Hashed password
- `firstName`, `lastName`: Name
- `onboardingStep`: Current step (passcode, interview, completed)
- `status`: Account status (active, suspended, deleted)
- `createdAt`, `updatedAt`: Timestamps

### Profile Table
- `userId`: Foreign key
- `age`, `gender`, `location`: Demographics
- `bio`: User bio
- `interests`: Array of interests
- `lookingFor`: What user seeks (dating, hookups, friends, networking)
- `avatarUrl`, `photoUrls`: Media
- `isPublic`: Visibility in search

### InviteCode Table
- `code`: Unique invite code
- `status`: active, used, revoked
- `usedBy`: User ID who used it
- `createdAt`, `usedAt`: Timestamps

## Next Steps

1. **Add Password Creation**: Require users to set password during onboarding
2. **Email Verification**: Send verification emails
3. **Invite System**: Allow users to generate codes for friends
4. **Profile Photos**: Implement image upload
5. **Search Algorithm**: Build member discovery/search
6. **Authentication Middleware**: Protect dashboard routes
7. **Member Search Page**: Browse & match features

## Development Tips

- Use `npx prisma studio` to inspect database
- Check `next.config.js` for configuration options
- Tailwind classes available in `src/app/globals.css` components layer
- All API routes use TypeScript for type safety

## Future Considerations

- **Video Infrastructure**: Integration with Twilio or Agora for video rooms
- **Real-time Messaging**: WebSocket setup (Socket.io or Supabase Realtime)
- **Image Storage**: S3 or Cloudinary for photo uploads
- **Email Service**: SendGrid or Mailgun for notifications
- **Rate Limiting**: Prevent abuse on invite generation
- **Moderation Tools**: Admin panel for content review
- **Payment Processing**: Stripe for premium features

---

**Current Focus**: Landing page and onboarding flow are functional. Next: authentication middleware and member search.
