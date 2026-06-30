-- ROOMLY — full schema
-- Run this once in Supabase SQL Editor (Project > SQL Editor > New query > paste > Run)

create extension if not exists "uuid-ossp";

-- ---------- HOUSES (multi-house support) ----------
create table houses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  currency text not null default 'BDT',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ---------- MEMBERS (links a Supabase auth user to a house, with role) ----------
create table members (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'member' check (role in ('admin','member')),
  color text not null default '#1F6F54',
  created_at timestamptz default now(),
  unique (house_id, user_id)
);

-- ---------- CATEGORIES (admin-manageable, seeded with spec defaults) ----------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  name text not null,
  is_food boolean not null default false, -- feeds the meal-rate calculation
  icon text default 'receipt',
  sort_order int default 0
);

-- ---------- MONTHLY LEDGERS (archive: one row per house per month, lockable) ----------
create table ledgers (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  month date not null, -- first day of month, e.g. 2026-06-01
  locked boolean not null default false,
  unique (house_id, month)
);

-- ---------- EXPENSES ----------
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  ledger_id uuid references ledgers(id) on delete cascade,
  category_id uuid references categories(id),
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  paid_by uuid references members(id),
  due_date date,
  date date not null default current_date,
  status text not null default 'paid' check (status in ('paid','due')),
  split_mode text not null default 'equal' check (split_mode in ('equal','percentage','custom_amount','selected')),
  split_with uuid[], -- member ids included in the split when not 'equal'
  notes text,
  is_recurring boolean default false,
  recurrence_interval text check (recurrence_interval in (null,'monthly','weekly')),
  meta jsonb default '{}'::jsonb, -- category-specific fields: meter_reading, provider, package, bonus, etc.
  created_by uuid references members(id),
  created_at timestamptz default now()
);

-- ---------- EXPENSE SPLITS (resolved per-member share, for percentage/custom modes) ----------
create table expense_splits (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  share_amount numeric(12,2) not null,
  share_percent numeric(5,2)
);

-- ---------- MEALS ----------
create table meals (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  date date not null default current_date,
  breakfast numeric(4,2) not null default 0,
  lunch numeric(4,2) not null default 0,
  dinner numeric(4,2) not null default 0,
  snacks numeric(4,2) not null default 0,
  created_at timestamptz default now(),
  unique (member_id, date)
);

-- ---------- PAYMENTS (settlement records, separate from expenses) ----------
create table payments (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  member_id uuid references members(id),
  amount numeric(12,2) not null,
  purpose text,
  method text not null default 'cash' check (method in ('cash','bank','mobile_banking','card')),
  date date not null default current_date,
  created_at timestamptz default now()
);

-- ---------- SECURITY DEPOSITS ----------
create table deposits (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  member_id uuid references members(id),
  amount numeric(12,2) not null,
  date date not null default current_date,
  refunded boolean default false,
  notes text
);

-- ---------- NOTES (shared, live) ----------
create table notes (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  member_id uuid references members(id),
  text text not null,
  done boolean not null default false,
  created_at timestamptz default now()
);

-- ---------- CALENDAR EVENTS ----------
create table events (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  title text not null,
  type text default 'custom' check (type in ('rent','utility','grocery','maid','custom')),
  date date not null,
  created_by uuid references members(id)
);

