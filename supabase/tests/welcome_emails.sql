-- Fixtures descartables; no invoca SMTP ni pg_net. La transacción siempre se revierte.
begin;
update afcr_private.welcome_emails set next_attempt_at=now()+interval '1 day' where status='pending';
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data) values
('71000000-0000-4000-8000-000000000001','authenticated','authenticated','welcome-google@example.invalid',now(),'{"provider":"google"}'),
('71000000-0000-4000-8000-000000000002','authenticated','authenticated','welcome-password@example.invalid',null,'{"provider":"email"}');
do $$ begin
 assert (select status='pending' from afcr_private.welcome_emails where user_id='71000000-0000-4000-8000-000000000001'), 'Google verificado encola';
 assert not exists(select 1 from afcr_private.welcome_emails where user_id='71000000-0000-4000-8000-000000000002'), 'Sin OTP no encola';
 assert not has_table_privilege('authenticated','afcr_private.welcome_emails','SELECT'), 'Cola privada';
 assert not has_function_privilege('anon','public.afcr_welcome_operation(jsonb)','EXECUTE'), 'RPC no pública';
 assert not has_function_privilege('authenticated','public.afcr_welcome_authorized(text)','EXECUTE'), 'Cuenta no invoca worker';
 assert not public.afcr_welcome_authorized(repeat('0',64)), 'Token incorrecto';
 assert public.afcr_welcome_authorized((select decrypted_secret from vault.decrypted_secrets where name='afcr_welcome_worker_token')), 'Token de Vault válido sin exponerlo';
end $$;
update auth.users set email_confirmed_at=now() where id='71000000-0000-4000-8000-000000000002';
update auth.users set email_confirmed_at=now(),raw_app_meta_data='{"provider":"google"}' where id='71000000-0000-4000-8000-000000000002';
do $$ declare job jsonb; result jsonb; begin
 assert (select count(*)=2 from afcr_private.welcome_emails where user_id::text like '71000000-%'), 'Confirmación repetida no duplica';
 job:=public.afcr_welcome_operation('{"operation":"claim"}');
 assert job->>'status'='processing' and job->>'attempts'='1', 'Reserva con primer intento';
 begin
  perform public.afcr_welcome_operation(jsonb_build_object('operation','finish','user_id',job->>'user_id','lease_id',gen_random_uuid(),'outcome','sent'));
  raise exception 'Reserva incorrecta aceptada';
 exception when others then assert sqlerrm='WELCOME_INVALID_LEASE', 'Reserva incorrecta rechazada'; end;
 result:=public.afcr_welcome_operation(job || '{"operation":"finish","outcome":"sent"}');
 assert result->>'status'='sent', 'Acuse SMTP guarda sent';
 result:=public.afcr_welcome_operation(job || '{"operation":"finish","outcome":"sent"}');
 assert result->>'status'='sent', 'Acuse repetido idempotente';
 job:=public.afcr_welcome_operation('{"operation":"claim"}');
 result:=public.afcr_welcome_operation(job || '{"operation":"finish","outcome":"retry","error_code":"smtp_temporary"}');
 assert result->>'status'='pending', 'Rechazo temporal reintenta';
 assert public.afcr_welcome_operation('{"operation":"claim"}') is null, 'Backoff impide envío inmediato';
end $$;
update afcr_private.welcome_emails set attempts=5,next_attempt_at=now() where user_id::text like '71000000-%' and status='pending';
do $$ declare job jsonb; result jsonb; begin
 job:=public.afcr_welcome_operation('{"operation":"claim"}');
 result:=public.afcr_welcome_operation(job || '{"operation":"finish","outcome":"retry","error_code":"smtp_temporary"}');
 assert result->>'status'='failed', 'Seis intentos como máximo';
 assert public.afcr_welcome_operation('{"operation":"claim"}') is null, 'No reenvía sent ni failed';
end $$;
insert into auth.users(id,aud,role,email,email_confirmed_at) values
('71000000-0000-4000-8000-000000000003','authenticated','authenticated','welcome-changed@example.invalid',now()),
('71000000-0000-4000-8000-000000000004','authenticated','authenticated','welcome-expired@example.invalid',now());
update auth.users set email='welcome-new@example.invalid' where id='71000000-0000-4000-8000-000000000003';
do $$ declare job jsonb; begin
 job:=public.afcr_welcome_operation('{"operation":"claim"}');
 assert job->>'user_id'='71000000-0000-4000-8000-000000000004', 'No enviar a correo anterior';
 assert (select status='skipped' from afcr_private.welcome_emails where user_id='71000000-0000-4000-8000-000000000003'), 'Destinatario cambiado registrado';
end $$;
update afcr_private.welcome_emails set leased_at=now()-interval '6 minutes' where user_id='71000000-0000-4000-8000-000000000004';
do $$ begin
 assert public.afcr_welcome_operation('{"operation":"claim"}') is null, 'Worker vencido no vuelve a enviar';
 assert (select status='uncertain' from afcr_private.welcome_emails where user_id='71000000-0000-4000-8000-000000000004'), 'Entrega ambigua requiere revisión';
end $$;
set local role service_role;
select public.afcr_welcome_operation('{"operation":"claim"}') is null as no_jobs;
reset role;
rollback;
