-- =============================================================================
-- CampusHub Complete Database Schema
-- All migrations (Parts 1-7 + Leaderboard System) consolidated in order.
-- Safe to execute in the Supabase SQL Editor.
-- =============================================================================

-- Ensure profiles columns exist for existing databases
alter table if exists public.profiles
  add column if not exists github_username text,
  add column if not exists skills text[],
  add column if not exists bio text,
  add column if not exists is_hidden_from_leaderboard boolean not null default false;



-- =============================================================================
-- Source Migration: supabase/migrations/20261117000000_events_data_layer.sql
-- =============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  course_year text,
  role text not null default 'student' check (role in ('student', 'organizer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, course_year)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'course_year'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      course_year = excluded.course_year,
      updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create or replace function public.is_event_organizer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'organizer'
  );
$$;

revoke all on function public.is_event_organizer() from public;
grant execute on function public.is_event_organizer() to authenticated;

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.event_announcements (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  message text not null check (length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create table public.event_teams (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  name text not null check (length(trim(name)) > 0),
  leader_id uuid not null references auth.users (id) on delete cascade,
  leader_email text not null,
  created_at timestamptz not null default now()
);

create table public.event_team_members (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  team_id uuid not null references public.event_teams (id) on delete cascade,
  member_email text not null,
  email_key text generated always as (lower(trim(member_email))) stored,
  created_at timestamptz not null default now(),
  unique (event_id, email_key)
);

create or replace function public.is_event_team_member(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event_team_members
    where team_id = target_team_id
      and email_key = lower(trim((select auth.jwt() ->> 'email')))
  );
$$;

create or replace function public.is_event_team_leader(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event_teams
    where id = target_team_id
      and leader_id = (select auth.uid())
  );
$$;

revoke all on function public.is_event_team_member(uuid) from public;
revoke all on function public.is_event_team_leader(uuid) from public;
grant execute on function public.is_event_team_member(uuid) to authenticated;
grant execute on function public.is_event_team_leader(uuid) to authenticated;

create or replace function public.ensure_team_leader_membership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (
    old.event_id <> new.event_id or old.leader_email <> new.leader_email
  ) then
    delete from public.event_team_members
    where team_id = old.id
      and event_id = old.event_id
      and email_key = lower(trim(old.leader_email));
  end if;

  insert into public.event_team_members (event_id, team_id, member_email)
  values (new.event_id, new.id, lower(trim(new.leader_email)))
  on conflict (event_id, email_key) do nothing;

  if not exists (
    select 1
    from public.event_team_members
    where team_id = new.id
      and event_id = new.event_id
      and email_key = lower(trim(new.leader_email))
  ) then
    raise exception 'A student can only belong to one team per hackathon.';
  end if;
  return new;
end;
$$;

create trigger keep_team_leader_in_members
  after insert or update of event_id, leader_email on public.event_teams
  for each row execute function public.ensure_team_leader_membership();

create table public.event_attendance (
  event_id text not null,
  user_id uuid not null,
  status text not null check (status in ('present', 'absent')),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id),
  foreign key (event_id, user_id)
    references public.event_registrations (event_id, user_id) on delete cascade
);

create table public.event_certificates (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  user_id uuid not null,
  issued_at timestamptz not null default now(),
  unique (event_id, user_id),
  foreign key (event_id, user_id)
    references public.event_registrations (event_id, user_id) on delete cascade
);

create or replace function public.require_present_attendance_for_certificate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.event_attendance
    where event_id = new.event_id
      and user_id = new.user_id
      and status = 'present'
  ) then
    raise exception 'Certificates require present attendance.';
  end if;
  return new;
end;
$$;

create trigger certificate_requires_present_attendance
  before insert or update on public.event_certificates
  for each row execute function public.require_present_attendance_for_certificate();

revoke all on public.profiles,
  public.event_registrations,
  public.event_announcements,
  public.event_teams,
  public.event_team_members,
  public.event_attendance,
  public.event_certificates
from anon, authenticated;

alter table public.profiles enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_announcements enable row level security;
alter table public.event_teams enable row level security;
alter table public.event_team_members enable row level security;
alter table public.event_attendance enable row level security;
alter table public.event_certificates enable row level security;

create policy "Profiles are visible to their owner and organizers"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_event_organizer()));
create policy "Users can update their own profile details"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
grant select on public.profiles to authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, course_year) on public.profiles to authenticated;

create policy "Users can read their registrations and organizers can read all"
  on public.event_registrations for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_event_organizer()));
create policy "Users can register themselves"
  on public.event_registrations for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users can cancel their own registrations"
  on public.event_registrations for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_event_organizer()));
grant select, insert, delete on public.event_registrations to authenticated;

create policy "Event announcements are public"
  on public.event_announcements for select to anon, authenticated
  using (true);
create policy "Organizers can publish announcements"
  on public.event_announcements for insert to authenticated
  with check (author_id = (select auth.uid()) and (select public.is_event_organizer()));
create policy "Organizers can edit announcements"
  on public.event_announcements for update to authenticated
  using ((select public.is_event_organizer()))
  with check ((select public.is_event_organizer()));
create policy "Organizers can remove announcements"
  on public.event_announcements for delete to authenticated
  using ((select public.is_event_organizer()));
grant select on public.event_announcements to anon, authenticated;
grant insert, update, delete on public.event_announcements to authenticated;

create policy "Teams are visible to members and organizers"
  on public.event_teams for select to authenticated
  using (
    leader_id = (select auth.uid())
    or (select public.is_event_organizer())
    or (select public.is_event_team_member(id))
  );
create policy "Authenticated users can create teams as their leader"
  on public.event_teams for insert to authenticated
  with check (
    leader_id = (select auth.uid())
    and lower(trim(leader_email)) = lower(trim((select auth.jwt() ->> 'email')))
  );
create policy "Team leaders and organizers can update teams"
  on public.event_teams for update to authenticated
  using (leader_id = (select auth.uid()) or (select public.is_event_organizer()))
  with check (
    (
      leader_id = (select auth.uid())
      and lower(trim(leader_email)) = lower(trim((select auth.jwt() ->> 'email')))
    )
    or (select public.is_event_organizer())
  );
create policy "Team leaders and organizers can delete teams"
  on public.event_teams for delete to authenticated
  using (leader_id = (select auth.uid()) or (select public.is_event_organizer()));
grant select, insert, update, delete on public.event_teams to authenticated;

