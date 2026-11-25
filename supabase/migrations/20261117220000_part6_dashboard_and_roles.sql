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