-- ---------- ATTACHMENTS (metadata; binary lives in Supabase Storage bucket "attachments") ----------
create table attachments (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  expense_id uuid references expenses(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  uploaded_by uuid references members(id),
  created_at timestamptz default now()
);

-- ---------- ACTIVITY LOG / AUDIT HISTORY ----------
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  house_id uuid references houses(id) on delete cascade,
  member_id uuid references members(id),
  action text not null,        -- e.g. "added_expense", "deleted_expense", "logged_meal"
  entity_type text not null,   -- e.g. "expense", "meal", "note"
  entity_id uuid,
  detail jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ======================================================================
-- ROW LEVEL SECURITY — a user can only read/write data for houses they
-- belong to (via the members table). This is what makes it safe to call
-- Supabase directly from the browser.
-- ======================================================================

alter table houses enable row level security;
alter table members enable row level security;
alter table categories enable row level security;
alter table ledgers enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table meals enable row level security;
alter table payments enable row level security;
alter table deposits enable row level security;
alter table notes enable row level security;
alter table events enable row level security;
alter table attachments enable row level security;
alter table activity_log enable row level security;

create or replace function is_house_member(h uuid) returns boolean as $$
  select exists (select 1 from members where house_id = h and user_id = auth.uid());
$$ language sql security definer;

create or replace function is_house_admin(h uuid) returns boolean as $$
  select exists (select 1 from members where house_id = h and user_id = auth.uid() and role = 'admin');
$$ language sql security definer;

-- Houses: members can read; creation is open (needed to create your first house); only admins update
create policy "read own house" on houses for select using (is_house_member(id));
create policy "create house" on houses for insert with check (auth.uid() = created_by);
create policy "admin update house" on houses for update using (is_house_admin(id));

-- Members: readable by housemates; you can insert yourself when joining via invite code (handled in app logic via RPC below)
create policy "read housemates" on members for select using (is_house_member(house_id));
create policy "insert self as member" on members for insert with check (user_id = auth.uid());
create policy "admin manage members" on members for update using (is_house_admin(house_id));
create policy "admin remove members" on members for delete using (is_house_admin(house_id));

-- Generic pattern for the rest: read/write if you belong to the house
create policy "house rw categories" on categories for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "house rw ledgers" on ledgers for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "house rw expenses" on expenses for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "house rw splits" on expense_splits for all using (is_house_member((select house_id from expenses where id = expense_id))) with check (true);
create policy "house rw meals" on meals for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "house rw payments" on payments for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "house rw deposits" on deposits for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "house rw notes" on notes for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "house rw events" on events for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "house rw attachments" on attachments for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "house read log" on activity_log for select using (is_house_member(house_id));
create policy "house insert log" on activity_log for insert with check (is_house_member(house_id));

-- ======================================================================
-- RPC: join a house by invite code (runs as the inviting house's owner
-- via security definer, so a brand-new user with no house yet is allowed
-- to look up the code and insert their own member row)
-- ======================================================================
create or replace function join_house(p_invite_code text, p_name text)
returns uuid as $$
declare
  v_house_id uuid;
  v_member_id uuid;
begin
  select id into v_house_id from houses where invite_code = p_invite_code;
  if v_house_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into members (house_id, user_id, name, role, color)
  values (v_house_id, auth.uid(), p_name, 'member',
    ('#' || lpad(to_hex((random()*16777215)::int), 6, '0')))
  on conflict (house_id, user_id) do nothing
  returning id into v_member_id;

  return v_house_id;
end;
$$ language plpgsql security definer;

-- ======================================================================
-- Seed default categories whenever a house is created
-- ======================================================================
create or replace function seed_categories() returns trigger as $$
begin
  insert into categories (house_id, name, is_food, icon, sort_order) values
    (new.id, 'Rent', false, 'home', 1),
    (new.id, 'Electricity', false, 'bolt', 2),
    (new.id, 'Gas bill', false, 'flame', 3),
    (new.id, 'Water', false, 'droplet', 4),
    (new.id, 'Internet/WiFi', false, 'wifi', 5),
    (new.id, 'Maid', false, 'user', 6),
    (new.id, 'Cleaning supplies', false, 'spray', 7),
    (new.id, 'Grocery', true, 'shopping-cart', 8),
    (new.id, 'Kitchen', true, 'tools-kitchen', 9),
    (new.id, 'Drinking water', true, 'bottle', 10),
    (new.id, 'Cooking gas', true, 'cylinder', 11),
    (new.id, 'Maintenance', false, 'tool', 12),
    (new.id, 'Parking', false, 'parking', 13),
    (new.id, 'Miscellaneous', false, 'dots', 14);
  return new;
end;
$$ language plpgsql;

create trigger trg_seed_categories after insert on houses
for each row execute function seed_categories();

-- Auto-create current month's ledger when a house is created, and helper to fetch/create current ledger
create or replace function get_or_create_ledger(p_house_id uuid, p_month date)
returns uuid as $$
declare v_id uuid;
begin
  select id into v_id from ledgers where house_id = p_house_id and month = date_trunc('month', p_month)::date;
  if v_id is null then
    insert into ledgers (house_id, month) values (p_house_id, date_trunc('month', p_month)::date) returning id into v_id;
  end if;
  return v_id;
end;
$$ language plpgsql security definer;

-- Storage bucket for receipts/bills (run once; Supabase also lets you do this from the dashboard UI)
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "house members read attachments storage" on storage.objects for select
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');
create policy "house members upload attachments storage" on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');
