-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase exclusivo de Tuimagenstudios.
create table if not exists public.ebook_orders (
  id uuid primary key,
  product_id text not null,
  product_title text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'ARS',
  status text not null check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  mp_payment_id text unique,
  payer_email text,
  approved_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ebook_orders enable row level security;
-- La clave secreta usada exclusivamente dentro de Vercel omite RLS. No crear políticas públicas.