create policy "Team members and organizers can read team invitations"
  on public.event_team_members for select to authenticated
  using (
    email_key = lower(trim((select auth.jwt() ->> 'email')))
    or (select public.is_event_organizer())
    or (select public.is_event_team_member(team_id))
    or (select public.is_event_team_leader(team_id))
  );
create policy "Team leaders can invite members"
  on public.event_team_members for insert to authenticated
  with check (
    exists (
      select 1 from public.event_teams teams
      where teams.id = team_id
        and teams.event_id = event_id
        and (
          teams.leader_id = (select auth.uid())
          or (select public.is_event_organizer())
        )
    )
  );
create policy "Team leaders and members can remove membership"
  on public.event_team_members for delete to authenticated
  using (
    email_key = lower(trim((select auth.jwt() ->> 'email')))
    or (select public.is_event_organizer())
    or (select public.is_event_team_leader(team_id))
  );
grant select, insert, delete on public.event_team_members to authenticated;

create policy "Users can read their attendance and organizers can read all"
  on public.event_attendance for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_event_organizer()));
create policy "Organizers manage attendance"
  on public.event_attendance for insert to authenticated
  with check ((select public.is_event_organizer()));
create policy "Organizers update attendance"
  on public.event_attendance for update to authenticated
  using ((select public.is_event_organizer()))
  with check ((select public.is_event_organizer()));
create policy "Organizers remove attendance"
  on public.event_attendance for delete to authenticated
  using ((select public.is_event_organizer()));
grant select, insert, update, delete on public.event_attendance to authenticated;

create policy "Users can read their certificates and organizers can read all"
  on public.event_certificates for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_event_organizer()));
create policy "Organizers issue certificates"
  on public.event_certificates for insert to authenticated
  with check ((select public.is_event_organizer()));
create policy "Organizers revoke certificates"
  on public.event_certificates for delete to authenticated
  using ((select public.is_event_organizer()));
grant select, insert, delete on public.event_certificates to authenticated;


-- =============================================================================
-- Source Migration: supabase/migrations/20261117150000_event_registration.sql
-- =============================================================================

create table public.event_catalog (
  id text primary key,
  title text not null,
  capacity integer not null check (capacity > 0),
  registration_deadline date not null
);

insert into public.event_catalog (id, title, capacity, registration_deadline) values
  ('freshers-talk', 'Freshers’ tech talk', 120, '2026-10-16'),
  ('smart-campus-ideathon', 'Smart campus ideathon', 60, '2026-10-20'),
  ('git-workshop', 'Intro to Git & GitHub', 40, '2026-11-03'),
  ('oss-sprint', 'Open-source sprint', 60, '2026-11-06'),
  ('design-jam', 'UI/UX Design Jam', 30, '2026-11-09'),
  ('campus-hackathon', 'Campus Hackathon 2026', 100, '2026-11-10'),
  ('rapid-prototyping-workshop', 'Rapid Prototyping Workshop', 30, '2026-11-13'),
  ('student-maker-meetup', 'Student Maker Meetup', 50, '2026-11-13'),
  ('ml-circle', 'ML Paper Reading Circle', 25, '2026-11-17'),
  ('codefest', 'Inter-college Codefest', 200, '2026-11-15'),
  ('resume-clinic', 'Resume & LinkedIn clinic', 40, '2026-11-24'),
  ('global-ai-hackathon', 'Global AI Hackathon', 200, '2026-11-20')
on conflict (id) do update
set title = excluded.title,
    capacity = excluded.capacity,
    registration_deadline = excluded.registration_deadline;

alter table public.event_catalog enable row level security;
revoke all on public.event_catalog from anon, authenticated;
grant select on public.event_catalog to anon, authenticated;

create policy "Event catalog is public"
  on public.event_catalog for select to anon, authenticated
  using (true);

revoke insert, delete on public.event_registrations from authenticated;

