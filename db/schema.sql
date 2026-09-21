-- =====================================================================
-- VZ IntelliQA Demo — Provisioning + Activation + Network Inventory
-- Three schemas that behave like three separate systems.
-- Paste ALL of this into the Supabase SQL editor and run once.
--
-- This file is the spec SQL verbatim PLUS two small, non-breaking additions
-- required by the app implementation (see the two "APP ADDITION" markers):
--   1. act.work_orders.rework_count  — the Activation queue shows rework count
--   2. prov.next_ckt()               — apps assign circuit_id from the sequence
-- Neither changes any scenario assertion.
-- =====================================================================

create schema if not exists prov;
create schema if not exists act;
create schema if not exists netinv;

create sequence if not exists prov.ord_seq start 1001;
create sequence if not exists prov.ckt_seq start 100234;

-- shared: logins and the cross-system audit trail
create table if not exists public.users (
  email text primary key,
  password text not null,
  full_name text not null,
  role text not null
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  order_no text not null,
  system text not null,
  action text not null,
  from_status text,
  to_status text,
  actor text not null,
  created_at timestamptz not null default now()
);

-- SYSTEM 1: Provisioning
create table if not exists prov.orders (
  id bigint generated always as identity primary key,
  order_no text unique not null default ('ORD-' || nextval('prov.ord_seq')::text),
  circuit_id text,
  customer_name text not null,
  account_no text not null,
  service_type text not null,
  bandwidth_mbps int not null,
  a_end_address text not null,
  z_end_address text not null,
  priority text not null default 'standard',
  foc_date date not null,
  status text not null default 'order_received',
  needs_field_dispatch boolean generated always as (
    service_type in ('private_line','mpls') or bandwidth_mbps >= 1000
  ) stored,
  vlan_id int,
  port_assignment text,
  cfa text,
  failure_reason text,
  hold_reason text,
  rework_count int not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  handoff_at timestamptz
);

create table if not exists prov.tasks (
  id bigint generated always as identity primary key,
  order_no text not null references prov.orders(order_no) on delete cascade,
  title text not null,
  seq int not null,
  done boolean not null default false,
  done_by text,
  done_at timestamptz
);

-- SYSTEM 2: Activation. Rows appear here only at handoff.
create table if not exists act.work_orders (
  id bigint generated always as identity primary key,
  order_no text unique not null,
  circuit_id text not null,
  customer_name text not null,
  account_no text not null,
  service_type text not null,
  bandwidth_mbps int not null,
  a_end_address text not null,
  z_end_address text not null,
  priority text not null,
  expected_test_count int generated always as (
    case when bandwidth_mbps >= 1000 then 4 else 3 end
  ) stored,
  status text not null default 'ready_for_activation',
  assigned_to text,
  failure_reason text,
  rework_count int not null default 0,          -- APP ADDITION (1): shown on the Activation queue
  received_at timestamptz not null default now(),
  activated_at timestamptz,
  closed_at timestamptz
);

create table if not exists act.tests (
  id bigint generated always as identity primary key,
  order_no text not null references act.work_orders(order_no) on delete cascade,
  test_name text not null,
  seq int not null,
  threshold text,
  result text not null default 'pending',
  measured_value text,
  run_by text,
  run_at timestamptz
);

