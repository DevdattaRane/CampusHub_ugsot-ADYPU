-- =============================================================================
-- Migration: 20261126220000_repair_auth_and_profiles.sql
-- Repair Authentication & Profiles:
-- 1. Resilient profile creation trigger on auth.users (prevents sign-up aborts)
-- 2. Grant update privileges on extended profile fields to authenticated role
-- 3. Grant insert privilege with RLS self-insert policy for authenticated users
-- 4. Grant select on public profiles to anon and authenticated users
-- 5. Safe backfill for existing auth users missing profile records
-- =============================================================================

-- 1. Resilient trigger function for new auth users
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
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'course_year'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
      course_year = coalesce(excluded.course_year, public.profiles.course_year),
      updated_at = now();
  return new;
exception
  when unique_violation then
    -- If email unique constraint is violated due to an orphaned profile record, re-link to new auth id
    begin
      update public.profiles
      set id = new.id,
          full_name = case when coalesce(new.raw_user_meta_data ->> 'full_name', '') <> '' then new.raw_user_meta_data ->> 'full_name' else public.profiles.full_name end,
          course_year = coalesce(new.raw_user_meta_data ->> 'course_year', public.profiles.course_year),
          updated_at = now()
      where email = lower(coalesce(new.email, ''));
    exception when others then
      -- Fall through
      null;
    end;
    return new;
  when others then
    -- Never abort auth user creation; self-healing in application will ensure profile exists
    return new;
end;
$$;

-- Ensure trigger is active on auth.users
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

-- 2. Grant UPDATE privileges on user-modifiable profile fields to authenticated users
grant update (
  full_name,
  course_year,
  github_username,
  skills,
  bio,
  interests,
  goals,
  onboarding_completed,
  is_profile_private,
  updated_at
) on public.profiles to authenticated;

-- 3. Grant INSERT privilege and add RLS policy so authenticated users can create their own profile record if missing
grant insert on public.profiles to authenticated;

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (
    id = auth.uid()
    and (role = 'student' or role is null)
  );

-- 4. Grant SELECT privilege on profiles to anon and authenticated, with RLS respecting privacy
grant select on public.profiles to anon, authenticated;

drop policy if exists "Profiles are visible to their owner and organizers" on public.profiles;
drop policy if exists "Public profiles are readable by campus users" on public.profiles;

create policy "Public profiles are readable by campus users"
  on public.profiles for select
  to anon, authenticated
  using (
    id = auth.uid()
    or is_profile_private = false
    or is_profile_private is null
    or (select public.is_event_organizer())
  );

-- 5. Backfill profiles for existing auth users missing a profile record
insert into public.profiles (id, email, full_name, course_year)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  u.raw_user_meta_data ->> 'course_year'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null and u.email is not null
on conflict (id) do nothing
on conflict (email) do nothing;