create or replace function public.get_event_registration_statuses(p_event_ids text[])
returns table (
  event_id text,
  capacity integer,
  registration_deadline date,
  seats_left integer,
  is_registered boolean,
  registration_open boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    catalog.id,
    catalog.capacity,
    catalog.registration_deadline,
    greatest(catalog.capacity - count(registration.user_id)::integer, 0),
    coalesce(bool_or(registration.user_id = (select auth.uid())), false),
    catalog.registration_deadline >= (now() at time zone 'Asia/Kolkata')::date
      and count(registration.user_id) < catalog.capacity
  from public.event_catalog as catalog
  left join public.event_registrations as registration
    on registration.event_id = catalog.id
  where catalog.id = any(p_event_ids)
  group by catalog.id;
$$;

create or replace function public.register_for_event(p_event_id text)
returns table (
  result text,
  seats_left integer,
  capacity integer,
  registration_deadline date
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  event_row public.event_catalog%rowtype;
  registration_count integer;
begin
  if current_user_id is null then
    raise exception 'Sign in to register.';
  end if;

  select * into event_row
  from public.event_catalog
  where id = p_event_id
  for update;

  if not found then
    raise exception 'This event is not available for registration.';
  end if;

  select count(*)::integer into registration_count
  from public.event_registrations
  where event_id = p_event_id;

  if exists (
    select 1
    from public.event_registrations
    where event_id = p_event_id and user_id = current_user_id
  ) then
    return query select
      'already_registered'::text,
      greatest(event_row.capacity - registration_count, 0),
      event_row.capacity,
      event_row.registration_deadline;
    return;
  end if;

  if event_row.registration_deadline < (now() at time zone 'Asia/Kolkata')::date then
    return query select
      'deadline_passed'::text,
      greatest(event_row.capacity - registration_count, 0),
      event_row.capacity,
      event_row.registration_deadline;
    return;
  end if;

  if registration_count >= event_row.capacity then
    return query select
      'full'::text,
      0,
      event_row.capacity,
      event_row.registration_deadline;
    return;
  end if;

  insert into public.event_registrations (event_id, user_id)
  values (p_event_id, current_user_id);

  return query select
    'registered'::text,
    greatest(event_row.capacity - registration_count - 1, 0),
    event_row.capacity,
    event_row.registration_deadline;
end;
$$;

create or replace function public.cancel_event_registration(p_event_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Sign in to cancel a registration.';
  end if;

  delete from public.event_registrations
  where event_id = p_event_id and user_id = current_user_id;
  return found;
end;
$$;

revoke all on function public.get_event_registration_statuses(text[]) from public;
revoke all on function public.register_for_event(text) from public;
revoke all on function public.cancel_event_registration(text) from public;
grant execute on function public.get_event_registration_statuses(text[]) to anon, authenticated;
grant execute on function public.register_for_event(text) to authenticated;
grant execute on function public.cancel_event_registration(text) to authenticated;


-- =============================================================================
-- Source Migration: supabase/migrations/20261117160000_hackathon_teams_announcements.sql
-- =============================================================================

alter table public.event_catalog
  add column event_type text not null default 'event'
    check (event_type in ('event', 'hackathon')),
  add column team_size_min integer,
  add column team_size_max integer,
  add column theme text,
  add column prize text,
  add column rules jsonb not null default '[]'::jsonb,
  add constraint event_catalog_team_size_check check (
    (event_type = 'event' and team_size_min is null and team_size_max is null)
    or (
      event_type = 'hackathon'
      and team_size_min >= 1
      and team_size_max >= team_size_min
      and theme is not null
      and prize is not null
      and jsonb_typeof(rules) = 'array'
    )
  );

update public.event_catalog
set event_type = 'hackathon',
    team_size_min = 1,
    team_size_max = 4,
    theme = 'To be announced',
    prize = 'To be announced',
    rules = '[]'::jsonb
where id in ('smart-campus-ideathon', 'campus-hackathon', 'global-ai-hackathon');

create unique index event_teams_one_leader_per_hackathon
  on public.event_teams (event_id, leader_id);

revoke update on public.event_teams from authenticated;
grant update (name) on public.event_teams to authenticated;

create or replace function public.validate_hackathon_announcement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.event_catalog
    where id = new.event_id and event_type = 'hackathon'
  ) then
    raise exception 'Announcements are only available for hackathons.'
      using errcode = '23514';
  end if;

  if length(btrim(new.message)) > 1000 then
    raise exception 'Announcements must be 1000 characters or fewer.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger validate_hackathon_announcement
  before insert or update on public.event_announcements
  for each row execute function public.validate_hackathon_announcement();

create or replace function public.validate_hackathon_team()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_record public.event_catalog%rowtype;
  current_user_id uuid := (select auth.uid());
  current_email text := lower(btrim((select auth.jwt() ->> 'email')));
begin
  if current_user_id is null or current_email is null then
    raise exception 'Sign in to create a hackathon team.'
      using errcode = '28000';
  end if;

  if new.leader_id <> current_user_id or lower(btrim(new.leader_email)) <> current_email then
    raise exception 'The signed-in user must be the team leader.'
      using errcode = '42501';
  end if;

  if length(btrim(new.name)) not between 1 and 80 then
    raise exception 'Team names must be between 1 and 80 characters.'
      using errcode = '22023';
  end if;

  select * into event_record
  from public.event_catalog
  where id = new.event_id
  for update;

  if not found or event_record.event_type <> 'hackathon' then
    raise exception 'Teams are only available for listed hackathons.'
      using errcode = '23514';
  end if;

  if event_record.registration_deadline < (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Team registration for this hackathon has closed.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger validate_hackathon_team
  before insert on public.event_teams
  for each row execute function public.validate_hackathon_team();

create or replace function public.validate_hackathon_team_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  team_event_id text;
  team_capacity integer;
  current_member_count integer;
begin
  select teams.event_id, catalog.team_size_max
  into team_event_id, team_capacity
  from public.event_teams as teams
  join public.event_catalog as catalog on catalog.id = teams.event_id
  where teams.id = new.team_id and catalog.event_type = 'hackathon'
  for update of teams;

  if not found or new.event_id <> team_event_id then
    raise exception 'The team member does not match this hackathon.'
      using errcode = '23514';
  end if;

  new.member_email := lower(btrim(new.member_email));
  if new.member_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address for each team member.'
      using errcode = '22023';
  end if;

  select count(*)::integer into current_member_count
  from public.event_team_members
  where team_id = new.team_id;

  if current_member_count + 1 > team_capacity then
    raise exception 'This team has reached the maximum size for this hackathon.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger validate_hackathon_team_member
  before insert on public.event_team_members
  for each row execute function public.validate_hackathon_team_member();

create or replace function public.enforce_hackathon_team_minimum()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  minimum_size integer;
  actual_size integer;
begin
  select catalog.team_size_min into minimum_size
  from public.event_teams as teams
  join public.event_catalog as catalog on catalog.id = teams.event_id
  where teams.id = new.id and catalog.event_type = 'hackathon';

  if not found then
    return null;
  end if;

  select count(*)::integer into actual_size
  from public.event_team_members
  where team_id = new.id;

  if actual_size < minimum_size then
    raise exception 'A team must have at least % members, including its leader.', minimum_size
      using errcode = '23514';
  end if;

  return null;
end;
$$;

create constraint trigger enforce_hackathon_team_minimum
  after insert on public.event_teams
  deferrable initially deferred
  for each row execute function public.enforce_hackathon_team_minimum();

revoke delete on public.event_team_members from authenticated;

create or replace function public.create_hackathon_team(
  p_event_id text,
  p_name text,
  p_member_emails text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  leader_email text := lower(btrim((select auth.jwt() ->> 'email')));
  event_record public.event_catalog%rowtype;
  normalized_emails text[];
  team_size integer;
  created_team_id uuid;
begin
  if current_user_id is null or leader_email is null then
    raise exception 'Sign in to create a hackathon team.'
      using errcode = '28000';
  end if;

  if p_name is null or length(btrim(p_name)) not between 1 and 80 then
    raise exception 'Team names must be between 1 and 80 characters.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_member_emails, '{}'::text[])) as invite(email)
    where invite.email is null
      or btrim(invite.email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ) then
    raise exception 'Enter a valid email address for each team member.'
      using errcode = '22023';
  end if;

  select * into event_record
  from public.event_catalog
  where id = p_event_id;

  if not found or event_record.event_type <> 'hackathon' then
    raise exception 'Teams are only available for listed hackathons.'
      using errcode = '23514';
  end if;

  if event_record.registration_deadline < (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Team registration for this hackathon has closed.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.event_teams
    where event_id = p_event_id and leader_id = current_user_id
  ) or exists (
    select 1 from public.event_team_members
    where event_id = p_event_id and email_key = leader_email
  ) then
    raise exception 'You are already on a team for this hackathon.'
      using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct lower(btrim(invite.email))), '{}'::text[])
  into normalized_emails
  from unnest(coalesce(p_member_emails, '{}'::text[])) as invite(email)
  where lower(btrim(invite.email)) <> leader_email;

  team_size := cardinality(normalized_emails) + 1;
  if team_size < event_record.team_size_min or team_size > event_record.team_size_max then
    raise exception 'Team size must be between % and % members, including the leader.',
      event_record.team_size_min, event_record.team_size_max
      using errcode = '22023';
  end if;

  insert into public.event_teams (event_id, name, leader_id, leader_email)
  values (p_event_id, btrim(p_name), current_user_id, leader_email)
  returning id into created_team_id;

  insert into public.event_team_members (event_id, team_id, member_email)
  select p_event_id, created_team_id, invite.email
  from unnest(normalized_emails) as invite(email);

  return created_team_id;
exception
  when unique_violation then
    raise exception 'One or more of these students are already on a team for this hackathon.'
      using errcode = '23505';
end;
$$;

revoke all on function public.create_hackathon_team(text, text, text[]) from public;
grant execute on function public.create_hackathon_team(text, text, text[]) to authenticated;


-- =============================================================================
-- Source Migration: supabase/migrations/20261117170000_part1_certificates.sql
-- =============================================================================

-- Part 1: Event Certificates and Verification
-- Timestamp: 20261117170000

-- Ensure function to verify certificates publicly
create or replace function public.verify_certificate(p_certificate_id uuid)
returns table (
  certificate_id uuid,
  event_id text,
  event_title text,
  attendee_name text,
  issued_at timestamptz,
  is_valid boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    c.id as certificate_id,
    c.event_id,
    coalesce(cat.title, c.event_id) as event_title,
    p.full_name as attendee_name,
    c.issued_at,
    true as is_valid
  from public.event_certificates c
  join public.profiles p on p.id = c.user_id
  left join public.event_catalog cat on cat.id = c.event_id
  where c.id = p_certificate_id;
end;
$$;

revoke all on function public.verify_certificate(uuid) from public;
grant execute on function public.verify_certificate(uuid) to anon, authenticated;

-- Function for organizers to issue a certificate to a present attendee
create or replace function public.issue_event_certificate(p_event_id text, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_certificate_id uuid;
begin
  if not (select public.is_event_organizer()) then
    raise exception 'Forbidden: Only organizers can issue certificates.';
  end if;

  if not exists (
    select 1
    from public.event_attendance
    where event_id = p_event_id
      and user_id = p_user_id
      and status = 'present'
  ) then
    raise exception 'Attendee must be marked present to receive a certificate.';
  end if;

  insert into public.event_certificates (event_id, user_id)
  values (p_event_id, p_user_id)
  on conflict (event_id, user_id)
  do update set issued_at = now()
  returning id into v_certificate_id;

  return v_certificate_id;
end;
$$;

revoke all on function public.issue_event_certificate(text, uuid) from public;
grant execute on function public.issue_event_certificate(text, uuid) to authenticated;


-- =============================================================================
-- Source Migration: supabase/migrations/20261117180000_part2_forum.sql
-- =============================================================================

-- Part 2: Developer Forum
-- Timestamp: 20261117180000

create table if warm_posts_exists as
select 1 from information_schema.tables where table_name = 'forum_posts';

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('question', 'discussion', 'announcement')),
  title text not null,
  content text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  tags text[] not null default '{}',
  accepted_answer_id uuid,
  is_reported boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_answers (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_reported boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_upvotes (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('post', 'answer')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create table if not exists public.forum_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('post', 'answer')),
  item_id uuid not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.forum_posts enable row level security;
alter table public.forum_answers enable row level security;
alter table public.forum_upvotes enable row level security;
alter table public.forum_reports enable row level security;

-- Policies for forum_posts
drop policy if exists "Forum posts are publicly readable" on public.forum_posts;
create policy "Forum posts are publicly readable"
  on public.forum_posts for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can create posts" on public.forum_posts;
create policy "Authenticated users can create posts"
  on public.forum_posts for insert to authenticated
  with check (
    author_id = (select auth.uid()) and
    (type in ('question', 'discussion') or (select public.is_event_organizer()))
  );

drop policy if exists "Authors can update own posts and organizers can moderate" on public.forum_posts;
create policy "Authors can update own posts and organizers can moderate"
  on public.forum_posts for update to authenticated
  using (author_id = (select auth.uid()) or (select public.is_event_organizer()))
  with check (author_id = (select auth.uid()) or (select public.is_event_organizer()));

drop policy if exists "Authors and organizers can delete posts" on public.forum_posts;
create policy "Authors and organizers can delete posts"
  on public.forum_posts for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_event_organizer()));

-- Policies for forum_answers
drop policy if exists "Forum answers are publicly readable" on public.forum_answers;
create policy "Forum answers are publicly readable"
  on public.forum_answers for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can add answers" on public.forum_answers;
create policy "Authenticated users can add answers"
  on public.forum_answers for insert to authenticated
  with check (author_id = (select auth.uid()));

drop policy if exists "Authors can update own answers and organizers can moderate" on public.forum_answers;
create policy "Authors can update own answers and organizers can moderate"
  on public.forum_answers for update to authenticated
  using (author_id = (select auth.uid()) or (select public.is_event_organizer()))
  with check (author_id = (select auth.uid()) or (select public.is_event_organizer()));

drop policy if exists "Authors and organizers can delete answers" on public.forum_answers;
create policy "Authors and organizers can delete answers"
  on public.forum_answers for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_event_organizer()));

