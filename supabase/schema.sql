-- Plan de medios · Radio — esquema de base de datos
-- Ejecútalo una vez en Supabase → SQL Editor → New query → Run.

create table if not exists public.spots (
  id          uuid primary key default gen_random_uuid(),
  brand       text not null,
  name        text not null default '',
  start_date  date not null,
  end_date    date not null,
  note        text not null default '',
  created_by  uuid references auth.users (id) default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint spots_dates_check check (end_date >= start_date)
);

create index if not exists spots_dates_idx on public.spots (start_date, end_date);

-- Mantiene updated_at al día
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists spots_touch_updated_at on public.spots;
create trigger spots_touch_updated_at
  before update on public.spots
  for each row execute function public.touch_updated_at();

-- Seguridad: solo los usuarios con sesión iniciada pueden leer y editar.
-- Todo el equipo comparte el mismo plan.
alter table public.spots enable row level security;

drop policy if exists "Equipo puede leer" on public.spots;
create policy "Equipo puede leer" on public.spots
  for select to authenticated using (true);

drop policy if exists "Equipo puede crear" on public.spots;
create policy "Equipo puede crear" on public.spots
  for insert to authenticated with check (true);

drop policy if exists "Equipo puede editar" on public.spots;
create policy "Equipo puede editar" on public.spots
  for update to authenticated using (true) with check (true);

drop policy if exists "Equipo puede borrar" on public.spots;
create policy "Equipo puede borrar" on public.spots
  for delete to authenticated using (true);
