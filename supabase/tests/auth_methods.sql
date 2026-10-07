-- Ejecutar en una transacción y hacer ROLLBACK: no crea cuentas reales ni envía correo.
begin;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data)
values ('10000000-0000-4000-8000-000000000002','authenticated','authenticated','google-test@example.invalid',now(),'{"provider":"google","providers":["google"]}');
insert into auth.sessions(id,user_id) values ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002');
do $$ declare event jsonb; result jsonb; begin
  event := '{"user_id":"10000000-0000-4000-8000-000000000002","authentication_method":"password","claims":{"session_id":"20000000-0000-4000-8000-000000000004","email":"google-test@example.invalid"}}';
  result := afcr_private.enforce_auth_method(event);
  assert result->'error'->>'message'='AFCR_GOOGLE_ONLY', 'Método Google registrado desde creación';
  result := afcr_private.enforce_auth_method(jsonb_set(event,'{authentication_method}','"otp"'));
  assert result->'error'->>'message'='AFCR_GOOGLE_ONLY', 'Recuperación Google no activa contraseña';
end $$;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data)
values ('10000000-0000-4000-8000-000000000001','authenticated','authenticated','auth-test@example.invalid',now(),'{"provider":"email","providers":["email"]}');
insert into auth.sessions(id,user_id) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001');

do $$ declare event jsonb; result jsonb; begin
  event := '{"user_id":"10000000-0000-4000-8000-000000000001","authentication_method":"password","claims":{"session_id":"20000000-0000-4000-8000-000000000001","email":"auth-test@example.invalid"}}';
  result := afcr_private.enforce_auth_method(event);
  assert result->'claims'->>'afcr_method'='password', 'Contraseña inicial';
  result := afcr_private.enforce_auth_method(jsonb_set(event,'{authentication_method}','"oauth"'));
  assert result->'error'->>'message'='AFCR_PASSWORD_ONLY', 'Google bloqueado sin cambio';
  result := afcr_private.enforce_auth_method(jsonb_set(event,'{authentication_method}','"token_refresh"'));
  assert result->'claims'->>'afcr_method'='password', 'Refresh legítimo';
end $$;
reset role;

set local role service_role;
do $$ declare base jsonb; result jsonb; begin
  base := '{"user_id":"10000000-0000-4000-8000-000000000001","session_id":"20000000-0000-4000-8000-000000000001","revision":1,"id":"30000000-0000-4000-8000-000000000001"}';
  result := public.afcr_auth_method_operation(base || '{"operation":"request","target":"google","email":"auth-test@example.invalid","hash":"correct-hmac"}');
  assert result->>'target'='google', 'Solicitud autorizada';
  result := public.afcr_auth_method_operation(base || '{"operation":"request","target":"google"}');
  assert result->>'error'='AFCR_RATE_LIMIT', 'Reenvío limitado';
  for i in 1..5 loop
    result := public.afcr_auth_method_operation(base || '{"operation":"verify","hash":"wrong-hmac"}');
    assert result->>'error'='AFCR_OTP_EXPIRED', 'OTP incorrecto';
  end loop;
  result := public.afcr_auth_method_operation(base || '{"operation":"verify","hash":"correct-hmac"}');
  assert result->>'error'='AFCR_RATE_LIMIT', 'Máximo cinco intentos';
end $$;
reset role;
update afcr_private.auth_methods set attempts=0 where user_id='10000000-0000-4000-8000-000000000001';
set local role service_role;
do $$ declare result jsonb; begin
  result := public.afcr_auth_method_operation('{"user_id":"10000000-0000-4000-8000-000000000001","session_id":"20000000-0000-4000-8000-000000000001","revision":1,"id":"30000000-0000-4000-8000-000000000001","operation":"verify","hash":"correct-hmac"}');
  assert result->>'verified'='true', 'OTP válido';
end $$;
reset role;