-- Policies for forum_upvotes
drop policy if exists "Upvotes are publicly readable" on public.forum_upvotes;
create policy "Upvotes are publicly readable"
  on public.forum_upvotes for select to anon, authenticated
  using (true);

drop policy if exists "Users can toggle own upvotes" on public.forum_upvotes;
create policy "Users can toggle own upvotes"
  on public.forum_upvotes for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own upvotes" on public.forum_upvotes;
create policy "Users can delete own upvotes"
  on public.forum_upvotes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Policies for forum_reports
drop policy if exists "Users can submit reports" on public.forum_reports;
create policy "Users can submit reports"
  on public.forum_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

drop policy if exists "Organizers can view reports" on public.forum_reports;
create policy "Organizers can view reports"
  on public.forum_reports for select to authenticated
  using ((select public.is_event_organizer()));

grant select on public.forum_posts, public.forum_answers, public.forum_upvotes to anon, authenticated;
grant insert, update, delete on public.forum_posts, public.forum_answers, public.forum_upvotes to authenticated;
grant insert on public.forum_reports to authenticated;
grant select on public.forum_reports to authenticated;


-- =============================================================================
-- Source Migration: supabase/migrations/20261117190000_part3_projects.sql
-- =============================================================================

-- Part 3: Project Showcase
-- Timestamp: 20261117190000

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text not null,
  description text not null,
  tech_stack text[] not null default '{}',
  github_url text,
  demo_url text,
  image_url text,
  looking_for_collaborators boolean not null default false,
  roles_needed text[] not null default '{}',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.project_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_collaborations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  role_interested text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS setup
