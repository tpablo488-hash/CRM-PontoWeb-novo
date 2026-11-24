-- PontoWeb CRM - Supabase schema
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin','seller')),
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  deleted_at timestamptz,
  deleted_by text,
  recovery_token text,
  recovery_expires_at timestamptz
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  segment text,
  whatsapp text,
  notes text,
  assigned_seller_id uuid references users(id),
  assigned_seller_name text,
  first_contact_status text default 'pending',
  first_contact_at timestamptz,
  first_contact_by text,
  active_meeting_id uuid,
  meeting_status text,
  meeting_date date,
  meeting_time text,
  has_sale boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  history jsonb default '[]'::jsonb
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  type text,
  client_id uuid references clients(id),
  client_name text,
  assigned_seller_id uuid references users(id),
  status text default 'pending',
  due_date date,
  created_at timestamptz default now(),
  completed_at timestamptz,
  completed_by text
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  type text,
  client_id uuid references clients(id),
  client_name text,
  client_segment text,
  assigned_seller_id uuid references users(id),
  assigned_seller_name text,
  scheduled_date date,
  scheduled_time text,
  timezone text default 'America/Sao_Paulo',
  status text default 'scheduled',
  reschedule_count int default 0,
  previous_schedules jsonb default '[]'::jsonb,
  report_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists meeting_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  client_name text,
  client_segment text,
  meeting_id uuid references meetings(id),
  seller_id uuid references users(id),
  seller_name text,
  submitted_by_id uuid references users(id),
  submitted_by_name text,
  is_read_by_admin boolean default false,
  read_by_admin_at timestamptz,
  read_by_admin_name text,
  created_at timestamptz default now(),
  section_a jsonb,
  sale_info jsonb,
  section_b jsonb,
  section_c jsonb,
  section_f jsonb
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  status text,
  payment_structure text,
  sale_value numeric,
  sent_value numeric,
  payment_method text,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  title text,
  message text,
  type text,
  related_id uuid,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  actor_email text,
  action text,
  details text,
  extra jsonb
);

create table if not exists no_show_occurrences (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  data jsonb
);

create table if not exists reschedule_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  data jsonb
);
