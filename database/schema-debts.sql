-- Debt management tables for ManageTasks Finance
-- Run in Supabase SQL editor after core finance schema exists.

create table if not exists public.finance_debt (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  lender text,
  principal_amount numeric not null default 0,
  paid_initial numeric not null default 0,
  interest_rate numeric,
  min_payment numeric,
  due_date date,
  priority text not null default 'p1',
  status text not null default 'active',
  note text,
  color text default '#dc3f57',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.debt_payment (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  debt_id uuid not null references public.finance_debt (id) on delete cascade,
  amount numeric not null check (amount > 0),
  paid_on date not null default current_date,
  account_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists finance_debt_owner_idx on public.finance_debt (owner_id);
create index if not exists finance_debt_status_idx on public.finance_debt (owner_id, status);
create index if not exists debt_payment_debt_idx on public.debt_payment (debt_id, paid_on desc);
create index if not exists debt_payment_owner_idx on public.debt_payment (owner_id);

alter table public.finance_debt enable row level security;
alter table public.debt_payment enable row level security;

-- Adjust policies to match your existing owner_id auth pattern.
-- Example (anon/service with owner_id filter via JWT claims may differ in your project):
drop policy if exists "finance_debt_owner_all" on public.finance_debt;
create policy "finance_debt_owner_all"
  on public.finance_debt
  for all
  using (true)
  with check (true);

drop policy if exists "debt_payment_owner_all" on public.debt_payment;
create policy "debt_payment_owner_all"
  on public.debt_payment
  for all
  using (true)
  with check (true);
