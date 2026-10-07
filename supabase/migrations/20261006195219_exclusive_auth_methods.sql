-- Estado de seguridad fuera de los esquemas expuestos por la API.
create schema afcr_private;
revoke all on schema afcr_private from public, anon, authenticated;
grant usage on schema afcr_private to supabase_auth_admin, service_role;

create table afcr_private.auth_methods (
  user_id uuid primary key references auth.users(id) on delete cascade,
  method text not null check (method in ('password', 'google')),
  revision bigint not null default 1,
  challenge_id uuid,
  challenge_hash text,
  target text check (target in ('password', 'google')),
  requester_session uuid,
  challenge_email text,
  expires_at timestamptz,
  verified_at timestamptz,
  attempts integer not null default 0,
  sent_at timestamptz,
  window_started_at timestamptz,
  sent_count integer not null default 0
);
create table afcr_private.auth_method_sessions (
  session_id uuid primary key references auth.sessions(id) on delete cascade,
  user_id uuid not null references afcr_private.auth_methods(user_id) on delete cascade,
  method text not null check (method in ('password', 'google')),
  revision bigint not null
);
create index auth_method_sessions_user_idx on afcr_private.auth_method_sessions(user_id);
alter table afcr_private.auth_methods enable row level security;
alter table afcr_private.auth_method_sessions enable row level security;
grant select, insert, update on afcr_private.auth_methods, afcr_private.auth_method_sessions to supabase_auth_admin;
grant select, update on afcr_private.auth_methods to service_role;
grant select on afcr_private.auth_method_sessions to service_role;
grant select(id, user_id) on auth.sessions to service_role;
create policy auth_methods_hook on afcr_private.auth_methods to supabase_auth_admin using (true) with check (true);
create policy auth_sessions_hook on afcr_private.auth_method_sessions to supabase_auth_admin using (true) with check (true);

insert into afcr_private.auth_methods(user_id, method)
select id, case when raw_app_meta_data->>'provider' = 'google' then 'google' else 'password' end from auth.users;

