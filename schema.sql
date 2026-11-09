-- Inventory Keeper: Supabase schema (paste into SQL Editor and run once on a fresh project)
-- Design: members can READ everything; all quantity changes go through functions so totals stay consistent and every change is logged.

-- ============ 1. ALLOWLIST AND MEMBERS ============
create table public.allowed_members (
  email text primary key check (email = lower(email)),
  role text not null default 'member' check (role in ('member','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- Helper functions (security definer so they can read allowed_members despite RLS)
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from allowed_members a
                 where a.email = lower(auth.jwt() ->> 'email') and a.active);
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from allowed_members a
                 where a.email = lower(auth.jwt() ->> 'email') and a.active and a.role = 'admin');
$$;

-- Block sign-up for emails not on the allowlist; create profile row for those who are.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from allowed_members where email = lower(new.email) and active) then
    raise exception 'Email not on member allowlist';
  end if;
  insert into members (id, email, name)
  values (new.id, lower(new.email), split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ 2. REFERENCE DATA ============
create table public.categories (
  id serial primary key,
  name text not null unique
);
insert into public.categories (name) values
  ('Cooking tools'), ('Serving and crockery'), ('Lighting and electrical'), ('Decor'),
  ('Drinks'), ('Dry goods and spices'), ('Tents and furniture'), ('Misc');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,               -- e.g. 'Diwali 2026'
  event_date date,
  location text,
  created_at timestamptz not null default now()
);

-- ============ 3. ITEMS ============
create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id int references public.categories(id),
  description text,
  unit text not null default 'pcs',                       -- pcs, kg, L, crates, packs
  kind text not null default 'equipment' check (kind in ('equipment','consumable')),
  low_stock_threshold numeric check (low_stock_threshold >= 0),  -- consumables only
  expiry_date date,
  notes text,
  archived boolean not null default false,
  created_by uuid references public.members(id),
  created_at timestamptz not null default now()
);

create table public.item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  storage_path text not null,       -- path inside the 'item-photos' bucket
  created_at timestamptz not null default now()
);

-- Who holds how many of each item. Changed ONLY via functions below (or by admins).
create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  member_id uuid not null references public.members(id),
  quantity numeric not null default 0 check (quantity >= 0),
  location_note text,               -- e.g. 'Keller, blue shelf'
  last_confirmed_at timestamptz not null default now(),
  unique (item_id, member_id)
);

-- Append-only history. For 'adjust', quantity is a signed delta.
create table public.movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id),
  type text not null check (type in ('add','use','transfer','adjust','lost')),
  quantity numeric not null check (quantity <> 0),
  from_member uuid references public.members(id),
  to_member uuid references public.members(id),
  event_id uuid references public.events(id),
  note text,
  created_by uuid references public.members(id),
  created_at timestamptz not null default now()
);

-- Handover requests: receiver must accept.
create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id),
  from_member uuid not null references public.members(id),
  to_member uuid not null references public.members(id),
  quantity numeric not null check (quantity > 0),
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (from_member <> to_member)
);

-- Totals are derived, never stored, so they cannot drift.
create view public.items_with_totals with (security_invoker = true) as
select i.*, coalesce(sum(h.quantity), 0) as quantity_total
from public.items i
left join public.holdings h on h.item_id = i.id
group by i.id;