alter table public.projects enable row level security;
alter table public.project_likes enable row level security;
alter table public.project_bookmarks enable row level security;
alter table public.project_comments enable row level security;
alter table public.project_collaborations enable row level security;

-- Projects policies
drop policy if exists "Projects are publicly readable" on public.projects;
create policy "Projects are publicly readable"
  on public.projects for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can create projects" on public.projects;
create policy "Authenticated users can create projects"
  on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can update own projects" on public.projects;
create policy "Owners can update own projects"
  on public.projects for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_event_organizer()))
  with check (owner_id = (select auth.uid()) or (select public.is_event_organizer()));

drop policy if exists "Owners and organizers can delete projects" on public.projects;
create policy "Owners and organizers can delete projects"
  on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_event_organizer()));

-- Likes policies
drop policy if exists "Likes are publicly readable" on public.project_likes;
create policy "Likes are publicly readable"
  on public.project_likes for select to anon, authenticated
  using (true);

drop policy if exists "Users can toggle own likes" on public.project_likes;
create policy "Users can toggle own likes"
  on public.project_likes for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can remove own likes" on public.project_likes;
create policy "Users can remove own likes"
  on public.project_likes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Bookmarks policies
drop policy if exists "Users can view own bookmarks" on public.project_bookmarks;
create policy "Users can view own bookmarks"
  on public.project_bookmarks for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can add own bookmarks" on public.project_bookmarks;
create policy "Users can add own bookmarks"
  on public.project_bookmarks for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can remove own bookmarks" on public.project_bookmarks;
create policy "Users can remove own bookmarks"
  on public.project_bookmarks for delete to authenticated
  using (user_id = (select auth.uid()));

-- Comments policies
drop policy if exists "Comments are publicly readable" on public.project_comments;
create policy "Comments are publicly readable"
  on public.project_comments for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can post comments" on public.project_comments;
create policy "Authenticated users can post comments"
  on public.project_comments for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own comments and project owner can moderate" on public.project_comments;
create policy "Users can delete own comments and project owner can moderate"
  on public.project_comments for delete to authenticated
  using (
    user_id = (select auth.uid()) or
    exists (
      select 1 from public.projects
      where id = project_comments.project_id and owner_id = (select auth.uid())
    ) or
    (select public.is_event_organizer())
  );

-- Collaboration requests policies
drop policy if exists "Users can view their collaborations" on public.project_collaborations;
create policy "Users can view their collaborations"
  on public.project_collaborations for select to authenticated
  using (
    sender_id = (select auth.uid()) or
    exists (
      select 1 from public.projects
      where id = project_collaborations.project_id and owner_id = (select auth.uid())
    )
  );

drop policy if exists "Users can send collaboration requests" on public.project_collaborations;
create policy "Users can send collaboration requests"
  on public.project_collaborations for insert to authenticated
  with check (sender_id = (select auth.uid()));

drop policy if exists "Project owners can update collaboration status" on public.project_collaborations;
create policy "Project owners can update collaboration status"
  on public.project_collaborations for update to authenticated
  using (
    exists (
      select 1 from public.projects
      where id = project_collaborations.project_id and owner_id = (select auth.uid())
    )
  );

grant select on public.projects, public.project_likes, public.project_comments to anon, authenticated;
grant select on public.project_bookmarks, public.project_collaborations to authenticated;
grant insert, update, delete on public.projects, public.project_likes, public.project_bookmarks, public.project_comments, public.project_collaborations to authenticated;


-- =============================================================================
-- Source Migration: supabase/migrations/20261117200000_part4_mentorship.sql
-- =============================================================================

-- Part 4: Mentorship and Code Reviews
-- Timestamp: 20261117200000

create table if not exists public.mentor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  bio text not null,
  skills text[] not null default '{}',
  areas text[] not null default '{}',
  availability_slots text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentorship_sessions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles(id) on delete cascade,
  mentee_id uuid not null references auth.users(id) on delete cascade,
  slot text not null,
  date date not null,
  topic text not null,
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mentor_id, date, slot)
);

create table if not exists public.code_reviews (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  github_url text,
  code_snippet text,
  language text not null default 'Other',
  notes text not null,
  mentor_id uuid references public.mentor_profiles(id) on delete set null,
  feedback text,
  status text not null default 'open' check (status in ('open', 'claimed', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS setup
alter table public.mentor_profiles enable row level security;
alter table public.mentorship_sessions enable row level security;
alter table public.code_reviews enable row level security;

-- Mentor profiles policies
drop policy if exists "Approved mentor profiles are publicly readable" on public.mentor_profiles;
create policy "Approved mentor profiles are publicly readable"
  on public.mentor_profiles for select to anon, authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or (select public.is_event_organizer()));

drop policy if exists "Authenticated users can apply for mentorship" on public.mentor_profiles;
create policy "Authenticated users can apply for mentorship"
  on public.mentor_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Mentors can update own details, organizers can approve" on public.mentor_profiles;
create policy "Mentors can update own details, organizers can approve"
  on public.mentor_profiles for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_event_organizer()))
  with check (user_id = (select auth.uid()) or (select public.is_event_organizer()));

-- Mentorship sessions policies
drop policy if exists "Participants can view their sessions" on public.mentorship_sessions;
create policy "Participants can view their sessions"
  on public.mentorship_sessions for select to authenticated
  using (
    mentee_id = (select auth.uid()) or
    exists (
      select 1 from public.mentor_profiles
      where id = mentorship_sessions.mentor_id and user_id = (select auth.uid())
    ) or
    (select public.is_event_organizer())
  );

drop policy if exists "Mentees can book sessions" on public.mentorship_sessions;
create policy "Mentees can book sessions"
  on public.mentorship_sessions for insert to authenticated
  with check (mentee_id = (select auth.uid()));

drop policy if exists "Session participants can update status" on public.mentorship_sessions;
create policy "Session participants can update status"
  on public.mentorship_sessions for update to authenticated
  using (
    mentee_id = (select auth.uid()) or
    exists (
      select 1 from public.mentor_profiles
      where id = mentorship_sessions.mentor_id and user_id = (select auth.uid())
    ) or
    (select public.is_event_organizer())
  );

-- Code reviews policies
drop policy if exists "Code reviews are viewable by authenticated users" on public.code_reviews;
create policy "Code reviews are viewable by authenticated users"
  on public.code_reviews for select to authenticated
  using (true);

drop policy if exists "Users can request code reviews" on public.code_reviews;
create policy "Users can request code reviews"
  on public.code_reviews for insert to authenticated
  with check (requester_id = (select auth.uid()));

