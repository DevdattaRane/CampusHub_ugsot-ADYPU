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
