-- SoloFi CFO — Initial schema
-- Applies to Supabase (Postgres). Run via Supabase SQL editor or CLI migration.

create extension if not exists "pgcrypto";

-- ============================================================
-- users
-- ============================================================
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    wallet_address text not null unique,
    created_at timestamptz not null default now()
);

create index if not exists idx_users_wallet_address on users (wallet_address);

alter table users enable row level security;

create policy "users_select_own"
    on users for select
    using (auth.uid() = id);

create policy "users_update_own"
    on users for update
    using (auth.uid() = id);

-- ============================================================
-- invoices
-- ============================================================
create table if not exists invoices (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    client_name text not null,
    amount numeric(20, 6) not null check (amount > 0),
    currency text not null,
    status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'CANCELLED')),
    payment_tx_hash text,
    created_at timestamptz not null default now(),
    paid_at timestamptz
);

create index if not exists idx_invoices_user_id on invoices (user_id);
create index if not exists idx_invoices_status on invoices (status);

alter table invoices enable row level security;

create policy "invoices_select_own"
    on invoices for select
    using (auth.uid() = user_id);

create policy "invoices_insert_own"
    on invoices for insert
    with check (auth.uid() = user_id);

create policy "invoices_update_own"
    on invoices for update
    using (auth.uid() = user_id);

-- ============================================================
-- pockets
-- ============================================================
create table if not exists pockets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    name text not null,
    wallet_address text not null,
    percentage numeric(5, 2) not null check (percentage > 0 and percentage <= 100),
    created_at timestamptz not null default now()
);

create index if not exists idx_pockets_user_id on pockets (user_id);

alter table pockets enable row level security;

create policy "pockets_select_own"
    on pockets for select
    using (auth.uid() = user_id);

create policy "pockets_insert_own"
    on pockets for insert
    with check (auth.uid() = user_id);

create policy "pockets_update_own"
    on pockets for update
    using (auth.uid() = user_id);

create policy "pockets_delete_own"
    on pockets for delete
    using (auth.uid() = user_id);

-- ============================================================
-- pocket_rules
-- ============================================================
create table if not exists pocket_rules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_pocket_rules_user_id on pocket_rules (user_id);

alter table pocket_rules enable row level security;

create policy "pocket_rules_select_own"
    on pocket_rules for select
    using (auth.uid() = user_id);

create policy "pocket_rules_insert_own"
    on pocket_rules for insert
    with check (auth.uid() = user_id);

create policy "pocket_rules_update_own"
    on pocket_rules for update
    using (auth.uid() = user_id);

-- ============================================================
-- transaction_logs
-- ============================================================
create table if not exists transaction_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    invoice_id uuid references invoices (id) on delete set null,
    tx_hash text not null,
    from_address text not null,
    to_address text not null,
    amount numeric(20, 6) not null check (amount > 0),
    currency text not null,
    action text not null check (action in ('RECEIVE', 'SPLIT')),
    created_at timestamptz not null default now()
);

create index if not exists idx_transaction_logs_user_id on transaction_logs (user_id);
create index if not exists idx_transaction_logs_invoice_id on transaction_logs (invoice_id);
create index if not exists idx_transaction_logs_tx_hash on transaction_logs (tx_hash);

alter table transaction_logs enable row level security;

create policy "transaction_logs_select_own"
    on transaction_logs for select
    using (auth.uid() = user_id);

create policy "transaction_logs_insert_own"
    on transaction_logs for insert
    with check (auth.uid() = user_id);
