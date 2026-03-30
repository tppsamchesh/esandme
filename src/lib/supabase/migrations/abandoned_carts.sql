create table abandoned_carts (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  cart_items jsonb,
  cart_total integer,
  stripe_session_id text,
  recovery_email_sent boolean default false,
  recovery_email_sent_at timestamptz,
  recovered boolean default false,
  recovered_at timestamptz,
  created_at timestamptz default now()
);
