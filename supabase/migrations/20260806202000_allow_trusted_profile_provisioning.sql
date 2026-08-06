create or replace function public.protect_profile_authority()
returns trigger
language plpgsql security definer set search_path = pg_catalog as $$
declare
  trusted_database_session constant boolean := session_user in ('postgres', 'supabase_admin');
begin
  if new.role is distinct from old.role and not (trusted_database_session or private.is_super_admin()) then
    raise exception 'Only super administrators can change roles';
  end if;
  if new.department is distinct from old.department and not (trusted_database_session or private.is_super_admin()) then
    raise exception 'Only super administrators can change profile departments';
  end if;
  if (new.email is distinct from old.email or new.roll_no is distinct from old.roll_no) and not (trusted_database_session or private.is_super_admin()) then
    raise exception 'Only super administrators can change institutional identity';
  end if;
  if new.role is distinct from old.role then
    insert into public.audit_log(actor_id, action, entity, entity_id, before_data, after_data)
    values ((select auth.uid()), 'role_changed', 'profiles', old.id::text, jsonb_build_object('role', old.role), jsonb_build_object('role', new.role));
  end if;
  return new;
end
$$;

revoke all on function public.protect_profile_authority() from public, anon, authenticated;
