# Teacher Scheduling System

A modern web application for managing teacher schedules, built with Next.js 14, TypeScript, Tailwind CSS, and Vercel Postgres.

## Features

- � **Secure Login System**: Separate login for Admin and Teacher roles
- 👥 **Role-Based Access**: Admin and Teacher with protected dashboards
- 📅 **Visual Timetable**: Clean, readable weekly schedule grid
- 🔒 **Route Protection**: Middleware ensures users can only access their authorized pages
- 📊 **Schedule Management**: Create, assign, and manage schedules
- 🎯 **Conflict Detection**: Automatic checking for scheduling conflicts
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Prisma (can point to Neon, Supabase, or Vercel Postgres)
- **ORM**: Prisma
- **Authentication**: NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Vercel account (for database)
- npm or yarn package manager

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

3. **Configure your database**:
   - You can use Neon, Supabase, or Vercel Postgres.
   - Copy the PostgreSQL connection string from your provider.
   - Paste it in `.env` as `DATABASE_URL`.
   - If your provider gives a separate direct connection string, you can also set `DIRECT_URL` for Prisma migrations.

### Using Supabase

If you want to use Supabase as the database backend:

1. Create a Supabase project.
2. Open the project dashboard and go to the database connection details.
3. Copy the PostgreSQL connection string, not the public project URL.
4. Replace `DATABASE_URL` in `.env` with that connection string.
5. Run `npx prisma db push` or `npx prisma migrate dev` after the database is reachable.
6. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only if you are also using Supabase helpers for client/session access.

4. **Generate NextAuth secret**:
   ```bash
   openssl rand -base64 32
   ```
   Add the output to `.env` as `NEXTAUTH_SECRET`

5. **Setup database**:
   ```bash
   npx prisma db push
   npx prisma generate
   npm run db:seed
   ```
   This will create the database schema and add demo users:
   - Admin: `admin@example.com` / `admin123`
   - Teacher: `teacher@example.com` / `teacher123`

6. **Run development server**:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
Schedule/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── teacher/           # Teacher dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── Timetable.tsx      # Reusable timetable component
├── prisma/                # Database schema
│   └── schema.prisma      # Prisma schema
├── data/                  # Sample data files
│   ├── subjects.csv       # Subject list
│   └── time_slots.csv     # Time slot definitions
└── package.json           # Dependencies
```

## Database Schema

- **User**: Admin and Teacher users with authentication
- **Teacher**: Teacher profiles linked to users
- **Subject**: Subjects for G11 and G12
- **Section**: Class sections (ABM, HUMSS, etc.)
- **TimeSlot**: Time periods for scheduling
- **ScheduleBlock**: Teacher assignments to subjects

## Deployment to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Add environment variables:
     - `DATABASE_URL` (optional for demo mode, required for real data)
     - `NEXTAUTH_SECRET` (recommended for production)
     - `NEXTAUTH_URL` (your Vercel app URL)
   - Deploy

3. **Database behavior on deploy**:
   - If `DATABASE_URL` is configured, deployment runs `prisma db push` automatically before `next build`.
   - If `DATABASE_URL` is missing or still a placeholder, database sync is skipped and the app deploys in demo/fallback mode.

4. **First login (demo mode)**:
   - **Admin**: `admin@example.com` / `admin123`
   - **Teacher**: `teacher@example.com` / `teacher123`

## Usage

### Admin Functions
- Manage teachers, subjects, sections
- Create time slots
- Build and assign schedules
- View all schedules

### Teacher Functions
- View personal weekly schedule
- See assigned subjects and sections
- Check room assignments

## Next Steps

- [ ] Implement NextAuth authentication
- [ ] Add CRUD operations for teachers/subjects
- [ ] Build schedule assignment interface
- [ ] Add conflict detection logic
- [ ] Import/export from Excel
- [ ] Add email notifications
- [ ] Generate printable schedules

## License

MIT

## Support

For questions or issues, contact the development team.
