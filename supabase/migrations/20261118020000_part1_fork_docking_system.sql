-- ==============================================================================
-- Migration: 20261118020000_part1_fork_docking_system.sql
-- Purpose: Rate limiting infrastructure & optimized Fork/Docking social graph
-- Depends on: 20261117000000_events_data_layer.sql, 20261118010000_batch_a_foundation.sql
-- Safe to re-run: YES (Idempotent: IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY IF EXISTS)
-- ==============================================================================

-- 1. Reusable Rate Limit Tracking Table
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limits_user_action_time 
  on public.rate_limits (user_id, action, created_at desc);

create index if not exists idx_rate_limits_user_target_time 
  on public.rate_limits (user_id, action, target_id, created_at desc);

alter table public.rate_limits enable row level security;

drop policy if exists "rate_limits_self_read" on public.rate_limits;
create policy "rate_limits_self_read" on public.rate_limits
  for select using (auth.uid() = user_id);

-- 2. Reusable Rate Limit Check Function (Engine for Fork, Comments, Messaging)
create or replace function public.check_and_record_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_per_minute int,
  p_max_per_day int,
  p_target_id text default null,
  p_toggle_cooldown_seconds int default 5
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_user_created_at timestamptz;
  v_is_new_account boolean;
  v_limit_minute int := p_max_per_minute;
  v_limit_day int := p_max_per_day;
  v_count_minute int;
  v_count_day int;
  v_last_toggle_time timestamptz;
begin
  if p_user_id is null then
    raise exception 'AUTH_REQUIRED: User must be signed in to check rate limits.';
  end if;

  -- Check account age from profiles (fallback to auth.users)
  select created_at into v_user_created_at from public.profiles where id = p_user_id;
  if v_user_created_at is null then
    select created_at into v_user_created_at from auth.users where id = p_user_id;
  end if;

  v_is_new_account := (v_user_created_at is not null and v_user_created_at > (now() - interval '24 hours'));
  if v_is_new_account then
    -- Tighter limits for accounts under 24 hours old
    v_limit_minute := greatest(1, p_max_per_minute / 2);
    v_limit_day := greatest(5, p_max_per_day / 2);
  end if;

  -- Check toggle cooldown against the same target entity
  if p_target_id is not null and p_toggle_cooldown_seconds > 0 then
    select created_at into v_last_toggle_time 
    from public.rate_limits
    where user_id = p_user_id 
      and action = p_action 
      and target_id = p_target_id 
    order by created_at desc 
    limit 1;

    if v_last_toggle_time is not null and v_last_toggle_time > (now() - (p_toggle_cooldown_seconds || ' seconds')::interval) then
      raise exception 'RATE_LIMIT_COOLDOWN: Slow down! Please wait a few seconds before toggling this action again.';
    end if;
  end if;

  -- Check actions in the last 1 minute
  select count(*) into v_count_minute
  from public.rate_limits
  where user_id = p_user_id 
    and action = p_action 
    and created_at > (now() - interval '1 minute');

  if v_count_minute >= v_limit_minute then
    raise exception 'RATE_LIMIT_EXCEEDED: Slow down, try again in a minute.';
  end if;

  -- Check actions in the last 24 hours
  select count(*) into v_count_day
  from public.rate_limits
  where user_id = p_user_id 
    and action = p_action 
    and created_at > (now() - interval '24 hours');

  if v_count_day >= v_limit_day then
    raise exception 'RATE_LIMIT_DAILY_EXCEEDED: Daily limit reached for this action. Please try again tomorrow.';
  end if;

  -- Record event
  insert into public.rate_limits (user_id, action, target_id, created_at)
  values (p_user_id, p_action, p_target_id, now());

  return true;
end;
$$;

-- 3. Fork / Docking Table
create table if not exists public.user_forks (
  id uuid primary key default gen_random_uuid(),
  forker_id uuid not null references public.profiles(id) on delete cascade,
  forked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_forks_no_self_fork check (forker_id != forked_id),
  constraint user_forks_unique_pair unique (forker_id, forked_id)
);

create index if not exists idx_user_forks_forker on public.user_forks(forker_id);
create index if not exists idx_user_forks_forked on public.user_forks(forked_id);

alter table public.user_forks enable row level security;

drop policy if exists "user_forks_public_read" on public.user_forks;
create policy "user_forks_public_read" on public.user_forks
  for select using (true);

drop policy if exists "user_forks_self_insert" on public.user_forks;
create policy "user_forks_self_insert" on public.user_forks
  for insert with check (auth.uid() = forker_id);

drop policy if exists "user_forks_self_delete" on public.user_forks;
create policy "user_forks_self_delete" on public.user_forks
  for delete using (auth.uid() = forker_id);

-- 4. Counter Columns on Profiles (Dockers = followers, Docking = following)
alter table public.profiles
  add column if not exists dockers_count int not null default 0,
  add column if not exists docking_count int not null default 0;

