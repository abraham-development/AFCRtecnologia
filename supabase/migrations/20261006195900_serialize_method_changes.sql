alter table afcr_private.auth_methods add column completion_id uuid;

create or replace function public.afcr_auth_method_operation(payload jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
  uid uuid := (payload->>'user_id')::uuid;
  sid uuid := (payload->>'session_id')::uuid;
  operation text := payload->>'operation';
  state afcr_private.auth_methods%rowtype;
begin
  if current_user<>'service_role' then raise insufficient_privilege; end if;
  select * into state from afcr_private.auth_methods where user_id=uid for update;
  if not found or state.revision is distinct from (payload->>'revision')::bigint or not exists(select 1 from afcr_private.auth_method_sessions s join auth.sessions a on a.id=s.session_id
    where s.session_id=sid and s.user_id=uid and a.user_id=uid and s.method=state.method and s.revision=state.revision) then
    return jsonb_build_object('error','AFCR_SESSION_EXPIRED');
  end if;
  if operation='status' then
    return jsonb_build_object('method',state.method,'pending',case when state.expires_at>now() and state.requester_session=sid then
      jsonb_build_object('id',state.challenge_id,'target',state.target,'verified',state.verified_at is not null,'expiresAt',state.expires_at) else null end);
  elsif operation='request' then
    if state.completion_id is not null and state.expires_at>now() then return jsonb_build_object('error','AFCR_CHANGE_PENDING'); end if;
    if payload->>'target' not in ('google','password') or payload->>'target'=state.method then
      return jsonb_build_object('error','AFCR_INVALID_TARGET');
    end if;
    if state.sent_at>now()-interval '60 seconds' or (state.window_started_at>now()-interval '1 hour' and state.sent_count>=6) then
      return jsonb_build_object('error','AFCR_RATE_LIMIT');
    end if;
    update afcr_private.auth_methods set challenge_id=(payload->>'id')::uuid,challenge_hash=payload->>'hash',
      target=payload->>'target',requester_session=sid,challenge_email=lower(payload->>'email'),
      expires_at=now()+interval '10 minutes',verified_at=null,completion_id=null,attempts=0,sent_at=now(),
      sent_count=case when window_started_at>now()-interval '1 hour' then sent_count+1 else 1 end,
      window_started_at=case when window_started_at>now()-interval '1 hour' then window_started_at else now() end
      where user_id=uid;
    return jsonb_build_object('id',payload->>'id','target',payload->>'target');
  elsif operation='cancel' then
    if state.completion_id is not null and state.expires_at>now() then return jsonb_build_object('error','AFCR_CHANGE_PENDING'); end if;
    if state.requester_session=sid and state.challenge_id=(payload->>'id')::uuid then
      update afcr_private.auth_methods set challenge_id=null,challenge_hash=null,target=null,requester_session=null,
        challenge_email=null,expires_at=null,verified_at=null where user_id=uid;
    end if;
    return jsonb_build_object('ok',true);
  end if;
  if state.requester_session<>sid or state.challenge_id is distinct from (payload->>'id')::uuid or state.expires_at is null or state.expires_at<=now() then
    return jsonb_build_object('error','AFCR_OTP_EXPIRED');
  end if;
  if operation='release_password' and state.completion_id=(payload->>'completion_id')::uuid then
    update afcr_private.auth_methods set completion_id=null,verified_at=null where user_id=uid;
    return jsonb_build_object('ok',true);
  end if;
  if operation='verify' then
    if state.completion_id is not null then return jsonb_build_object('error','AFCR_CHANGE_PENDING'); end if;
    if state.target='password' and payload->>'completion_id' is null then return jsonb_build_object('error','AFCR_INVALID_REQUEST'); end if;
    if state.attempts>=5 then return jsonb_build_object('error','AFCR_RATE_LIMIT'); end if;
    if state.challenge_hash is distinct from payload->>'hash' then
      update afcr_private.auth_methods set attempts=attempts+1 where user_id=uid;
      return jsonb_build_object('error','AFCR_OTP_EXPIRED');
    end if;
    update afcr_private.auth_methods set verified_at=now(),completion_id=case when state.target='password' then (payload->>'completion_id')::uuid else null end where user_id=uid;
    return jsonb_build_object('target',state.target,'verified',true);
  elsif operation='complete_password' and state.target='password' and state.verified_at is not null and state.completion_id is not null and state.completion_id=(payload->>'completion_id')::uuid then
    update afcr_private.auth_methods set method='password',revision=revision+1,
      challenge_id=null,challenge_hash=null,target=null,requester_session=null,challenge_email=null,expires_at=null,
      verified_at=null,completion_id=null,attempts=0 where user_id=uid;
    return jsonb_build_object('ok',true,'method','password');
  end if;
  return jsonb_build_object('error','AFCR_INVALID_REQUEST');
end;
$$;

-- El método original se registra al crear la cuenta, antes de cualquier intento fallido.
create function afcr_private.register_auth_method() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  insert into afcr_private.auth_methods(user_id,method)
  values(new.id,case when new.raw_app_meta_data->>'provider'='google' then 'google' else 'password' end);
  return new;
end;
$$;
revoke all on function afcr_private.register_auth_method() from public,anon,authenticated;
grant execute on function afcr_private.register_auth_method() to supabase_auth_admin;
create trigger afcr_register_auth_method after insert on auth.users
for each row execute function afcr_private.register_auth_method();
