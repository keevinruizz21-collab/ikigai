-- =====================================================================
--  Ikigai · esquema de Supabase
--  Pégalo completo en Supabase → SQL Editor → New query → Run.
--  Se puede ejecutar más de una vez sin romper nada.
-- =====================================================================

-- 1. Tabla única: cada fila es un "documento" de la app (config, mes de gastos, día de entreno…)
create table if not exists public.docs (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  path       text        not null check (char_length(path) between 3 and 200),
  data       jsonb       not null default '{}'::jsonb,
  kt         jsonb       not null default '{}'::jsonb,   -- marca de tiempo por campo, para fusionar sin pisar cambios
  deleted    boolean     not null default false,
  rev        bigint      not null default 1,             -- versión: evita sobrescribir cambios de otro dispositivo
  updated_at timestamptz not null default now(),         -- la pone el servidor, no el reloj del celular
  primary key (user_id, path)
);
create index if not exists docs_user_updated_idx on public.docs (user_id, updated_at);

-- 2. El servidor controla updated_at y rev
create or replace function public.docs_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.rev := old.rev + 1;
    new.user_id := old.user_id;   -- nadie puede "mover" una fila a otro usuario
  else
    new.rev := 1;
  end if;
  return new;
end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before insert or update on public.docs
  for each row execute function public.docs_touch();

-- 3. Seguridad por filas: sin sesión no se ve nada
alter table public.docs enable row level security;
alter table public.docs force row level security;

revoke all on table public.docs from anon, public;
grant select, insert, update, delete on table public.docs to authenticated;

-- 3a. Cada usuario solo ve y modifica lo suyo
drop policy if exists "docs: solo el dueño" on public.docs;
create policy "docs: solo el dueño" on public.docs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 3b. …y solo si la sesión pasó el doble factor (código de Google Authenticator)
drop policy if exists "docs: exigir doble factor" on public.docs;
create policy "docs: exigir doble factor" on public.docs
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- 4. Tiempo real: el otro dispositivo se entera al instante de los cambios
do $$
begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null;
end $$;

-- 5. Latido: mantiene activo el proyecto gratis sin exponer ningún dato
create or replace function public.ikigai_ping() returns timestamptz
language sql security definer set search_path = '' as $$ select now(); $$;
revoke all on function public.ikigai_ping() from public;
grant execute on function public.ikigai_ping() to anon, authenticated;