drop policy if exists "Requesters and mentors can update code reviews" on public.code_reviews;
create policy "Requesters and mentors can update code reviews"
  on public.code_reviews for update to authenticated
  using (
    requester_id = (select auth.uid()) or
    exists (
      select 1 from public.mentor_profiles
      where id = code_reviews.mentor_id and user_id = (select auth.uid())
    ) or
    (select public.is_event_organizer())
  );

grant select on public.mentor_profiles to anon, authenticated;
grant insert, update on public.mentor_profiles to authenticated;
grant select, insert, update on public.mentorship_sessions, public.code_reviews to authenticated;


-- =============================================================================
-- Source Migration: supabase/migrations/20261117210000_part5_opportunities.sql
-- =============================================================================

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


-- =============================================================================
-- Source Migration: supabase/migrations/20261117220000_part6_dashboard_and_roles.sql
-- =============================================================================

-- Migration: 20261117220000_part6_dashboard_and_roles.sql
-- Part 6: Profiles extension (github_username, skills, bio) & role security enforcement

-- 1. Add dashboard fields to profiles
alter table public.profiles
  add column if not exists github_username text,
  add column if not exists skills text[] default '{}',
  add column if not exists bio text;

-- 2. Role alteration guard: Strictly prevent non-organizers from altering user roles
create or replace function public.prevent_self_role_change()
returns trigger as $$
begin
  if (NEW.role is distinct from OLD.role) then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    ) then
      raise exception 'Unauthorized: Users cannot change their own or other roles.';
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_self_role_change on public.profiles;
create trigger trg_prevent_self_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_self_role_change();

-- 3. Profiles update policy ensuring users only update their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- =============================================================================
-- Source Migration: supabase/migrations/20261117230000_leaderboard_system.sql
-- =============================================================================

-- Migration: 20261117230000_leaderboard_system.sql
-- Step 1 & 2: Leaderboard, Point Rules, Anti-Farming Logic, and User Ranks

-- 1. Add moderation flag to profiles
alter table public.profiles
  add column if not exists is_hidden_from_leaderboard boolean not null default false;

-- 2. Update role & moderation guard on profiles
create or replace function public.prevent_self_role_change()
returns trigger as $$
begin
  -- Prevent role alteration by non-organizers
  if (NEW.role is distinct from OLD.role) then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    ) then
      raise exception 'Unauthorized: Users cannot change their own or other roles.';
    end if;
  end if;

  -- Prevent leaderboard moderation alteration by non-organizers
  if (NEW.is_hidden_from_leaderboard is distinct from OLD.is_hidden_from_leaderboard) then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    ) then
      raise exception 'Unauthorized: Only organizers can hide or unhide users from the leaderboard.';
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- 3. Point Rules Reference Table
create table if not exists public.point_rules (
  action_key text primary key,
  points integer not null check (points >= 0),
  category text not null check (category in ('events', 'projects', 'forum', 'mentorship')),
  description text not null
);

insert into public.point_rules (action_key, points, category, description)
values
  ('event_registered', 2, 'events', 'Registered for a campus event'),
  ('event_attended', 10, 'events', 'Attended an event (marked present)'),
  ('certificate_earned', 5, 'events', 'Official event completion certificate earned'),
  ('hackathon_team', 8, 'events', 'Created or joined a hackathon team'),
  ('project_posted', 15, 'projects', 'Published a student project in the showcase'),
  ('project_like_received', 1, 'projects', 'Like received on your project (max 20 per project, no self-likes)'),
  ('project_comment_received', 1, 'projects', 'Comment received on your project (max 20 per project, no self-comments)'),
  ('forum_question_posted', 2, 'forum', 'Posted a technical question in the community forum'),
  ('forum_answer_posted', 5, 'forum', 'Posted an answer or response to a question'),
  ('forum_answer_accepted', 15, 'forum', 'Answer verified and accepted by question author (no self-accepts)'),
  ('forum_upvote_received', 1, 'forum', 'Upvote received on a forum post or answer (max 20 per item, no self-upvotes)'),
  ('mentorship_mentor_completed', 10, 'mentorship', 'Completed a 1:1 mentorship session as a mentor'),
  ('mentorship_mentee_completed', 3, 'mentorship', 'Completed a 1:1 mentorship session as a mentee'),
  ('code_review_completed', 8, 'mentorship', 'Provided constructive review on submitted code')
on conflict (action_key) do update
set points = excluded.points,
    category = excluded.category,
    description = excluded.description;

-- Grant read on point_rules
alter table public.point_rules enable row level security;
create policy "Anyone can read point rules"
  on public.point_rules for select using (true);

-- 4. Main Leaderboard Function
create or replace function public.get_leaderboard(
  p_time_filter text default 'all',
  p_category_filter text default 'overall',
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  user_id uuid,
  full_name text,
  email text,
  course_year text,
  github_username text,
  events_points bigint,
  projects_points bigint,
  forum_points bigint,
  mentorship_points bigint,
  total_points bigint,
  score bigint,
  rank bigint,
  badges text[],
  first_activity_at timestamptz
)
language plpgsql
stable
security definer
as $$
declare
  t_start timestamptz;
  v_category text;
