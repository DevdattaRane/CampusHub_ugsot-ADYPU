-- Migration: 20261117210000_part5_opportunities.sql
-- Part 5: Opportunities board with categories, bookmarks, and RLS

-- 1. Create opportunities table
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete set null,
  title text not null,
  organization text not null,
  category text not null check (category in (
    'Internships',
    'Open-source programs',
    'Hackathons',
    'Fellowships',
    'Competitions',
    'Research'
  )),
  description text not null,
  link text not null,
  deadline timestamptz not null,
  location text not null default 'Remote',
  eligibility text not null default 'All students eligible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create opportunity bookmarks table
create table if not exists public.opportunity_bookmarks (
  user_id uuid references public.profiles(id) on delete cascade not null,
  opportunity_id uuid references public.opportunities(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

-- Indexes for performance
create index if not exists idx_opportunities_category on public.opportunities(category);
create index if not exists idx_opportunities_deadline on public.opportunities(deadline);
create index if not exists idx_opportunity_bookmarks_user on public.opportunity_bookmarks(user_id);

-- 3. Enable RLS
alter table public.opportunities enable row level security;
alter table public.opportunity_bookmarks enable row level security;

-- 4. Policies for opportunities
create policy "Anyone can view opportunities"
  on public.opportunities for select
  using (true);

create policy "Only organizers can insert opportunities"
  on public.opportunities for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    )
  );

create policy "Only organizers can update opportunities"
  on public.opportunities for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    )
  );

create policy "Only organizers can delete opportunities"
  on public.opportunities for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    )
  );

-- 5. Policies for bookmarks
create policy "Users can view their own bookmarks"
  on public.opportunity_bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can add bookmarks"
  on public.opportunity_bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their bookmarks"
  on public.opportunity_bookmarks for delete
  using (auth.uid() = user_id);

-- 6. Seed 3 clearly labelled sample opportunities (safe insert)
insert into public.opportunities (id, title, organization, category, description, link, deadline, location, eligibility)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '[SAMPLE] Google Summer of Code (GSoC) 2027 Open Source Mentorship',
    'Google Open Source Programs Office',
    'Open-source programs',
    'Work with open-source organizations on a 12+ week programming project under the guidance of dedicated mentors. Stipend provided based on location.',
    'https://summerofcode.withgoogle.com',
    now() + interval '5 days',
    'Remote',
    'Enrolled university students or open-source contributors aged 18+'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '[SAMPLE] ADYPU Innovation Lab Winter Software Intern',
    'ADYPU Center for Innovation & Research',
    'Internships',
    'Join our student-led engineering team to build smart-campus IoT dashboards, web platforms, and automated attendance solutions. 3 months part-time.',
    'https://adypu.edu.in',
    now() + interval '14 days',
    'Pune Campus (Hybrid)',
    '2nd & 3rd Year B.Tech CSE / IT / AI-DS with React & Node experience'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '[SAMPLE] MLH Global Fellowship - Open Source Software Track',
    'Major League Hacking (MLH)',
    'Fellowships',
    'A 12-week remote internship alternative where fellows contribute directly to production open-source repositories used by millions.',
    'https://fellowship.mlh.io',
    now() + interval '30 days',
    'Remote',
    'All degree programs, demonstrable Git & programming fundamentals'
  )
on conflict (id) do nothing;
