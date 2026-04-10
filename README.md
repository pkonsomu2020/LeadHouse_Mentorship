# LeadHouse — Discipline. Direction. Leadership.

A full-stack mentorship platform built for young men aged 16–25 in Kenya, connecting them with experienced mentors to build discipline, set goals, and grow into leaders.

---

## Project Structure

```
LeadHouse PROJECT/
├── src/                    # User Dashboard (React + Vite)
├── ADMIN DASHBOARD/        # Admin Dashboard (React + Vite)
└── backend/                # Node.js + Express API
```

---

## User Dashboard (`src/`)

Built with React, TypeScript, Tailwind CSS, and shadcn/ui.

### Features
- **Authentication** — Sign up / login with username, email, county, age group, interests
- **Dashboard Overview** — Personal stats, active goals, upcoming sessions, recent activity
- **Mentor Matching** — Browse verified mentors by field and county, send match requests
- **Sessions** — Book, view, and manage mentoring sessions with meeting links
- **Goals & Progress** — Create goals, track progress with visual indicators
- **Messages** — WhatsApp-style real-time chat with matched mentor and LeadHouse admin. Supports file/image uploads
- **Challenges** — MCQ quiz challenges with A/B/C/D answers, instant feedback, explanations, and leaderboard
- **Community** — Discussion posts, success stories, events, and group joining
- **Resources** — Articles, videos, PDFs, and guides by category
- **Journal** — Private mood journal with tags and privacy controls
- **Reports** — Submit reports on users, messages, or content
- **Notifications** — Real-time platform notifications
- **Settings** — Profile, county (all 47 Kenya counties), notification preferences, account management

### Running the User Dashboard
```bash
npm install
npm run dev        # starts on http://localhost:5173
```

### Demo Credentials
- Email: *(set in your `.env` or Supabase seed)*
- Password: *(set during registration)*
- Username: *(chosen at sign-up)*

---

## Admin Dashboard (`ADMIN DASHBOARD/`)

Built with React, TypeScript, Tailwind CSS, and shadcn/ui.

### Features
- **Admin Login** — Secure admin-only authentication
- **Overview** — Platform-wide metrics: users, mentors, sessions, goals, challenges
- **User Management** — View, activate/deactivate, and manage all mentees and mentors
- **Mentor Matching** — Assign mentors to mentees, manage match requests, view all active matches with real mentee names
- **Sessions Management** — View and manage all platform sessions
- **Goals Oversight** — Monitor all user goals and progress
- **Content & Resources** — Create, publish, and manage resources (articles, videos, PDFs, guides)
- **Journal Moderation** — Review flagged journal entries
- **Challenges Management** — Create MCQ quiz challenges with A/B/C/D questions, correct answer marking, explanations, points per question, publish/draft toggle
- **Community Management** — Moderate posts, manage groups and events
- **Reports & Moderation** — Review and resolve user reports
- **Messages** — View all platform conversations, message any user or mentor directly as admin
- **Global Search** — Search across users, mentors, challenges, sessions, reports, and resources
- **Settings** — Platform configuration and admin profile

### Running the Admin Dashboard
```bash
cd "ADMIN DASHBOARD"
npm install
npm run dev        # starts on http://localhost:8080
```

### Admin Credentials
- Email: *(set via `ADMIN_EMAIL` environment variable)*
- Password: *(set via `ADMIN_PASSWORD` environment variable)*

---

## Backend (`backend/`)

Built with Node.js, Express, and Supabase (PostgreSQL).

### API Endpoints

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Register, login, logout, me |
| `/api/mentors` | Browse and filter mentors |
| `/api/messages` | Send/receive messages, file uploads, mentor/mentee threads |
| `/api/challenges` | Browse challenges, join, answer MCQ questions |
| `/api/goals` | CRUD goals and progress |
| `/api/sessions` | Book and manage sessions |
| `/api/journal` | Private journal entries |
| `/api/resources` | Browse published resources |
| `/api/community` | Posts, comments, likes, events, RSVPs |
| `/api/reports` | Submit reports |
| `/api/search` | Global search (user dashboard) |
| `/api/notifications` | User notifications |
| `/api/settings` | User settings and preferences |
| `/api/admin/*` | All admin-only endpoints |
| `/api/admin/search` | Admin global search |
| `/api/admin/matching` | Mentor matching management |
| `/api/admin/challenges` | Challenge CRUD with MCQ support |
| `/api/admin/users` | User management |

### Running the Backend
```bash
cd backend
npm install
npm run dev        # starts on http://localhost:3001
```

### Environment Variables (`backend/.env`)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
JWT_SECRET=
ADMIN_API_KEY=
PORT=3001
```

---

## Database

Supabase (PostgreSQL) with the following main tables:

| Table | Purpose |
|-------|---------|
| `profiles` | Admin users only |
| `users` | Mentees (user dashboard accounts) |
| `mentors` | Mentor profiles with auth |
| `match_requests` | Mentor-mentee matching |
| `sessions` | Booked mentoring sessions |
| `goals` | User goals and progress |
| `messages` | Platform messages (supports files) |
| `journal_entries` | Private user journals |
| `challenges` | Quiz challenges |
| `challenge_tasks` | MCQ questions (A/B/C/D + correct answer + explanation) |
| `challenge_participants` | User challenge participation and scores |
| `challenge_task_completions` | Individual question answers |
| `resources` | Content library |
| `community_posts` | Discussion and story posts |
| `community_groups` | Community groups |
| `community_events` | Platform events |
| `reports` | User-submitted reports |
| `notifications` | User notifications |
| `platform_settings` | Admin-configurable platform settings |

Run `backend/src/db/RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql` in your Supabase SQL Editor to set up the schema.

For MCQ challenge support, also run `backend/src/db/migrations/002_challenge_mcq.sql`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Routing | React Router v6 |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL) |
| Auth | JWT + Supabase Auth |
| File Storage | Supabase Storage (`chat-files`, `leadhouse-resources`) |
| Icons | Lucide React |

---

## Pilot Region

Kisumu, Kenya — with plans to expand across all 47 counties.

---

*LeadHouse — Discipline. Direction. Leadership.*