insert into auth.identities(provider_id,user_id,identity_data,provider)
values('test-google','10000000-0000-4000-8000-000000000001','{"email":"other@example.invalid","email_verified":true}','google');
do $$ declare event jsonb; result jsonb; begin
  event := '{"user_id":"10000000-0000-4000-8000-000000000001","authentication_method":"oauth","claims":{"session_id":"20000000-0000-4000-8000-000000000002","email":"auth-test@example.invalid"}}';
  result := afcr_private.enforce_auth_method(event);
  assert result->'error'->>'message'='AFCR_PASSWORD_ONLY', 'Cuenta Google de otro correo bloqueada';
end $$;
reset role;
update auth.identities set identity_data='{"email":"auth-test@example.invalid","email_verified":true}' where provider_id='test-google';
do $$ declare event jsonb; result jsonb; begin
  event := '{"user_id":"10000000-0000-4000-8000-000000000001","authentication_method":"oauth","claims":{"session_id":"20000000-0000-4000-8000-000000000002","email":"auth-test@example.invalid"}}';
  result := afcr_private.enforce_auth_method(event);
  assert result->'claims'->>'afcr_method'='google', 'Cambio a Google';
  assert result->'claims'->>'afcr_revision'='2', 'Nueva revisión';
  result := afcr_private.enforce_auth_method(jsonb_set(event,'{authentication_method}','"password"'));
  assert result->'error'->>'message'='AFCR_GOOGLE_ONLY', 'Contraseña anterior bloqueada';
  result := afcr_private.enforce_auth_method(jsonb_set(event,'{authentication_method}','"recovery"'));
  assert result->'error'->>'message'='AFCR_GOOGLE_ONLY', 'Recuperación no evade Google';
  result := afcr_private.enforce_auth_method(jsonb_set(event,'{authentication_method}','"otp"'));
  assert result->'error'->>'message'='AFCR_GOOGLE_ONLY', 'OTP no evade Google';
  event := jsonb_set(event,'{claims,session_id}','"20000000-0000-4000-8000-000000000001"');
  result := afcr_private.enforce_auth_method(jsonb_set(event,'{authentication_method}','"token_refresh"'));
  assert result->'error'->>'message'='AFCR_SESSION_EXPIRED', 'Refresh anterior revocado';
end $$;
reset role;

set local role service_role;
do $$ declare base jsonb; result jsonb; begin
  base := '{"user_id":"10000000-0000-4000-8000-000000000001","session_id":"20000000-0000-4000-8000-000000000001","revision":1,"operation":"status"}';
  result := public.afcr_auth_method_operation(base);
  assert result->>'error'='AFCR_SESSION_EXPIRED', 'JWT anterior sin acceso a cambios';
end $$;
reset role;
update afcr_private.auth_methods set sent_at=now()-interval '61 seconds' where user_id='10000000-0000-4000-8000-000000000001';
set local role service_role;
do $$ declare base jsonb; result jsonb; begin
  base := '{"user_id":"10000000-0000-4000-8000-000000000001","session_id":"20000000-0000-4000-8000-000000000002","revision":2,"id":"30000000-0000-4000-8000-000000000002","completion_id":"40000000-0000-4000-8000-000000000001"}';
  result := public.afcr_auth_method_operation(base || '{"operation":"request","target":"password","email":"auth-test@example.invalid","hash":"password-hmac"}');
  assert result->>'target'='password', 'Solicitud de contraseña';
  result := public.afcr_auth_method_operation(base || '{"operation":"complete_password"}');
  assert result->>'error'='AFCR_INVALID_REQUEST', 'Sin OTP no cambia método';
  result := public.afcr_auth_method_operation(base || '{"operation":"verify","hash":"password-hmac"}');
  assert result->>'verified'='true', 'Confirmación de contraseña';
  result := public.afcr_auth_method_operation(base || '{"operation":"verify","hash":"password-hmac"}');
  assert result->>'error'='AFCR_CHANGE_PENDING', 'Dos cambios no corren juntos';
  result := public.afcr_auth_method_operation(base || '{"operation":"cancel"}');
  assert result->>'error'='AFCR_CHANGE_PENDING', 'No cancela una escritura de contraseña';
  -- Simula la revocación real que hace la API administrativa al guardar la contraseña.
  perform set_config('role','postgres',true);
  delete from auth.sessions where id='20000000-0000-4000-8000-000000000002';
  perform set_config('role','service_role',true);
  result := public.afcr_auth_method_operation(base || '{"operation":"complete_password"}');
  assert result->>'method'='password', 'Cambio tras revocar sesiones';
  result := public.afcr_auth_method_operation(base || '{"operation":"complete_password"}');
  assert result->>'error'='AFCR_SESSION_EXPIRED', 'OTP no se reutiliza';
