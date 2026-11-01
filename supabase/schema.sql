-- =====================================================================
--  AGENCY HQ — Supabase schema
--  Τρέξε ολόκληρο το αρχείο στο Supabase Dashboard → SQL Editor → Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'member' check (role in ('admin', 'member')),
  created_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  color       text not null default '#3b6ea5',
  created_by  uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);

create table if not exists public.macro_goals (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  category_id    uuid references public.categories(id) on delete set null,
  unit           text not null default '',
  target_value   numeric not null default 100 check (target_value > 0),
  current_value  numeric not null default 0 check (current_value >= 0),
  step           numeric not null default 1 check (step > 0),
  start_date     date not null default current_date,
  deadline       date not null,
  created_by     uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now()
);

create table if not exists public.micro_tasks (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  category_id      uuid references public.categories(id) on delete set null,
  target_count     int not null default 1 check (target_count > 0),
  current_count    int not null default 0 check (current_count >= 0),
  task_date        date not null default current_date,
  completed_at     timestamptz,
  last_updated_by  uuid references public.profiles(id) on delete set null,
  created_by       uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now()
);
create index if not exists micro_tasks_date_idx on public.micro_tasks (task_date);

create table if not exists public.sync_notes (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  note_date   date not null default current_date,
  created_by  uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  note        text,
  status      text not null default 'new'
              check (status in ('new', 'called', 'follow_up', 'won', 'lost')),
  lead_date   date not null default current_date,
  created_by  uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_role()
returns text language sql security definer stable set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Ατομική αύξηση/μείωση counter (ασφαλές όταν δύο άτομα πατάνε ταυτόχρονα)
create or replace function public.adjust_task(task_id uuid, delta int)
returns public.micro_tasks language sql security invoker as $$
  update public.micro_tasks set
    current_count = greatest(0, least(target_count, current_count + delta)),
    completed_at  = case
      when greatest(0, least(target_count, current_count + delta)) >= target_count
        then coalesce(completed_at, now())
      else null end,
    last_updated_by = auth.uid()
  where id = task_id
  returning *;
$$;

-- Νέος χρήστης → profile. Ο ΠΡΩΤΟΣ χρήστης γίνεται Admin, οι υπόλοιποι Member.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    case when (select count(*) from public.profiles) = 0 then 'admin' else 'member' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated using (true);

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role());

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (true);

do $$
declare t text;
begin
  foreach t in array array['categories','macro_goals','micro_tasks','sync_notes','leads'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (true)', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (true) with check (true)', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin() or created_by = auth.uid())', t || '_delete', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table
  public.profiles, public.categories, public.macro_goals,
  public.micro_tasks, public.sync_notes, public.leads;

-- ---------------------------------------------------------------------
-- SEED: αρχικές κατηγορίες
-- ---------------------------------------------------------------------
insert into public.categories (name, color) values
  ('ScanEat', '#5fa777'),
  ('Client Sites', '#3b6ea5'),
  ('Marketing / Internal', '#c28b4a')
on conflict (name) do nothing;