-- Solo Auth invoca este hook; no usa metadatos editables por el usuario.
create function afcr_private.enforce_auth_method(event jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  uid uuid := (event->>'user_id')::uuid;
  sid uuid := (event->'claims'->>'session_id')::uuid;
  flow text := event->>'authentication_method';
  wanted text;
  state afcr_private.auth_methods%rowtype;
  existing afcr_private.auth_method_sessions%rowtype;
  claims jsonb := event->'claims';
begin
  insert into afcr_private.auth_methods(user_id, method)
  select id, case when raw_app_meta_data->>'provider'='google' then 'google' else 'password' end
  from auth.users where id=uid on conflict (user_id) do nothing;
  select * into state from afcr_private.auth_methods where user_id=uid for update;
  if not found or sid is null then
    return jsonb_build_object('error', jsonb_build_object('http_code',403,'message','AFCR_SESSION_EXPIRED'));
  end if;
  if flow='token_refresh' then
    select * into existing from afcr_private.auth_method_sessions where session_id=sid and user_id=uid;
    if not found or existing.revision<>state.revision or existing.method<>state.method then
      return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','AFCR_SESSION_EXPIRED'));
    end if;
    wanted := existing.method;
  elsif flow='oauth' then wanted := 'google';
  elsif flow in ('password','email/signup','recovery') then wanted := 'password';
  elsif flow='totp' then
    select method into wanted from afcr_private.auth_method_sessions where session_id=sid and user_id=uid and revision=state.revision;
  end if;
  if wanted is null then
    return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','AFCR_USE_ACTIVE_METHOD'));
  end if;
  if wanted<>state.method then
    if wanted='google' and flow='oauth' and state.target='google' and state.verified_at is not null
      and state.expires_at>now() and state.challenge_email=lower(event->'claims'->>'email')
      and exists(select 1 from afcr_private.auth_method_sessions s join auth.sessions a on a.id=s.session_id
        where s.session_id=state.requester_session and s.user_id=uid and s.revision=state.revision)
      and exists(select 1 from auth.identities i where i.user_id=uid and i.provider='google'
        and lower(i.identity_data->>'email')=state.challenge_email
        and (i.identity_data->>'email_verified')::boolean is true) then
      update afcr_private.auth_methods set method='google', revision=revision+1,
        challenge_id=null, challenge_hash=null, target=null, requester_session=null, challenge_email=null,
        expires_at=null, verified_at=null, attempts=0 where user_id=uid returning * into state;
    else
      return jsonb_build_object('error',jsonb_build_object('http_code',403,'message',
        case when state.method='google' then 'AFCR_GOOGLE_ONLY' else 'AFCR_PASSWORD_ONLY' end));
    end if;
  end if;
  insert into afcr_private.auth_method_sessions(session_id,user_id,method,revision)
  values(sid,uid,state.method,state.revision)
  on conflict(session_id) do update set method=excluded.method, revision=excluded.revision;
  claims := jsonb_set(claims,'{afcr_method}',to_jsonb(state.method));
  claims := jsonb_set(claims,'{afcr_revision}',to_jsonb(state.revision));
  return jsonb_build_object('claims',claims);
end;
$$;
revoke all on function afcr_private.enforce_auth_method(jsonb) from public, anon, authenticated, service_role;
grant execute on function afcr_private.enforce_auth_method(jsonb) to supabase_auth_admin;

-- API solo para la Edge Function. El navegador nunca llama esta RPC.
create function public.afcr_auth_method_operation(payload jsonb) returns jsonb
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
    if payload->>'target' not in ('google','password') or payload->>'target'=state.method then
      return jsonb_build_object('error','AFCR_INVALID_TARGET');
    end if;
    if state.sent_at>now()-interval '60 seconds' or (state.window_started_at>now()-interval '1 hour' and state.sent_count>=6) then
      return jsonb_build_object('error','AFCR_RATE_LIMIT');
    end if;
    update afcr_private.auth_methods set challenge_id=(payload->>'id')::uuid,challenge_hash=payload->>'hash',
      target=payload->>'target',requester_session=sid,challenge_email=lower(payload->>'email'),
      expires_at=now()+interval '10 minutes',verified_at=null,attempts=0,sent_at=now(),
      sent_count=case when window_started_at>now()-interval '1 hour' then sent_count+1 else 1 end,
      window_started_at=case when window_started_at>now()-interval '1 hour' then window_started_at else now() end
      where user_id=uid;
    return jsonb_build_object('id',payload->>'id','target',payload->>'target');
  elsif operation='cancel' then
    if state.requester_session=sid and state.challenge_id=(payload->>'id')::uuid then
      update afcr_private.auth_methods set challenge_id=null,challenge_hash=null,target=null,requester_session=null,
        challenge_email=null,expires_at=null,verified_at=null where user_id=uid;
    end if;
    return jsonb_build_object('ok',true);
  end if;
  if state.requester_session<>sid or state.challenge_id is distinct from (payload->>'id')::uuid or state.expires_at is null or state.expires_at<=now() then
    return jsonb_build_object('error','AFCR_OTP_EXPIRED');
  end if;
  if operation='verify' then
    if state.attempts>=5 then return jsonb_build_object('error','AFCR_RATE_LIMIT'); end if;
    if state.challenge_hash is distinct from payload->>'hash' then
      update afcr_private.auth_methods set attempts=attempts+1 where user_id=uid;
      return jsonb_build_object('error','AFCR_OTP_EXPIRED');
    end if;
    update afcr_private.auth_methods set verified_at=now() where user_id=uid;
    return jsonb_build_object('target',state.target,'verified',true);
  elsif operation='complete_password' and state.target='password' and state.verified_at is not null then
    update afcr_private.auth_methods set method='password',revision=revision+1,
      challenge_id=null,challenge_hash=null,target=null,requester_session=null,challenge_email=null,expires_at=null,
      verified_at=null,attempts=0 where user_id=uid;
    return jsonb_build_object('ok',true,'method','password');
  end if;
  return jsonb_build_object('error','AFCR_INVALID_REQUEST');
end;
$$;
revoke all on function public.afcr_auth_method_operation(jsonb) from public, anon, authenticated;
grant execute on function public.afcr_auth_method_operation(jsonb) to service_role;