end $$;
reset role;
do $$ declare event jsonb; result jsonb; begin
  event := '{"user_id":"10000000-0000-4000-8000-000000000001","authentication_method":"password","claims":{"session_id":"20000000-0000-4000-8000-000000000003","email":"auth-test@example.invalid"}}';
  result := afcr_private.enforce_auth_method(event);
  assert result->'claims'->>'afcr_method'='password' and result->'claims'->>'afcr_revision'='3', 'Contraseña nueva permitida';
  result := afcr_private.enforce_auth_method(jsonb_set(event,'{authentication_method}','"oauth"'));
  assert result->'error'->>'message'='AFCR_PASSWORD_ONLY', 'Google anterior bloqueado';
end $$;
reset role;
do $$ begin
  assert not has_function_privilege('anon','public.afcr_auth_method_operation(jsonb)','execute'), 'RPC no accesible anon';
  assert not has_function_privilege('authenticated','public.afcr_auth_method_operation(jsonb)','execute'), 'RPC no accesible cliente';
  assert not has_function_privilege('authenticated','afcr_private.enforce_auth_method(jsonb)','execute'), 'Hook no accesible cliente';
  assert not has_table_privilege('authenticated','afcr_private.auth_methods','select'), 'Estado privado';
end $$;
-- Vencimiento y cancelación conservan el método activo.
update afcr_private.auth_methods set sent_at=now()-interval '61 seconds' where user_id='10000000-0000-4000-8000-000000000001';
set local role service_role;
do $$ declare base jsonb; result jsonb; begin
  base := '{"user_id":"10000000-0000-4000-8000-000000000001","session_id":"20000000-0000-4000-8000-000000000003","revision":3,"id":"30000000-0000-4000-8000-000000000004"}';
  result := public.afcr_auth_method_operation(base || '{"operation":"request","target":"google","email":"auth-test@example.invalid","hash":"last-hmac"}');
  assert result->>'target'='google', 'Solicitud final';
  result := public.afcr_auth_method_operation(base || '{"operation":"cancel"}');
  assert result->>'ok'='true', 'Cancelar es posible antes de cambiar';
  result := public.afcr_auth_method_operation(base || '{"operation":"verify","hash":"last-hmac"}');
  assert result->>'error'='AFCR_OTP_EXPIRED', 'Código cancelado no sirve';
end $$;
reset role;
update afcr_private.auth_methods set sent_at=now()-interval '61 seconds',expires_at=now()-interval '1 second',
  challenge_id='30000000-0000-4000-8000-000000000004',requester_session='20000000-0000-4000-8000-000000000003',
  challenge_hash='last-hmac',target='google',sent_count=6,window_started_at=now() where user_id='10000000-0000-4000-8000-000000000001';
set local role service_role;
do $$ declare base jsonb; result jsonb; begin
  base := '{"user_id":"10000000-0000-4000-8000-000000000001","session_id":"20000000-0000-4000-8000-000000000003","revision":3,"id":"30000000-0000-4000-8000-000000000004"}';
  result := public.afcr_auth_method_operation(base || '{"operation":"verify","hash":"last-hmac"}');
  assert result->>'error'='AFCR_OTP_EXPIRED', 'Código vencido no sirve';
  result := public.afcr_auth_method_operation(base || '{"operation":"request","target":"google"}');
  assert result->>'error'='AFCR_RATE_LIMIT', 'Seis envíos por hora';
end $$;
reset role;
select 'Auth methods: assertions passed; fixtures rolled back' as result;
rollback;
