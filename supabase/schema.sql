create table reports (
  id uuid primary key default gen_random_uuid(),
  report_code text unique not null,
  created_at timestamptz default now(),
  disaster_type text, adults int default 0, children int default 0, elderly int default 0, injured int default 0,
  special_needs text[] default '{}', needs text[] default '{}',
  name text, phone text, alt_phone text, lat double precision, lng double precision, message text,
  priority int default 0, status text default 'received'
);
alter table reports enable row level security;
create policy "anyone can report" on reports for insert to anon, authenticated with check (true);
create policy "team reads" on reports for select to authenticated using (true);
create policy "team updates" on reports for update to authenticated using (true);
create or replace function get_status(code text) returns text language sql security definer as $$
  select status from reports where report_code = code $$;
grant execute on function get_status(text) to anon, authenticated;
alter publication supabase_realtime add table reports;
