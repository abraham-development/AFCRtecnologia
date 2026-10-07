-- Bienvenida independiente de Auth: ninguna conexión SMTP dentro del registro.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create table afcr_private.welcome_emails (
 user_id uuid primary key references auth.users(id) on delete cascade,
 recipient_email text not null,
 status text not null default 'pending' check(status in ('pending','processing','sent','skipped','failed','uncertain')),
 attempts integer not null default 0 check(attempts between 0 and 6),
 created_at timestamptz not null default now(),
 next_attempt_at timestamptz not null default now(),
 lease_id uuid, leased_at timestamptz, sent_at timestamptz,
  error_code text check(error_code in ('existing_account','recipient_changed','test_address','worker_expired','auth_temporary','smtp_temporary','smtp_rejected','smtp_connect','smtp_ambiguous')),
 check(status <> 'processing' or (lease_id is not null and leased_at is not null)),
 check((status='sent') = (sent_at is not null))
);
alter table afcr_private.welcome_emails enable row level security;
revoke all on afcr_private.welcome_emails from public,anon,authenticated;
grant select on afcr_private.welcome_emails to service_role;
create index welcome_emails_due on afcr_private.welcome_emails(next_attempt_at,created_at) where status='pending';
create index welcome_emails_leased on afcr_private.welcome_emails(leased_at) where status='processing';

-- No hacer envíos retroactivos sin autorización; la fila impide repetir el alta.
insert into afcr_private.welcome_emails(user_id,recipient_email,status,error_code)
select id,email,'skipped','existing_account' from auth.users
where email_confirmed_at is not null and email is not null and coalesce(is_anonymous,false)=false;

create function afcr_private.queue_welcome_email() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.email_confirmed_at is null or new.email is null or coalesce(new.is_anonymous,false) then return new; end if;
 if tg_op='INSERT' or old.email_confirmed_at is null then
  insert into afcr_private.welcome_emails(user_id,recipient_email) values(new.id,new.email) on conflict(user_id) do nothing;
 end if;
 return new;
end $$;
revoke all on function afcr_private.queue_welcome_email() from public,anon,authenticated,service_role;
create trigger afcr_queue_welcome_email after insert or update of email_confirmed_at on auth.users for each row execute function afcr_private.queue_welcome_email();

-- El token aleatorio permanece en Vault; no va a .env público ni al código.
do $$ begin
 if not exists(select 1 from vault.secrets where name='afcr_welcome_worker_token') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'afcr_welcome_worker_token','Autenticación exclusiva del worker de bienvenida');
 end if;
end $$;
create function afcr_private.welcome_authorized(token text) returns boolean language sql security definer set search_path='' as $$
 select coalesce(length(token)=64 and extensions.digest(token,'sha256')=(select extensions.digest(decrypted_secret,'sha256') from vault.decrypted_secrets where name='afcr_welcome_worker_token'),false);
$$;
revoke all on function afcr_private.welcome_authorized(text) from public,anon,authenticated;
grant execute on function afcr_private.welcome_authorized(text) to service_role;
create function public.afcr_welcome_authorized(token text) returns boolean language sql security invoker set search_path='' as $$ select afcr_private.welcome_authorized(token); $$;
revoke all on function public.afcr_welcome_authorized(text) from public,anon,authenticated;
grant execute on function public.afcr_welcome_authorized(text) to service_role;

create function afcr_private.welcome_operation(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare job afcr_private.welcome_emails; outcome text; code text; delay interval;
begin
 if payload->>'operation'='claim' then
  -- Un worker perdido pudo transmitir el mensaje: nunca reenviar a ciegas.
  update afcr_private.welcome_emails set status='uncertain',error_code='worker_expired' where status='processing' and leased_at<now()-interval '5 minutes';
  update afcr_private.welcome_emails q set status='skipped',error_code='recipient_changed'
  where q.status='pending' and not exists(select 1 from auth.users u where u.id=q.user_id and u.email=q.recipient_email and u.email_confirmed_at is not null and coalesce(u.is_anonymous,false)=false);
  select q.* into job from afcr_private.welcome_emails q where q.status='pending' and q.next_attempt_at<=now() order by q.next_attempt_at,q.created_at,q.user_id limit 1 for update skip locked;
  if not found then return null; end if;
  update afcr_private.welcome_emails set status='processing',attempts=attempts+1,lease_id=gen_random_uuid(),leased_at=now(),error_code=null where user_id=job.user_id returning * into job;
  return to_jsonb(job);
 elsif payload->>'operation'='finish' then
  select * into job from afcr_private.welcome_emails where user_id=(payload->>'user_id')::uuid for update;
  if not found or job.lease_id is distinct from (payload->>'lease_id')::uuid then raise exception 'WELCOME_INVALID_LEASE'; end if;
  if job.status not in ('processing','uncertain') then return jsonb_build_object('status',job.status); end if;
  if job.status='uncertain' and job.error_code is distinct from 'worker_expired' then return jsonb_build_object('status',job.status); end if;
  outcome:=payload->>'outcome'; code:=payload->>'error_code';
  if outcome not in ('sent','retry','failed','uncertain','skipped') or outcome is null then raise exception 'WELCOME_INVALID_OUTCOME'; end if;
  if outcome='retry' then
   outcome:=case when job.attempts>=6 then 'failed' else 'pending' end;
   delay:=(array[interval '1 minute',interval '5 minutes',interval '15 minutes',interval '1 hour',interval '6 hours',interval '1 day'])[job.attempts];
  end if;
  update afcr_private.welcome_emails set status=outcome,error_code=case when outcome='sent' then null else code end,
   sent_at=case when outcome='sent' then now() end,next_attempt_at=coalesce(now()+delay,next_attempt_at) where user_id=job.user_id;
  return jsonb_build_object('status',outcome);
 end if;
 raise exception 'WELCOME_INVALID_OPERATION';
end $$;
revoke all on function afcr_private.welcome_operation(jsonb) from public,anon,authenticated;
grant execute on function afcr_private.welcome_operation(jsonb) to service_role;
grant usage on schema afcr_private to service_role;
create function public.afcr_welcome_operation(payload jsonb) returns jsonb language sql security invoker set search_path='' as $$ select afcr_private.welcome_operation(payload); $$;
revoke all on function public.afcr_welcome_operation(jsonb) from public,anon,authenticated;
grant execute on function public.afcr_welcome_operation(jsonb) to service_role;

create function afcr_private.dispatch_welcome_emails() returns bigint language plpgsql security definer set search_path='' as $$
declare token text;
begin
 if not exists(select 1 from afcr_private.welcome_emails where (status='pending' and next_attempt_at<=now()) or (status='processing' and leased_at<now()-interval '5 minutes')) then return null; end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='afcr_welcome_worker_token';
 if token is null then raise exception 'WELCOME_NOT_CONFIGURED'; end if;
 return net.http_post(url:='https://zuqxtogggkundznzwulg.supabase.co/functions/v1/welcome-email',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||token),body:='{}'::jsonb,timeout_milliseconds:=120000);
end $$;
revoke all on function afcr_private.dispatch_welcome_emails() from public,anon,authenticated,service_role;
-- pg_net guarda temporalmente los headers: impedir lectura de esa cola.
revoke all on net.http_request_queue from public,anon,authenticated;
select cron.schedule('afcr-welcome-emails','* * * * *','select afcr_private.dispatch_welcome_emails();');
-- Activar solo después de desplegar y verificar el worker.
select cron.alter_job(job_id:=jobid,active:=false) from cron.job where jobname='afcr-welcome-emails';
