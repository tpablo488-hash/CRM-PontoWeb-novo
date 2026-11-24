-- Enable RLS
alter table users enable row level security;
alter table clients enable row level security;
alter table tasks enable row level security;
alter table meetings enable row level security;
alter table meeting_reports enable row level security;
alter table sales enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- Permissive policies for authenticated users (app-level auth handles roles)
create policy "auth users full access users" on users for all to authenticated using (true) with check (true);
create policy "auth users full access clients" on clients for all to authenticated using (true) with check (true);
create policy "auth users full access tasks" on tasks for all to authenticated using (true) with check (true);
create policy "auth users full access meetings" on meetings for all to authenticated using (true) with check (true);
create policy "auth users full access reports" on meeting_reports for all to authenticated using (true) with check (true);
create policy "auth users full access sales" on sales for all to authenticated using (true) with check (true);
create policy "auth users full access notifications" on notifications for all to authenticated using (true) with check (true);
create policy "auth users full access audit" on audit_logs for all to authenticated using (true) with check (true);

-- Seed initial users (passwords hashed client-side originally; store plain-ish hashed via same algo not possible server-side; we'll insert with known hashes)
