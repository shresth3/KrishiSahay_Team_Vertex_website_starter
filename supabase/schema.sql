-- Run this in Supabase SQL Editor before enabling persisted harvest records.
-- Supabase Auth owns the user identity; row-level security restricts each farmer to their own data.

create table if not exists public.harvests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  crop text not null,
  quantity_quintals numeric(10,2) not null check (quantity_quintals > 0),
  village text,
  harvest_at timestamptz not null default now(),
  storage_available boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.market_estimates (
  id uuid primary key default gen_random_uuid(),
  harvest_id uuid not null references public.harvests(id) on delete cascade,
  mandi_name text not null,
  distance_km numeric(10,2),
  price_per_quintal numeric(12,2) not null check (price_per_quintal >= 0),
  transport_cost numeric(12,2) not null default 0,
  handling_cost numeric(12,2) not null default 0,
  storage_cost numeric(12,2) not null default 0,
  expected_spoilage_percent numeric(5,2) not null default 0,
  source_name text not null default 'Demo data - not live',
  source_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.transport_pools (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  origin_label text not null,
  destination_label text not null,
  departure_window timestamptz,
  vehicle_fare numeric(12,2) not null check (vehicle_fare >= 0),
  capacity_quintals numeric(10,2),
  status text not null default 'draft' check (status in ('draft','open','full','cancelled','completed')),
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pool_members (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.transport_pools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  load_quintals numeric(10,2) not null check (load_quintals > 0),
  fare_share numeric(12,2) not null default 0,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(pool_id, user_id)
);

alter table public.harvests enable row level security;
alter table public.market_estimates enable row level security;
alter table public.transport_pools enable row level security;
alter table public.pool_members enable row level security;

create policy "farmers manage own harvests" on public.harvests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "farmers manage estimates for own harvests" on public.market_estimates
  for all using (exists (select 1 from public.harvests h where h.id = harvest_id and h.user_id = auth.uid()))
  with check (exists (select 1 from public.harvests h where h.id = harvest_id and h.user_id = auth.uid()));

create policy "farmers can view open pools and manage own pools" on public.transport_pools
  for select using (status = 'open' or auth.uid() = created_by);
create policy "farmers create own pools" on public.transport_pools
  for insert with check (auth.uid() = created_by);
create policy "creators update own pools" on public.transport_pools
  for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "members can view own pool memberships" on public.pool_members
  for select using (auth.uid() = user_id or exists (
    select 1 from public.transport_pools p where p.id = pool_id and p.created_by = auth.uid()
  ));
create policy "farmers join as themselves" on public.pool_members
  for insert with check (auth.uid() = user_id);
create policy "farmers update own pool membership" on public.pool_members
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
