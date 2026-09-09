create table if not exists public.staff (
  id bigint primary key,
  username text not null unique,
  password text not null,
  role text not null check (role in ('admin', 'staff'))
);

create table if not exists public.products (
  id numeric primary key,
  name text not null,
  category text not null,
  price numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  stock integer not null default 0,
  visible_in_menu boolean not null default true,
  inventory_managed boolean not null default true
);

create table if not exists public.sales (
  id bigint primary key,
  order_id text,
  customer text,
  payment_method text not null default 'Cash',
  sale_date date not null,
  sale_time text not null,
  staff text not null,
  product text not null,
  qty integer not null check (qty > 0),
  total numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0
);

create table if not exists public.purchase_orders (
  id bigint primary key,
  product_id numeric references public.products(id) on delete set null,
  product text not null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  staff text not null,
  order_date date not null,
  status text not null check (status in ('Draft', 'Pending', 'Approved', 'Received', 'Cancelled'))
);

create table if not exists public.calendar_notes (
  note_date date primary key,
  note text not null default ''
);

alter table public.staff enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.calendar_notes enable row level security;

drop policy if exists "anon can read staff" on public.staff;
drop policy if exists "anon can write staff" on public.staff;
drop policy if exists "anon can read products" on public.products;
drop policy if exists "anon can write products" on public.products;
drop policy if exists "anon can read sales" on public.sales;
drop policy if exists "anon can write sales" on public.sales;
drop policy if exists "anon can read purchase orders" on public.purchase_orders;
drop policy if exists "anon can write purchase orders" on public.purchase_orders;
drop policy if exists "anon can read calendar notes" on public.calendar_notes;
drop policy if exists "anon can write calendar notes" on public.calendar_notes;

create policy "anon can read staff" on public.staff for select to anon using (true);
create policy "anon can write staff" on public.staff for all to anon using (true) with check (true);
create policy "anon can read products" on public.products for select to anon using (true);
create policy "anon can write products" on public.products for all to anon using (true) with check (true);
create policy "anon can read sales" on public.sales for select to anon using (true);
create policy "anon can write sales" on public.sales for all to anon using (true) with check (true);
create policy "anon can read purchase orders" on public.purchase_orders for select to anon using (true);
create policy "anon can write purchase orders" on public.purchase_orders for all to anon using (true) with check (true);
create policy "anon can read calendar notes" on public.calendar_notes for select to anon using (true);
create policy "anon can write calendar notes" on public.calendar_notes for all to anon using (true) with check (true);

insert into public.staff (id, username, password, role) values
  (1, 'admin', 'admin123', 'admin'),
  (2, 'staff1', 'staff123', 'staff'),
  (3, 'staff2', 'staff123', 'staff'),
  (4, 'staff3', 'staff123', 'staff'),
  (5, 'staff4', 'staff123', 'staff')
on conflict (id) do nothing;
