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

-- =====================================================================
-- Comentarios por mes, menciones (avisos dentro de la app) y estado del mes
-- =====================================================================

-- Perfiles: copia del email de cada usuario para poder elegir a quién mencionar
-- (auth.users no se puede leer desde la app).
create table if not exists public.profiles (
  id     uuid primary key references auth.users (id) on delete cascade,
  email  text not null
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, email)
select id, email from auth.users where email is not null
on conflict (id) do update set email = excluded.email;

alter table public.profiles enable row level security;
drop policy if exists "Equipo puede ver perfiles" on public.profiles;
create policy "Equipo puede ver perfiles" on public.profiles
  for select to authenticated using (true);

-- Estado de cada mes. Si un mes no tiene fila, está en borrador.
create table if not exists public.month_status (
  ym          text primary key check (ym ~ '^\d{4}-\d{2}$'),
  status      text not null check (status in ('draft', 'review', 'approved')),
  updated_by  uuid references public.profiles (id) default auth.uid(),
  updated_at  timestamptz not null default now()
);

alter table public.month_status enable row level security;
drop policy if exists "Equipo puede ver estados" on public.month_status;
create policy "Equipo puede ver estados" on public.month_status
  for select to authenticated using (true);
drop policy if exists "Equipo puede crear estados" on public.month_status;
create policy "Equipo puede crear estados" on public.month_status
  for insert to authenticated with check (true);
drop policy if exists "Equipo puede cambiar estados" on public.month_status;
create policy "Equipo puede cambiar estados" on public.month_status
  for update to authenticated using (true) with check (true);

-- Comentarios del mes. status_change indica si el comentario cambió el estado del mes.
create table if not exists public.comments (
  id             uuid primary key default gen_random_uuid(),
  ym             text not null check (ym ~ '^\d{4}-\d{2}$'),
  author_id      uuid not null references public.profiles (id) default auth.uid(),
  body           text not null default '',
  status_change  text check (status_change in ('draft', 'review', 'approved')),
  created_at     timestamptz not null default now(),
  constraint comments_not_empty check (length(trim(body)) > 0 or status_change is not null)
);

create index if not exists comments_ym_idx on public.comments (ym, created_at);
create index if not exists comments_author_idx on public.comments (author_id);

alter table public.comments enable row level security;
drop policy if exists "Equipo puede ver comentarios" on public.comments;
create policy "Equipo puede ver comentarios" on public.comments
  for select to authenticated using (true);
drop policy if exists "Cada uno comenta en su nombre" on public.comments;
create policy "Cada uno comenta en su nombre" on public.comments
  for insert to authenticated with check (author_id = (select auth.uid()));

-- Personas mencionadas en cada comentario. read_at = cuándo vio el aviso.
create table if not exists public.comment_mentions (
  comment_id  uuid not null references public.comments (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  read_at     timestamptz,
  primary key (comment_id, user_id)
);

create index if not exists comment_mentions_user_idx on public.comment_mentions (user_id) where read_at is null;

alter table public.comment_mentions enable row level security;
drop policy if exists "Equipo puede ver menciones" on public.comment_mentions;
create policy "Equipo puede ver menciones" on public.comment_mentions
  for select to authenticated using (true);
drop policy if exists "El autor menciona en sus comentarios" on public.comment_mentions;
create policy "El autor menciona en sus comentarios" on public.comment_mentions
  for insert to authenticated with check (
    exists (select 1 from public.comments c where c.id = comment_id and c.author_id = (select auth.uid()))
  );
drop policy if exists "Cada uno marca sus avisos como leídos" on public.comment_mentions;
create policy "Cada uno marca sus avisos como leídos" on public.comment_mentions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Publica un comentario con sus menciones y, si se indica, cambia el estado del mes.
-- Todo en una sola transacción y con los permisos del usuario (security invoker).
create or replace function public.post_comment(
  p_ym text, p_body text, p_mentions uuid[] default '{}', p_status text default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
begin
  insert into public.comments (ym, body, status_change)
  values (p_ym, trim(coalesce(p_body, '')), p_status)
  returning id into v_id;

  insert into public.comment_mentions (comment_id, user_id)
  select distinct v_id, m from unnest(coalesce(p_mentions, '{}')) as m
  where m <> (select auth.uid());

  if p_status is not null then
    insert into public.month_status (ym, status) values (p_ym, p_status)
    on conflict (ym) do update set status = excluded.status, updated_by = (select auth.uid()), updated_at = now();
  end if;

  return v_id;
end $$;

-- Tiempo real: la app recibe al momento los comentarios, avisos y cambios de estado.
do $$
declare t text;
begin
  foreach t in array array['comments', 'comment_mentions', 'month_status'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Hasta qué comentario ha visto cada persona en cada mes (para el contador de nuevos).
create table if not exists public.month_reads (
  user_id       uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  ym            text not null check (ym ~ '^\d{4}-\d{2}$'),
  last_seen_at  timestamptz not null,
  primary key (user_id, ym)
);

alter table public.month_reads enable row level security;
drop policy if exists "Cada uno ve sus lecturas" on public.month_reads;
create policy "Cada uno ve sus lecturas" on public.month_reads
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Cada uno guarda sus lecturas" on public.month_reads;
create policy "Cada uno guarda sus lecturas" on public.month_reads
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Cada uno actualiza sus lecturas" on public.month_reads;
create policy "Cada uno actualiza sus lecturas" on public.month_reads
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
