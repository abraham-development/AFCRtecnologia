-- Auth emite el método otp al confirmar signup y recovery por código.
create or replace function afcr_private.enforce_auth_method(event jsonb) returns jsonb
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
  elsif flow in ('password','email/signup','recovery','otp') then wanted := 'password';
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
