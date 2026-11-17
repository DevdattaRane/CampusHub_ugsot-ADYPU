# CampusHub · UGSOT ADYPU

A comprehensive campus tech club platform for events, student portfolios, developer discussions, mentorship, and career opportunities. Built with Next.js 16 (Turbopack, App Router), React 19, TypeScript, and Supabase with strict Row Level Security (RLS) using the **Bold pop** design system.

---

## Quickstart

Requires Node.js 20.9+:

```bash
cd CampusHub_ugsot-ADYPU
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verification Commands

```bash
npm run lint         # ESLint check (0 errors, 0 warnings)
npm run type-check   # TypeScript compiler check (0 errors)
npm run build        # Production Next.js build
```

---

## Application Features by Part

### Part 1: Events Finish, Attendance & Certificates
- **Attendance Tracking (Organizers only)**: Located at `/events/[eventId]/attendance`. Features live present/absent counters, instant attendance toggling, and an attendance CSV export (`/api/events/[eventId]/attendance/export`).
- **Verifiable Certificates**: Generated only for registrants marked *Present*. Bold pop printable layout (`/certificates/[id]`) with one-click browser print-to-PDF (`window.print()`).
- **Public Verification**: `/verify` page allows verifying authenticity by unique Certificate ID.
- **My Certificates**: Embedded directly in the user profile view.

### Part 2: Developer Forum (`/community`)
- **Three Core Tabs**: *Questions*, *Discussions*, and *Announcements* (announcements postable exclusively by organizers/admins).
- **Q&A with Accepted Answers**: Authors can accept answers (displayed first with an accepted badge).
- **Upvotes & Search**: Single-vote toggle per user, topic tag filtering (`Python`, `JavaScript`, `Java`, `C/C++`, `Web`, `AI/ML`, `DSA`, `Git`, `Other`), and full keyword search.
- **Moderation**: Self-deletion for authors, moderation deletion for organizers, and report post flag.

### Part 3: Project Showcase (`/projects` & `/projects/[id]`)
- **Project Publishing**: Title, short & long description, tech stack tags, live demo link, GitHub repo URL, cover image URL, and a "Looking for collaborators" toggle with needed roles.
- **GitHub Integration**: Fetches repository stars, forks, language, and last update via public GitHub REST API with a memory cache and graceful fallback.
- **Engagement**: Likes, comments (with author delete), bookmarking ("My Bookmarks" on `/profile`), and collaboration requests with owner approve/decline actions.

### Part 4: Mentorship & Code Reviews (`/mentorship`)
- **Mentor Directory & Application**: Students can apply with bio, skills, and availability slots. Organizers approve applicants.
- **Session Booking**: Book 1-on-1 sessions. Double-booking prevention enforced at the database level (`UNIQUE(mentor_id, date, slot)`).
- **Async Code Reviews**: Submit GitHub links or code snippets; mentors claim reviews and provide structured feedback.
- **Career Guidance**: Fast-track topic cards (Resume, Internships, Open Source, Mock Interviews) that pre-fill session requests.

### Part 5: Opportunities Board (`/opportunities`)
- **Categories**: *Internships*, *Open-source programs*, *Hackathons*, *Fellowships*, *Competitions*, *Research*.
- **Single Source of Truth for Hackathons**: Automatically pulls campus hackathons from the events catalog with direct registration links.
- **Deadlines & Closing Soon**: Displays "Closing Soon" badges for opportunities with deadlines within 7 days. Supports filtering expired deadlines.
- **Bookmarks & Admin Management**: Organizers can post, edit, and delete opportunities; students can bookmark.

### Part 6: Developer Activity Dashboard (`/profile` -> Dashboard Tab)
- **Live Metrics**: Projects posted, events attended vs registered, certificates earned, accepted forum answers, completed mentorships, and streak counter.
- **GitHub Insights**: Pulls public repo counts, followers, and recent commits for the connected GitHub handle.
- **Native SVG / CSS Activity Chart**: Zero external charting libraries; renders responsive monthly contributions.
- **Skills Cloud**: Visual tags cloud of verified competencies.
- **Exportable Resume / Brag Sheet**: Clean printable layout triggered by "Export Resume / Brag Sheet (Print PDF)" with dedicated `@media print` formatting.
- **Strict Role Security**: Users can update their profile information and skills, but role changes from the client are rejected by database triggers.

### Part 7: Navigation & Responsive Design
- **Desktop Navigation**: *Home*, *Events*, *Projects*, *Forum*, *Mentorship*, *Opportunities*, *Students*, plus avatar/sign-in button.
- **Mobile Navigation**: Bottom bar with 4 primary destinations (*Home*, *Events*, *Projects*, *Forum*) plus an expanding *More* drawer to prevent navigation overflow.

---

## Supabase Database Migrations

Run these migrations in chronological order in the Supabase SQL Editor:

1. `supabase/migrations/20261117000000_events_data_layer.sql` — Profiles, events catalog, base RLS.
2. `supabase/migrations/20261117150000_event_registration.sql` — Atomic registrations and capacity management.
3. `supabase/migrations/20261117160000_hackathon_teams_announcements.sql` — Hackathon teams and announcements.
4. `supabase/migrations/20261117170000_part1_certificates.sql` — Event certificates and verification RPCs.
5. `supabase/migrations/20261117180000_part2_forum.sql` — Forum posts, answers, upvotes, reports, and moderation RLS.
6. `supabase/migrations/20261117190000_part3_projects.sql` — Projects, likes, comments, bookmarks, and collaboration requests.
7. `supabase/migrations/20261117200000_part4_mentorship.sql` — Mentor profiles, sessions (with unique slot constraint), and code reviews.
8. `supabase/migrations/20261117210000_part5_opportunities.sql` — Opportunities board, categories, bookmarks, and seed items.
9. `supabase/migrations/20261117220000_part6_dashboard_and_roles.sql` — Profile extensions and database trigger preventing unauthorized role alteration.

*Note: For a fresh Supabase database, you can also run the consolidated file `supabase/full_schema.sql` which includes the base tables, followed by migrations 4 through 9.*

### Promoting an Organizer / Admin

In the Supabase SQL editor:

```sql
update public.profiles
set role = 'organizer'
where email = 'your-email@example.com';
```

---

## Architecture & Code Boundaries

All database calls are strictly isolated within `lib/db/`:
- `lib/db/events.ts`
- `lib/db/forum.ts`
- `lib/db/projects.ts`
- `lib/db/mentorship.ts`
- `lib/db/opportunities.ts`
- `lib/db/dashboard.ts`

Only the publishable client key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) is used; service-role keys are never included or exposed.
