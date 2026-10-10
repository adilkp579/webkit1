-- =====================================================================
-- WebKit store: database schema (no demo data)
-- Run this whole file once in Supabase > SQL Editor > New query > Run.
-- It is safe to run again.
-- =====================================================================

-- 1) Admin list (only people in this table get admin powers)
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;
drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- 2) Tables
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text unique not null,
  image text,
  home_order int not null default 0,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  audience text not null default 'Adults',
  price numeric not null check (price > 0),
  old_price numeric not null default 0,
  rating numeric not null default 4.5,
  reviews int not null default 0,
  image text not null,
  description text not null default '',
  featured boolean not null default false,
  best_seller boolean not null default false,
  in_stock boolean not null default true,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text, mobile text, mobile2 text, email text, address jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  stage int,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  tracking_id text,
  payment text not null default 'Cash on Delivery',
  subtotal numeric, shipping numeric, total numeric,
  address jsonb not null,
  items jsonb not null
);

-- 3) Order safety: prices, totals and status are set by the database, not the browser
create or replace function public.orders_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare it jsonb; pr public.products; q int; sub numeric := 0; norm jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 then raise exception 'Invalid item'; end if;
  for it in select value from jsonb_array_elements(new.items) loop
    q := coalesce((it->>'q')::int, 0);
    select * into pr from public.products where id = (it->>'id')::bigint and visible and in_stock;
    if not found or q < 1 or q > 20 then raise exception 'Invalid item'; end if;
    sub := sub + pr.price * q;
    norm := norm || jsonb_build_array(jsonb_build_object('id', pr.id, 'n', pr.name, 'i', pr.image, 'q', q, 'p', pr.price));
  end loop;
  new.id := 'WK' || lpad((floor(random() * 1e8))::bigint::text, 8, '0');
  new.user_id := auth.uid();
  new.items := norm;
  new.subtotal := sub;
  new.shipping := case when sub >= 999 then 0 else 49 end;
  new.total := sub + new.shipping;
  new.status := 'pending'; new.stage := null; new.accepted_at := null;
  new.payment := 'Cash on Delivery';
  new.tracking_id := 'WKT' || lpad((floor(random() * 1e10))::bigint::text, 10, '0');
  return new;
end $$;
drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert before insert on public.orders for each row execute function public.orders_before_insert();

-- 4) Row level security
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.profiles   enable row level security;
alter table public.orders     enable row level security;

drop policy if exists "categories public read" on public.categories;
drop policy if exists "categories admin write" on public.categories;
create policy "categories public read" on public.categories for select to anon, authenticated using (true);
create policy "categories admin write" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products public read" on public.products;
drop policy if exists "products admin write" on public.products;
create policy "products public read" on public.products for select to anon, authenticated using (visible);
create policy "products admin write" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "profiles own insert" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles own read" on public.profiles for select to authenticated using (user_id = auth.uid());
create policy "profiles own insert" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "profiles own update" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profiles admin read" on public.profiles for select to authenticated using (public.is_admin());

drop policy if exists "orders read" on public.orders;
drop policy if exists "orders insert own" on public.orders;
drop policy if exists "orders admin update" on public.orders;
create policy "orders read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "orders insert own" on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy "orders admin update" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5) Image storage (product photos uploaded from the admin page)
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do nothing;
drop policy if exists "product images public read" on storage.objects;
drop policy if exists "product images admin insert" on storage.objects;
drop policy if exists "product images admin update" on storage.objects;
drop policy if exists "product images admin delete" on storage.objects;
create policy "product images public read" on storage.objects for select using (bucket_id = 'product-images');
create policy "product images admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "product images admin update" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "product images admin delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- 6) Live updates (store and admin refresh by themselves)
do $$ begin
  begin alter publication supabase_realtime add table public.products;   exception when others then null; end;
  begin alter publication supabase_realtime add table public.categories; exception when others then null; end;
  begin alter publication supabase_realtime add table public.orders;     exception when others then null; end;
  begin alter publication supabase_realtime add table public.profiles;   exception when others then null; end;
end $$;

-- 7) Product photos (up to 3), customer messages and mobile subscribers
alter table public.products add column if not exists images jsonb not null default '[]'::jsonb;
-- display positions (edited in Admin > Positions); every list keeps its own order
alter table public.products add column if not exists in_explore boolean not null default true;  -- tick per product in Admin to show it in Explore Our Products
alter table public.products
  add column if not exists pos_explore  int not null default 0,
  add column if not exists pos_shop     int not null default 0,
  add column if not exists pos_featured int not null default 0,
  add column if not exists pos_best     int not null default 0;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='sort_order') then
    execute 'update public.products set pos_explore = sort_order, pos_shop = sort_order, pos_featured = sort_order, pos_best = sort_order where sort_order > 0';
    execute 'alter table public.products drop column sort_order';
  end if;
end $$;
update public.products set pos_explore  = id where pos_explore  = 0;
update public.products set pos_shop     = id where pos_shop     = 0;
update public.products set pos_featured = id where pos_featured = 0;
update public.products set pos_best     = id where pos_best     = 0;

