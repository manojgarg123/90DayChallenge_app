-- ================================================================
-- 90 Day Challenge App - Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ================================================================
-- PROFILES
-- ================================================================
create table if not exists public.profiles (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null unique,
  full_name    text,
  avatar_url   text,
  bio          text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- CHALLENGES
-- ================================================================
create table if not exists public.challenges (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  title               text not null,
  goal_description    text not null,
  goal_verb           text,
  goal_object         text,
  goal_outcome        text,
  identity_statement  text,
  start_date          date not null,
  end_date            date not null,
  status              text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at          timestamptz default now() not null
);

-- Migration for existing databases (run if table already exists):
-- alter table public.challenges add column if not exists goal_verb text;
-- alter table public.challenges add column if not exists goal_object text;
-- alter table public.challenges add column if not exists goal_outcome text;
-- alter table public.challenges add column if not exists identity_statement text;

alter table public.challenges enable row level security;

create policy "Users can manage own challenges"
  on public.challenges for all
  using (auth.uid() = user_id);

-- ================================================================
-- SEGMENTS (focus areas within a challenge)
-- ================================================================
create table if not exists public.segments (
  id            uuid primary key default uuid_generate_v4(),
  challenge_id  uuid references public.challenges(id) on delete cascade not null,
  name          text not null,
  description   text not null,
  icon          text not null default '🎯',
  color         text not null default 'lavender',
  order_index   integer not null default 0,
  created_at    timestamptz default now() not null
);

alter table public.segments enable row level security;

create policy "Users can manage segments of own challenges"
  on public.segments for all
  using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.user_id = auth.uid()
    )
  );

-- ================================================================
-- TASKS (individual tasks within a segment, scheduled by day)
-- ================================================================
create table if not exists public.tasks (
  id            uuid primary key default uuid_generate_v4(),
  challenge_id  uuid references public.challenges(id) on delete cascade not null,
  segment_id    uuid references public.segments(id) on delete cascade not null,
  title         text not null,
  description   text,
  day_number    integer not null check (day_number >= 1),
  week_number   integer not null check (week_number >= 1),
  frequency     text not null default 'daily' check (frequency in ('daily', 'weekly', 'once')),
  created_at    timestamptz default now() not null
);

alter table public.tasks enable row level security;

create policy "Users can manage tasks of own challenges"
  on public.tasks for all
  using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.user_id = auth.uid()
    )
  );

create index idx_tasks_challenge_day on public.tasks(challenge_id, day_number);
create index idx_tasks_segment on public.tasks(segment_id);

-- ================================================================
-- PROGRESS LOGS
-- ================================================================
create table if not exists public.progress_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  task_id       uuid references public.tasks(id) on delete cascade not null,
  challenge_id  uuid references public.challenges(id) on delete cascade not null,
  logged_date   date not null,
  status        text not null check (status in ('completed', 'skipped', 'partial')),
  notes         text,
  mood          integer check (mood between 1 and 5),
  created_at    timestamptz default now() not null,
  unique(task_id, logged_date)
);

alter table public.progress_logs enable row level security;

create policy "Users can manage own progress logs"
  on public.progress_logs for all
  using (auth.uid() = user_id);

create index idx_progress_logs_challenge_date on public.progress_logs(challenge_id, logged_date);
create index idx_progress_logs_user on public.progress_logs(user_id);

-- ================================================================
-- WEEKLY SUMMARIES
-- ================================================================
create table if not exists public.weekly_summaries (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  challenge_id      uuid references public.challenges(id) on delete cascade not null,
  week_number       integer not null check (week_number between 1 and 13),
  total_tasks       integer not null default 0,
  completed_tasks   integer not null default 0,
  skipped_tasks     integer not null default 0,
  completion_rate   numeric(5,2) not null default 0,
  notes             text,
  created_at        timestamptz default now() not null,
  unique(challenge_id, week_number)
);

alter table public.weekly_summaries enable row level security;

create policy "Users can manage own weekly summaries"
  on public.weekly_summaries for all
  using (auth.uid() = user_id);

-- ================================================================
-- NUDGES
-- ================================================================
create table if not exists public.nudges (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  challenge_id   uuid references public.challenges(id) on delete cascade not null,
  message        text not null,
  type           text not null default 'motivation' check (type in ('motivation', 'reminder', 'milestone', 'warning')),
  read           boolean not null default false,
  scheduled_for  timestamptz not null default now(),
  created_at     timestamptz default now() not null
);

alter table public.nudges enable row level security;

create policy "Users can manage own nudges"
  on public.nudges for all
  using (auth.uid() = user_id);

create index idx_nudges_user_unread on public.nudges(user_id, read) where read = false;

-- ================================================================
-- PUSH SUBSCRIPTIONS (for Web Push notifications)
-- ================================================================
create table if not exists public.push_subscriptions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null unique,
  endpoint     text not null,
  p256dh       text not null,
  auth_key     text not null,
  created_at   timestamptz default now() not null
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id);

-- ================================================================
-- HELPER VIEWS
-- ================================================================

-- Challenge progress overview
create or replace view public.challenge_progress as
select
  c.id,
  c.user_id,
  c.title,
  c.status,
  c.start_date,
  c.end_date,
  count(distinct t.id) as total_tasks_scheduled,
  count(distinct pl.id) filter (where pl.status = 'completed') as completed_tasks,
  case
    when count(distinct t.id) = 0 then 0
    else round(
      count(distinct pl.id) filter (where pl.status = 'completed')::numeric
      / count(distinct t.id)::numeric * 100, 2
    )
  end as completion_rate,
  (current_date - c.start_date + 1) as current_day
from public.challenges c
left join public.tasks t on t.challenge_id = c.id
left join public.progress_logs pl on pl.task_id = t.id
group by c.id, c.user_id, c.title, c.status, c.start_date, c.end_date;

-- ================================================================
-- REALTIME
-- ================================================================
alter publication supabase_realtime add table public.progress_logs;
alter publication supabase_realtime add table public.nudges;