-- 5. Trigger to Keep Counter Columns Synchronized
create or replace function public.maintain_user_fork_counts()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    -- Increment forker's docking_count
    update public.profiles
    set docking_count = coalesce(docking_count, 0) + 1
    where id = new.forker_id;

    -- Increment forked user's dockers_count
    update public.profiles
    set dockers_count = coalesce(dockers_count, 0) + 1
    where id = new.forked_id;

    return new;
  elsif tg_op = 'DELETE' then
    -- Decrement forker's docking_count
    update public.profiles
    set docking_count = greatest(0, coalesce(docking_count, 0) - 1)
    where id = old.forker_id;

    -- Decrement forked user's dockers_count
    update public.profiles
    set dockers_count = greatest(0, coalesce(dockers_count, 0) - 1)
    where id = old.forked_id;

    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_maintain_user_fork_counts on public.user_forks;
create trigger trg_maintain_user_fork_counts
  after insert or delete on public.user_forks
  for each row execute function public.maintain_user_fork_counts();

-- 6. Rate-Limited, Notification-Throttled RPC for Forking a User
create or replace function public.fork_user(target_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_caller_id uuid := auth.uid();
  v_caller_suspended boolean;
  v_target_suspended boolean;
  v_caller_name text;
  v_recent_notif_count int;
  v_dockers_count int;
  v_docking_count int;
begin
  if v_caller_id is null then
    raise exception 'AUTH_REQUIRED: You must be signed in to Fork a user.';
  end if;

  if v_caller_id = target_user_id then
    raise exception 'SELF_FORK_BLOCKED: You cannot Fork yourself.';
  end if;

  -- Verify neither user is suspended
  select is_suspended into v_caller_suspended from public.profiles where id = v_caller_id;
  if coalesce(v_caller_suspended, false) then
    raise exception 'ACCOUNT_SUSPENDED: Suspended accounts cannot Fork other users.';
  end if;

  select is_suspended into v_target_suspended from public.profiles where id = target_user_id;
  if coalesce(v_target_suspended, false) then
    raise exception 'USER_UNAVAILABLE: This user is currently unavailable.';
  end if;

  -- 1. Enforce rate limits via reusable rate_limits engine (15/min, 100/day, 5s cooldown)
  perform public.check_and_record_rate_limit(
    v_caller_id,
    'fork',
    15,
    100,
    target_user_id::text,
    5
  );

  -- 2. Insert into user_forks (unique constraint ensures at most 1 row per pair)
  insert into public.user_forks (forker_id, forked_id)
  values (v_caller_id, target_user_id)
  on conflict (forker_id, forked_id) do nothing;

  -- 3. Throttled notification (at most 1 per pair per 24 hours to prevent spam)
  select full_name into v_caller_name from public.profiles where id = v_caller_id;

  select count(*) into v_recent_notif_count
  from public.notifications
  where user_id = target_user_id
    and type = 'fork'
    and link = '/students/' || v_caller_id::text
    and created_at > (now() - interval '24 hours');

  if v_recent_notif_count = 0 then
    insert into public.notifications (user_id, type, title, message, link, created_at)
    values (
      target_user_id,
      'fork',
      'New Docker!',
      coalesce(v_caller_name, 'A student') || ' started Docking you (Forked your profile).',
      '/students/' || v_caller_id::text,
      now()
    );
  end if;

  -- 4. Return live counts
  select dockers_count into v_dockers_count from public.profiles where id = target_user_id;
  select docking_count into v_docking_count from public.profiles where id = v_caller_id;

  return jsonb_build_object(
    'success', true,
    'is_forking', true,
    'dockers_count', coalesce(v_dockers_count, 0),
    'docking_count', coalesce(v_docking_count, 0)
  );
end;
$$;

-- 7. Rate-Limited RPC for Unforking a User
create or replace function public.unfork_user(target_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_caller_id uuid := auth.uid();
  v_dockers_count int;
  v_docking_count int;
begin
  if v_caller_id is null then
    raise exception 'AUTH_REQUIRED: You must be signed in to Unfork a user.';
  end if;

  if v_caller_id = target_user_id then
    raise exception 'SELF_UNFORK_BLOCKED: You cannot Unfork yourself.';
  end if;

  -- 1. Enforce rate limits via reusable rate_limits engine (20/min, 150/day, 3s cooldown)
  perform public.check_and_record_rate_limit(
    v_caller_id,
    'unfork',
    20,
    150,
    target_user_id::text,
    3
  );

  -- 2. Delete from user_forks (triggers automatically decrement counts)
  delete from public.user_forks
  where forker_id = v_caller_id and forked_id = target_user_id;

  -- 3. Return live counts
  select dockers_count into v_dockers_count from public.profiles where id = target_user_id;
  select docking_count into v_docking_count from public.profiles where id = v_caller_id;

  return jsonb_build_object(
    'success', true,
    'is_forking', false,
    'dockers_count', coalesce(v_dockers_count, 0),
    'docking_count', coalesce(v_docking_count, 0)
  );
end;
$$;