begin
  -- Resolve time filter
  if p_time_filter = 'month' then
    t_start := date_trunc('month', now());
  elsif p_time_filter = 'week' then
    t_start := date_trunc('week', now());
  else
    t_start := '1970-01-01'::timestamptz;
  end if;

  v_category := lower(trim(coalesce(p_category_filter, 'overall')));

  return query
  with user_activities as (
    select
      p.id as u_id,
      p.full_name as u_name,
      p.email as u_email,
      p.course_year as u_year,
      p.github_username as u_github,
      p.created_at as u_created_at,

      -- 1. Events Points
      (
        -- Registered: 2 pts
        coalesce((select count(*) * 2 from public.event_registrations er where er.user_id = p.id and er.registered_at >= t_start), 0) +
        -- Attended: 10 pts
        coalesce((select count(*) * 10 from public.event_attendance ea where ea.user_id = p.id and ea.status = 'present' and ea.marked_at >= t_start), 0) +
        -- Certificate: 5 pts
        coalesce((select count(*) * 5 from public.event_certificates ec where ec.user_id = p.id and ec.issued_at >= t_start), 0) +
        -- Hackathon team created: 8 pts
        coalesce((select count(*) * 8 from public.event_teams et where et.leader_id = p.id and et.created_at >= t_start), 0) +
        -- Hackathon team member: 8 pts
        coalesce((select count(*) * 8 from public.event_team_members etm where etm.email_key = lower(trim(p.email)) and etm.created_at >= t_start), 0)
      )::bigint as pts_events,

      -- 2. Projects Points
      (
        -- Project posted: 15 pts
        coalesce((select count(*) * 15 from public.projects pr where pr.owner_id = p.id and pr.created_at >= t_start), 0) +
        -- Likes received (non-self, max 20 per project): 1 pt
        coalesce((
          select sum(least(20, lk_cnt)) * 1
          from (
            select count(pl.user_id) as lk_cnt
            from public.projects pr
            join public.project_likes pl on pl.project_id = pr.id
            where pr.owner_id = p.id and pl.user_id != pr.owner_id and pl.created_at >= t_start
            group by pr.id
          ) s1
        ), 0) +
        -- Comments received (non-self, max 20 per project): 1 pt
        coalesce((
          select sum(least(20, cm_cnt)) * 1
          from (
            select count(pc.id) as cm_cnt
            from public.projects pr
            join public.project_comments pc on pc.project_id = pr.id
            where pr.owner_id = p.id and pc.author_id != pr.owner_id and pc.created_at >= t_start
            group by pr.id
          ) s2
        ), 0)
      )::bigint as pts_projects,

      -- 3. Forum Points
      (
        -- Question posted: 2 pts
        coalesce((select count(*) * 2 from public.forum_posts fp where fp.author_id = p.id and fp.type = 'question' and fp.created_at >= t_start), 0) +
        -- Answer posted: 5 pts
        coalesce((select count(*) * 5 from public.forum_answers fa where fa.author_id = p.id and fa.created_at >= t_start), 0) +
        -- Answer accepted (non-self): 15 pts
        coalesce((
          select count(*) * 15
          from public.forum_answers fa
          join public.forum_posts fp on fp.accepted_answer_id = fa.id
          where fa.author_id = p.id and fp.author_id != fa.author_id and fa.created_at >= t_start
        ), 0) +
        -- Post upvotes received (non-self, max 20 per post): 1 pt
        coalesce((
          select sum(least(20, uv_cnt)) * 1
          from (
            select count(fu.user_id) as uv_cnt
            from public.forum_posts fp
            join public.forum_upvotes fu on fu.item_id = fp.id and fu.item_type = 'post'
            where fp.author_id = p.id and fu.user_id != fp.author_id and fu.created_at >= t_start
            group by fp.id
          ) s3
        ), 0) +
        -- Answer upvotes received (non-self, max 20 per answer): 1 pt
        coalesce((
          select sum(least(20, uv_cnt)) * 1
          from (
            select count(fu.user_id) as uv_cnt
            from public.forum_answers fa
            join public.forum_upvotes fu on fu.item_id = fa.id and fu.item_type = 'answer'
            where fa.author_id = p.id and fu.user_id != fa.author_id and fu.created_at >= t_start
            group by fa.id
          ) s4
        ), 0)
      )::bigint as pts_forum,

      -- 4. Mentorship Points
      (
        -- Completed as mentor: 10 pts
        coalesce((
          select count(*) * 10
          from public.mentorship_sessions ms
          join public.mentor_profiles mp on mp.id = ms.mentor_id
          where mp.user_id = p.id and ms.status = 'completed' and ms.created_at >= t_start
        ), 0) +
        -- Completed as mentee: 3 pts
        coalesce((select count(*) * 3 from public.mentorship_sessions ms where ms.mentee_id = p.id and ms.status = 'completed' and ms.created_at >= t_start), 0) +
        -- Code review completed (mentor): 8 pts
        coalesce((
          select count(*) * 8
          from public.code_reviews cr
          join public.mentor_profiles mp on mp.id = cr.mentor_id
          where mp.user_id = p.id and cr.status = 'resolved' and cr.created_at >= t_start
        ), 0)
      )::bigint as pts_mentorship,

      -- Earliest Activity Timestamp (for tie breaks)
      coalesce((
        select min(act_time)
        from (
          select min(registered_at) as act_time from public.event_registrations where user_id = p.id
          union all
          select min(created_at) as act_time from public.projects where owner_id = p.id
          union all
          select min(created_at) as act_time from public.forum_posts where author_id = p.id
          union all
          select min(created_at) as act_time from public.forum_answers where author_id = p.id
        ) u_acts
      ), p.created_at) as earliest_act,

      -- Raw counts for badge evaluation
      coalesce((select count(*) from public.event_registrations er where er.user_id = p.id), 0) as total_event_regs,
      coalesce((select count(*) from public.event_attendance ea where ea.user_id = p.id and ea.status = 'present'), 0) as total_event_atts,
      coalesce((
        (select count(*) from public.event_teams et where et.leader_id = p.id) +
        (select count(*) from public.event_team_members etm where etm.email_key = lower(trim(p.email)))
      ), 0) as total_hackathons,
      coalesce((select count(*) from public.projects pr where pr.owner_id = p.id), 0) as total_projects,
      coalesce((
        select count(*)
        from public.forum_answers fa
        join public.forum_posts fp on fp.accepted_answer_id = fa.id
        where fa.author_id = p.id and fp.author_id != fa.author_id
      ), 0) as total_accepted_answers,
      coalesce((
        select count(*)
        from public.mentorship_sessions ms
        join public.mentor_profiles mp on mp.id = ms.mentor_id
        where mp.user_id = p.id and ms.status = 'completed'
      ), 0) as total_mentor_sessions

    from public.profiles p
    where p.is_hidden_from_leaderboard = false
  ),
  scored_users as (
    select
      u.*,
      (u.pts_events + u.pts_projects + u.pts_forum + u.pts_mentorship)::bigint as pts_total,
      case
        when v_category = 'events' then u.pts_events
        when v_category = 'projects' then u.pts_projects
        when v_category = 'forum' then u.pts_forum
        when v_category = 'mentorship' then u.pts_mentorship
        else (u.pts_events + u.pts_projects + u.pts_forum + u.pts_mentorship)
      end::bigint as category_score
    from user_activities u
  ),
  ranked_users as (
    select
      s.*,
      rank() over (order by s.category_score desc, s.earliest_act asc) as rnk
    from scored_users s
  )
  select
    r.u_id as user_id,
    r.u_name as full_name,
    r.u_email as email,
    r.u_year as course_year,
    r.u_github as github_username,
    r.pts_events as events_points,
    r.pts_projects as projects_points,
    r.pts_forum as forum_points,
    r.pts_mentorship as mentorship_points,
    r.pts_total as total_points,
    r.category_score as score,
    r.rnk as rank,
    array_remove(array[
      case when (r.total_event_regs > 0 or r.total_event_atts > 0) then 'First Event' else null end,
      case when r.total_hackathons >= 3 then 'Hackathon Hero' else null end,
      case when r.total_accepted_answers >= 5 then 'Problem Solver' else null end,
      case when r.total_projects >= 3 then 'Builder' else null end,
      case when r.total_mentor_sessions >= 5 then 'Mentor' else null end,
      case when r.rnk <= 10 and r.category_score > 0 then 'Top 10 This Month' else null end
    ], null) as badges,
    r.earliest_act as first_activity_at
  from ranked_users r
  order by r.category_score desc, r.earliest_act asc
  limit p_limit
  offset p_offset;