-- a new product automatically goes to the end of every list
create or replace function public.products_set_positions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.pos_explore, 0)  = 0 then new.pos_explore  := coalesce((select max(pos_explore)  from public.products), 0) + 1; end if;
  if coalesce(new.pos_shop, 0)     = 0 then new.pos_shop     := coalesce((select max(pos_shop)     from public.products), 0) + 1; end if;
  if coalesce(new.pos_featured, 0) = 0 then new.pos_featured := coalesce((select max(pos_featured) from public.products), 0) + 1; end if;
  if coalesce(new.pos_best, 0)     = 0 then new.pos_best     := coalesce((select max(pos_best)     from public.products), 0) + 1; end if;
  return new;
end $$;
drop trigger if exists products_set_positions on public.products;
create trigger products_set_positions before insert on public.products for each row execute function public.products_set_positions();

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,   -- the customer this conversation belongs to
  sender text not null check (sender in ('admin','customer')),
  body text not null check (char_length(body) between 1 and 1000),
  customer_read boolean not null default false,
  admin_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_user_idx on public.messages (user_id, created_at);
alter table public.messages enable row level security;

create or replace function public.messages_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.sender = 'admin' then
    if not public.is_admin() then raise exception 'Not allowed'; end if;
    new.customer_read := false; new.admin_read := true;
  else
    new.sender := 'customer'; new.user_id := auth.uid();
    new.customer_read := true; new.admin_read := false;
  end if;
  return new;
end $$;
drop trigger if exists messages_before_insert on public.messages;
create trigger messages_before_insert before insert on public.messages for each row execute function public.messages_before_insert();

drop policy if exists "messages read" on public.messages;
drop policy if exists "messages customer insert" on public.messages;
drop policy if exists "messages admin insert" on public.messages;
create policy "messages read" on public.messages for select to authenticated using (user_id = auth.uid() or public.is_admin());
-- customers can write only after they have placed an order (or once the store has messaged them)
create policy "messages customer insert" on public.messages for insert to authenticated
  with check (user_id = auth.uid() and sender = 'customer' and (
    exists (select 1 from public.orders o where o.user_id = auth.uid())
    or exists (select 1 from public.messages m where m.user_id = auth.uid() and m.sender = 'admin')));
create policy "messages admin insert" on public.messages for insert to authenticated
  with check (public.is_admin() and sender = 'admin');

create or replace function public.mark_messages_read() returns void
language sql security definer set search_path = public as
$$ update public.messages set customer_read = true where user_id = auth.uid() and sender = 'admin' and not customer_read $$;
create or replace function public.mark_messages_read_admin(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.messages set admin_read = true where user_id = p_user and sender = 'customer' and not admin_read;
end $$;
revoke execute on function public.mark_messages_read() from public, anon;
revoke execute on function public.mark_messages_read_admin(uuid) from public, anon;
grant execute on function public.mark_messages_read() to authenticated;
grant execute on function public.mark_messages_read_admin(uuid) to authenticated;

create table if not exists public.subscribers (
  id bigint generated always as identity primary key,
  mobile text unique not null check (mobile ~ '^[6-9][0-9]{9}$'),
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
drop policy if exists "subscribers public insert" on public.subscribers;
drop policy if exists "subscribers admin read" on public.subscribers;
drop policy if exists "subscribers admin delete" on public.subscribers;
create policy "subscribers public insert" on public.subscribers for insert to anon, authenticated with check (true);
create policy "subscribers admin read" on public.subscribers for select to authenticated using (public.is_admin());
create policy "subscribers admin delete" on public.subscribers for delete to authenticated using (public.is_admin());

do $$ begin
  begin alter publication supabase_realtime add table public.messages;    exception when others then null; end;
  begin alter publication supabase_realtime add table public.subscribers; exception when others then null; end;
end $$;

-- 7b) Explore Our Products tabs (editable in Admin > Explore Tabs)
create table if not exists public.explore_tabs (
  id bigint generated always as identity primary key,
  name text unique not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.explore_tabs enable row level security;
drop policy if exists "tabs public read" on public.explore_tabs;
drop policy if exists "tabs admin write" on public.explore_tabs;
create policy "tabs public read" on public.explore_tabs for select to anon, authenticated using (true);
create policy "tabs admin write" on public.explore_tabs for all to authenticated using (public.is_admin()) with check (public.is_admin());
do $$ begin
  begin alter publication supabase_realtime add table public.explore_tabs; exception when others then null; end;
end $$;
-- starting tabs (rename, delete or add more in the admin)
insert into public.explore_tabs (name, sort)
select * from (values ('Boys', 1), ('Girls', 2), ('Adults', 3)) as v(name, sort)
where not exists (select 1 from public.explore_tabs);

-- 8) Make your admin user an admin.
-- FIRST create the user: Supabase > Authentication > Users > Add user
--   email: admin@webkit.store   (any email works; keep it the same as ADMIN_EMAIL in admin.html)
--   password: the password you want to log in with   (tick "Auto Confirm User")
-- THEN run this statement (you can run it again after creating the user):
insert into public.admins (user_id)
select id from auth.users where email = 'admin@webkit.store'
on conflict do nothing;