-- ============ 4. FUNCTIONS (the only way members change quantities) ============
-- Add stock that I now hold (new purchase, donation, or first entry of an existing item)
create or replace function public.add_stock(p_item uuid, p_qty numeric, p_location text default null, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_member() then raise exception 'not allowed'; end if;
  if p_qty <= 0 then raise exception 'quantity must be positive'; end if;
  insert into holdings (item_id, member_id, quantity, location_note)
  values (p_item, auth.uid(), p_qty, p_location)
  on conflict (item_id, member_id)
  do update set quantity = holdings.quantity + excluded.quantity,
                location_note = coalesce(excluded.location_note, holdings.location_note),
                last_confirmed_at = now();
  insert into movements (item_id, type, quantity, to_member, note, created_by)
  values (p_item, 'add', p_qty, auth.uid(), p_note, auth.uid());
end; $$;

-- Use up stock I hold (optionally tied to an event)
create or replace function public.use_stock(p_item uuid, p_qty numeric, p_event uuid default null, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare have numeric;
begin
  if not is_member() then raise exception 'not allowed'; end if;
  if p_qty <= 0 then raise exception 'quantity must be positive'; end if;
  select quantity into have from holdings where item_id = p_item and member_id = auth.uid() for update;
  if have is null or have < p_qty then raise exception 'you do not hold enough of this item'; end if;
  update holdings set quantity = quantity - p_qty, last_confirmed_at = now()
  where item_id = p_item and member_id = auth.uid();
  insert into movements (item_id, type, quantity, from_member, event_id, note, created_by)
  values (p_item, 'use', p_qty, auth.uid(), p_event, p_note, auth.uid());
end; $$;

-- Accept a handover sent to me
create or replace function public.accept_transfer(p_transfer uuid)
returns void language plpgsql security definer set search_path = public as $$
declare t transfers; have numeric;
begin
  if not is_member() then raise exception 'not allowed'; end if;
  select * into t from transfers where id = p_transfer for update;
  if t.id is null or t.status <> 'pending' then raise exception 'transfer not pending'; end if;
  if t.to_member <> auth.uid() and not is_admin() then raise exception 'only the receiver can accept'; end if;
  select quantity into have from holdings where item_id = t.item_id and member_id = t.from_member for update;
  if have is null or have < t.quantity then raise exception 'sender no longer holds enough'; end if;
  update holdings set quantity = quantity - t.quantity where item_id = t.item_id and member_id = t.from_member;
  insert into holdings (item_id, member_id, quantity) values (t.item_id, t.to_member, t.quantity)
  on conflict (item_id, member_id) do update set quantity = holdings.quantity + excluded.quantity, last_confirmed_at = now();
  update transfers set status = 'accepted', resolved_at = now() where id = p_transfer;
  insert into movements (item_id, type, quantity, from_member, to_member, note, created_by)
  values (t.item_id, 'transfer', t.quantity, t.from_member, t.to_member, t.note, auth.uid());
end; $$;

-- "Still have this": reset staleness timer on my holding
create or replace function public.confirm_holding(p_item uuid)
returns void language sql security definer set search_path = public as $$
  update holdings set last_confirmed_at = now() where item_id = p_item and member_id = auth.uid() and is_member();
$$;

-- Admin correction (counts, losses); logged as signed delta
create or replace function public.adjust_stock(p_item uuid, p_member uuid, p_new_qty numeric, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare old numeric;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  select coalesce(quantity,0) into old from holdings where item_id = p_item and member_id = p_member;
  old := coalesce(old, 0);
  if p_new_qty = old then return; end if;
  insert into holdings (item_id, member_id, quantity) values (p_item, p_member, p_new_qty)
  on conflict (item_id, member_id) do update set quantity = excluded.quantity, last_confirmed_at = now();
  insert into movements (item_id, type, quantity, to_member, note, created_by)
  values (p_item, 'adjust', p_new_qty - old, p_member, p_note, auth.uid());
end; $$;

-- ============ 5. ROW LEVEL SECURITY ============
alter table public.allowed_members enable row level security;
alter table public.members        enable row level security;
alter table public.categories     enable row level security;
alter table public.events         enable row level security;
alter table public.items          enable row level security;
alter table public.item_photos    enable row level security;
alter table public.holdings       enable row level security;
alter table public.movements      enable row level security;
alter table public.transfers      enable row level security;

-- allowlist: admins only
create policy allowlist_admin on public.allowed_members for all using (is_admin()) with check (is_admin());

-- members: all members read; each edits own profile
create policy members_read on public.members for select using (is_member());
create policy members_update_own on public.members for update using (id = auth.uid() and is_member()) with check (id = auth.uid());

-- reference data
create policy categories_read on public.categories for select using (is_member());
create policy categories_admin on public.categories for all using (is_admin()) with check (is_admin());
create policy events_read on public.events for select using (is_member());
create policy events_write on public.events for all using (is_admin()) with check (is_admin());

-- items and photos: all members read, add and edit (changes to quantities are logged separately)
create policy items_read on public.items for select using (is_member());
create policy items_insert on public.items for insert with check (is_member());
create policy items_update on public.items for update using (is_member()) with check (is_member());
create policy items_delete on public.items for delete using (is_admin());
create policy photos_read on public.item_photos for select using (is_member());
create policy photos_insert on public.item_photos for insert with check (is_member());
create policy photos_delete on public.item_photos for delete using (is_member());

-- holdings and movements: read-only for members (writes go through functions); admins may edit holdings
create policy holdings_read on public.holdings for select using (is_member());
create policy holdings_admin on public.holdings for all using (is_admin()) with check (is_admin());
create policy movements_read on public.movements for select using (is_member());

-- transfers: members see those involving them (admins see all); sender creates; sender cancels / receiver declines
create policy transfers_read on public.transfers for select
  using (is_member() and (from_member = auth.uid() or to_member = auth.uid() or is_admin()));
create policy transfers_insert on public.transfers for insert
  with check (is_member() and from_member = auth.uid() and status = 'pending');
create policy transfers_update on public.transfers for update
  using (is_member() and status = 'pending' and (from_member = auth.uid() or to_member = auth.uid()))
  with check (status in ('declined','cancelled'));

-- ============ 6. PHOTO STORAGE (private bucket) ============
insert into storage.buckets (id, name, public) values ('item-photos', 'item-photos', false)
on conflict (id) do nothing;

create policy photos_bucket_read   on storage.objects for select using (bucket_id = 'item-photos' and public.is_member());
create policy photos_bucket_insert on storage.objects for insert with check (bucket_id = 'item-photos' and public.is_member());
create policy photos_bucket_delete on storage.objects for delete using (bucket_id = 'item-photos' and public.is_member());

-- ============ 7. FIRST ADMIN (edit the email, run separately, THEN sign in once via the app) ============
insert into public.allowed_members (email, role) values ('tellkorok@gmail.com', 'admin');