end;
$$;

-- Grant access to get_leaderboard
grant execute on function public.get_leaderboard(text, text, integer, integer) to anon, authenticated;

-- 5. User Leaderboard Position Function (for Sticky Rank & Profile Insights)
create or replace function public.get_user_leaderboard_position(
  p_user_id uuid,
  p_time_filter text default 'all',
  p_category_filter text default 'overall'
)
returns table (
  user_id uuid,
  rank bigint,
  score bigint,
  total_points bigint,
  points_to_next_rank bigint,
  next_rank_score bigint,
  badges text[]
)
language plpgsql
stable
security definer
as $$
declare
  v_user_score bigint;
  v_user_rank bigint;
  v_next_score bigint;
begin
  return query
  with full_board as (
    select * from public.get_leaderboard(p_time_filter, p_category_filter, 10000, 0)
  ),
  target_user as (
    select * from full_board fb where fb.user_id = p_user_id
  ),
  higher_user as (
    select fb.score from full_board fb
    where fb.score > (select tu.score from target_user tu)
    order by fb.score asc
    limit 1
  )
  select
    tu.user_id,
    tu.rank,
    tu.score,
    tu.total_points,
    case
      when tu.rank = 1 then 0::bigint
      else coalesce((select hu.score from higher_user hu) - tu.score + 1, 0::bigint)
    end as points_to_next_rank,
    coalesce((select hu.score from higher_user hu), tu.score) as next_rank_score,
    tu.badges
  from target_user tu;
end;
$$;

grant execute on function public.get_user_leaderboard_position(uuid, text, text) to anon, authenticated;



-- =============================================================================
-- Source Migration: supabase/migrations/20261118010000_batch_a_foundation.sql
-- =============================================================================

-- =============================================================================
-- Migration: 20261118010000_batch_a_foundation.sql
-- Batch A: Foundation (Onboarding, Auth Hardening, In-App Notifications,
-- Global Search Support, Universal Reports & Moderation, Spam Protections)
-- =============================================================================

-- 1. Extend profiles for Onboarding, Privacy, and Moderation
alter table public.profiles
  add column if not exists interests text[] not null default '{}',
  add column if not exists goals text[] not null default '{}',
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists is_profile_private boolean not null default false,
  add column if not exists is_suspended boolean not null default false,
  add column if not exists warning_count integer not null default 0,
  add column if not exists suspension_reason text;

-- 2. Extend soft-delete flag on user-generated content
alter table if exists public.forum_posts
  add column if not exists is_hidden boolean not null default false;

alter table if exists public.forum_answers
  add column if not exists is_hidden boolean not null default false;

alter table if exists public.projects
  add column if not exists is_hidden boolean not null default false;

alter table if exists public.project_comments
  add column if not exists is_hidden boolean not null default false;

-- 3. Enhance role and moderation security guard on profiles
create or replace function public.prevent_self_role_change()
returns trigger as $$
begin
  -- Prevent role alteration by non-organizers
  if (NEW.role is distinct from OLD.role) then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    ) then
      raise exception 'Unauthorized: Users cannot change their own or other roles.';
    end if;
  end if;

  -- Prevent leaderboard moderation alteration by non-organizers
  if (NEW.is_hidden_from_leaderboard is distinct from OLD.is_hidden_from_leaderboard) then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    ) then
      raise exception 'Unauthorized: Only organizers can alter leaderboard moderation flags.';
    end if;
  end if;

  -- Prevent suspension or warning count alteration by non-organizers
  if (
    (NEW.is_suspended is distinct from OLD.is_suspended) or
    (NEW.warning_count is distinct from OLD.warning_count) or
    (NEW.suspension_reason is distinct from OLD.suspension_reason)
  ) then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'organizer'
    ) then
      raise exception 'Unauthorized: Only organizers can warn or suspend users.';
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- 4. In-App Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications"
  on public.notifications for insert to authenticated
  with check (true);

grant select, insert, update, delete on public.notifications to authenticated;

-- 5. Notification Preferences Table
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_notifications boolean not null default false,
  notify_team_invites boolean not null default true,
  notify_event_updates boolean not null default true,
  notify_mentorship boolean not null default true,
  notify_forum boolean not null default true,
  notify_projects boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can read own preferences" on public.notification_preferences;
create policy "Users can read own preferences"
  on public.notification_preferences for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can upsert own preferences" on public.notification_preferences;
create policy "Users can upsert own preferences"
  on public.notification_preferences for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.notification_preferences to authenticated;

-- 6. Universal Reports Table (Extends forum reporting to projects, comments & users)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('forum_post', 'forum_answer', 'project', 'project_comment', 'user')),
  item_id text not null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'action_taken')),
  moderator_id uuid references auth.users(id),
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_reports_status_date
  on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "Users can submit reports" on public.reports;
create policy "Users can submit reports"
  on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

drop policy if exists "Users can view their submitted reports" on public.reports;
create policy "Users can view their submitted reports"
  on public.reports for select to authenticated
  using (
    reporter_id = (select auth.uid()) or
    exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer')
  );

drop policy if exists "Organizers can update reports" on public.reports;
create policy "Organizers can update reports"
  on public.reports for update to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer'))
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer'));

grant select, insert, update on public.reports to authenticated;

-- 7. Moderation Audit Log Table
create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references auth.users(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.moderation_logs enable row level security;

drop policy if exists "Organizers can view moderation logs" on public.moderation_logs;
create policy "Organizers can view moderation logs"
  on public.moderation_logs for select to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer'));

drop policy if exists "Organizers can insert moderation logs" on public.moderation_logs;
create policy "Organizers can insert moderation logs"
  on public.moderation_logs for insert to authenticated
  with check (
    moderator_id = (select auth.uid()) and
    exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'organizer')
  );

grant select, insert on public.moderation_logs to authenticated;