-- SYSTEM 3: Network inventory, the downstream system of record.
-- Neither application has a UI over this table.
create table if not exists netinv.circuit_inventory (
  id bigint generated always as identity primary key,
  circuit_id text unique not null,
  order_no text not null,
  customer_name text not null,
  account_no text not null,
  service_type text not null,
  bandwidth_mbps int not null,
  a_end_address text not null,
  z_end_address text not null,
  service_profile text not null,
  billing_start_date date not null,
  inventory_status text not null,
  activated_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- APP ADDITION (2): apps call this to draw the next circuit number from the sequence.
create or replace function prov.next_ckt() returns bigint language sql as $$
  select nextval('prov.ckt_seq');
$$;

-- Propagation act -> netinv, fired by the database, not by the app
create or replace function act.publish_to_inventory() returns trigger language plpgsql as $$
begin
  if new.status = 'activated' and coalesce(old.status,'') <> 'activated' then
    insert into netinv.circuit_inventory (
      circuit_id, order_no, customer_name, account_no, service_type,
      bandwidth_mbps, a_end_address, z_end_address, service_profile,
      billing_start_date, inventory_status, activated_at)
    values (new.circuit_id, new.order_no, new.customer_name, new.account_no,
      new.service_type, new.bandwidth_mbps, new.a_end_address, new.z_end_address,
      upper(new.service_type) || '-' || new.bandwidth_mbps || 'M',
      current_date, 'in_service', now())
    on conflict (circuit_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_publish_inventory on act.work_orders;
create trigger trg_publish_inventory after update on act.work_orders
for each row execute function act.publish_to_inventory();

-- Views, one per system, flat column names for clean assertions
create or replace view prov.v_order_summary as
select o.order_no, o.circuit_id, o.customer_name, o.service_type, o.bandwidth_mbps,
       o.status, o.needs_field_dispatch, o.priority, o.foc_date, o.rework_count,
       o.vlan_id, o.port_assignment, o.cfa, o.created_at, o.handoff_at,
       count(t.id) as total_tasks,
       count(t.id) filter (where t.done) as tasks_done
from prov.orders o left join prov.tasks t on t.order_no = o.order_no
group by o.id;

create or replace view act.v_activation_summary as
select w.order_no, w.circuit_id, w.customer_name, w.service_type, w.bandwidth_mbps,
       w.status, w.expected_test_count, w.assigned_to, w.received_at,
       w.activated_at, w.closed_at,
       count(t.id) as total_tests,
       count(t.id) filter (where t.result = 'pass') as tests_passed,
       count(t.id) filter (where t.result = 'fail') as tests_failed
from act.work_orders w left join act.tests t on t.order_no = w.order_no
group by w.id;

create or replace view public.v_order_lifecycle as
select order_no, system, action, from_status, to_status, actor, created_at,
       row_number() over (partition by order_no order by id) as step
from public.audit_log;

-- One row per order showing how far the data travelled across all three systems
create or replace view public.v_cross_system_trace as
select p.order_no, p.circuit_id, p.status as prov_status,
       a.status as act_status, i.inventory_status, i.service_profile,
       i.billing_start_date,
       (a.order_no is not null) as reached_activation,
       (i.circuit_id is not null) as reached_inventory
from prov.orders p
left join act.work_orders a on a.order_no = p.order_no
left join netinv.circuit_inventory i on i.order_no = p.order_no;

create or replace function public.reset_demo() returns void language plpgsql as $$
begin
  -- WHERE clauses satisfy the "safe update" guard that blocks unqualified DELETEs.
  delete from netinv.circuit_inventory where true;
  delete from act.tests where true;
  delete from act.work_orders where true;
  delete from prov.tasks where true;
  delete from prov.orders where true;
  delete from public.audit_log where true;
  alter sequence prov.ord_seq restart with 1001;
  alter sequence prov.ckt_seq restart with 100234;

  insert into prov.orders (customer_name, account_no, service_type, bandwidth_mbps,
    a_end_address, z_end_address, priority, foc_date, status, created_by)
  values
   ('Northwind Logistics','ACC-44821','ethernet',100,
    '400 Market St, Philadelphia PA','1201 Broad St, Newark NJ',
    'standard', current_date + 21, 'order_received','prov@demo.io'),
   ('Cascade Health','ACC-51903','dia',500,
    '88 Pine Ave, Boston MA','90 Pine Ave, Boston MA',
    'expedited', current_date + 10, 'in_design','prov@demo.io'),
   ('Ferrite Manufacturing','ACC-62240','mpls',200,
    '2 Industrial Way, Akron OH','19 Depot Rd, Toledo OH',
    'critical', current_date + 5, 'order_received','prov@demo.io');

  insert into public.audit_log (order_no, system, action, from_status, to_status, actor)
  select order_no, 'provisioning', 'seeded', null, status, 'system' from prov.orders;
end $$;

-- APP ADDITION (3): grant the anon/authenticated roles access to the custom
-- schemas. Exposing a schema in the dashboard makes it visible to PostgREST but
-- only `public` gets table privileges automatically; the rest need these grants.
grant usage on schema prov, act, netinv to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema prov, act, netinv to anon, authenticated, service_role;
grant usage, select on all sequences in schema prov, act, netinv to anon, authenticated, service_role;
grant execute on all functions in schema prov, act, netinv to anon, authenticated, service_role;

insert into public.users values
 ('prov@demo.io','Demo@1234','Dana Whitaker','provisioning'),
 ('act@demo.io','Demo@1234','Marcus Reyes','activation')
on conflict (email) do update set
  password = excluded.password, full_name = excluded.full_name, role = excluded.role;

select public.reset_demo();
