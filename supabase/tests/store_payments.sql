-- Ejecutar después de store_culqi_payments. Fixtures descartables: sin cargos reales, correos ni datos persistentes.
begin;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data) values
('91000000-0000-4000-8000-000000000001','authenticated','authenticated','pay-one@example.invalid',now(),'{"provider":"email"}'),
('91000000-0000-4000-8000-000000000002','authenticated','authenticated','pay-two@example.invalid',now(),'{"provider":"email"}');
insert into auth.sessions(id,user_id) values
('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001'),
('92000000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000002');
select afcr_private.enforce_auth_method('{"user_id":"91000000-0000-4000-8000-000000000001","authentication_method":"password","claims":{"session_id":"92000000-0000-4000-8000-000000000001","email":"pay-one@example.invalid"}}');
select afcr_private.enforce_auth_method('{"user_id":"91000000-0000-4000-8000-000000000002","authentication_method":"password","claims":{"session_id":"92000000-0000-4000-8000-000000000002","email":"pay-two@example.invalid"}}');
insert into public.products(id,name,category,price,stock,active) values
('93000000-0000-4000-8000-000000000001','Fixture pago','minipcs',12.50,5,true);
insert into afcr_private.urbano_pickup_points(id,carrier,name,street,reference,hours,ubigeo,active,shipping_price,shipping_mode) values
('fixture-shalom-91','shalom','Fixture Shalom','Calle descartable','Referencia descartable','Lun–Vie 08:00–20:00','040101',true,16,'terrestre');
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","session_id":"92000000-0000-4000-8000-000000000001","afcr_revision":1,"role":"authenticated"}',true);
set local role authenticated;
do $$declare first jsonb; second jsonb;begin
 first:=public.store_place_order('{"request_id":"94000000-0000-4000-8000-000000000001","items":[{"product_id":"93000000-0000-4000-8000-000000000001","quantity":2,"unit_price":12.50}],"total":25,"shipping_address":{"names":"Fixture","surnames":"Descartable","mobile":"999999999","shippingMethod":"lima_delivery","street":"Calle descartable","reference":"Referencia descartable","ubigeo":"150101"}}');
 assert first->>'payment_status'='pending','Recibo nuevo expone pago pendiente';
 second:=public.store_place_order('{"request_id":"94000000-0000-4000-8000-000000000002","items":[{"product_id":"93000000-0000-4000-8000-000000000001","quantity":1,"unit_price":12.50}],"total":12.5,"shipping_address":{"names":"Fixture","surnames":"Descartable","mobile":"999999999","shippingMethod":"lima_delivery","street":"Calle descartable","reference":"Referencia descartable","ubigeo":"150101"}}');
 perform set_config('afcr.test_shalom',public.store_place_order('{"request_id":"94000000-0000-4000-8000-000000000003","items":[{"product_id":"93000000-0000-4000-8000-000000000001","quantity":1,"unit_price":12.50}],"total":12.5,"shipping_address":{"names":"Fixture","surnames":"Descartable","mobile":"999999999","shippingMethod":"shalom_pickup","pickupPointId":"fixture-shalom-91"}}')->>'id',true);
 perform set_config('afcr.test_order',first->>'id',true);
 perform set_config('afcr.test_second',second->>'id',true);
 begin perform public.store_culqi_operation('{}');raise exception 'Cliente usa la RPC de pagos';exception when insufficient_privilege then null;end;
 assert (select stock from public.products where id='93000000-0000-4000-8000-000000000001')=1,'Checkout reserva stock';
end$$;
reset role;
set local role anon;
do $$begin begin perform public.store_culqi_operation('{}');raise exception 'Anónimo usa la RPC de pagos';exception when insufficient_privilege then null;end;end$$;
reset role;
set local role service_role;
do $$declare base jsonb; started jsonb; result jsonb; replay jsonb;begin
 base:=jsonb_build_object('operation','begin','user_id','91000000-0000-4000-8000-000000000001','session_id','92000000-0000-4000-8000-000000000001','revision',1,
  'order_id',current_setting('afcr.test_order'),'token_id','tkn_test_AAAAAAAAAAAAAAAA','device_id','95000000-0000-4000-8000-000000000001');
 result:=public.store_culqi_operation(base||'{"user_id":"91000000-0000-4000-8000-000000000002","session_id":"92000000-0000-4000-8000-000000000002"}');
 assert result->>'error'='STORE_ORDER_NOT_FOUND','Otro usuario no cobra un pedido ajeno';
 result:=public.store_culqi_operation(base||'{"revision":2}');
 assert result->>'error'='STORE_SESSION','Revisión vieja rechazada';
 result:=public.store_culqi_operation(base||'{"token_id":"tkn_test_<script>"}');
 assert result->>'error'='STORE_INVALID','Token malformado rechazado';
 started:=public.store_culqi_operation(base||'{"amount":1}');
 assert (started->>'amount')::int=2500,'El importe sale del pedido, no del request';
 result:=public.store_culqi_operation(base||'{"token_id":"tkn_test_BBBBBBBBBBBBBBBB"}');
 assert result->>'error'='STORE_PAYMENT_BUSY','Un solo cobro en vuelo por pedido';
 result:=public.store_culqi_operation(jsonb_build_object('operation','finish','attempt_id',started->>'attempt_id','outcome','needs_3ds'));
 assert result->>'status'='needs_3ds','Culqi pide 3DS';
 result:=public.store_culqi_operation(base);
 assert result->>'error'='STORE_TOKEN_USED','El token se reutiliza solo con parámetros 3DS';
 replay:=public.store_culqi_operation(base||'{"authentication_3DS":{"eci":"05"}}');
 assert replay->>'attempt_id'=started->>'attempt_id','El segundo cargo 3DS usa el mismo intento';
 result:=public.store_culqi_operation(jsonb_build_object('operation','finish','attempt_id',started->>'attempt_id','outcome','succeeded','charge_id','chr_test_CCCCCCCCCCCCCCCC','amount',2400,'currency','PEN'));
 assert result->>'status'='uncertain','Importe distinto no marca pagado';
 assert (select payment_status from public.orders where id=current_setting('afcr.test_order')::uuid)='pending','Pedido sigue pendiente';
 result:=public.store_culqi_operation(base||'{"token_id":"tkn_test_DDDDDDDDDDDDDDDD"}');
 assert result->'uncertain'->>'attempt_id'=started->>'attempt_id','Un cobro incierto se concilia antes de pedir otro token';
 result:=public.store_culqi_operation(jsonb_build_object('operation','finish','attempt_id',started->>'attempt_id','outcome','succeeded','charge_id','chr_test_CCCCCCCCCCCCCCCC','amount',2500,'currency','PEN'));
 assert result->>'status'='succeeded','Conciliación con importe correcto';
 assert (select payment_status='paid' and payment_provider='culqi' and payment_reference='chr_test_CCCCCCCCCCCCCCCC' and status='pending' from public.orders where id=current_setting('afcr.test_order')::uuid),'Pedido pagado con Culqi';
 result:=public.store_culqi_operation(base||'{"token_id":"tkn_test_EEEEEEEEEEEEEEEE"}');
 assert (result->>'paid')::boolean,'Un pedido pagado no se vuelve a cobrar';
 -- Recojo Shalom: Culqi cobra productos + tarifa de la agencia.
 result:=public.store_culqi_operation(jsonb_set(base,'{order_id}',to_jsonb(current_setting('afcr.test_shalom')))||'{"token_id":"tkn_test_SSSSSSSSSSSSSSSS"}');
 assert (result->>'amount')::int=2850,'Shalom: 12.50 de productos + 16 de envío';
 perform public.store_culqi_operation(jsonb_build_object('operation','finish','attempt_id',result->>'attempt_id','outcome','failed'));
 -- Rechazo: libera el pedido para otro intento.
 base:=jsonb_set(base,'{order_id}',to_jsonb(current_setting('afcr.test_second')));
 started:=public.store_culqi_operation(base||'{"token_id":"tkn_test_FFFFFFFFFFFFFFFF"}');
 perform public.store_culqi_operation(jsonb_build_object('operation','finish','attempt_id',started->>'attempt_id','outcome','failed','code','DNGE0015','user_message','Fondos insuficientes'));
 result:=public.store_culqi_operation(base||'{"token_id":"tkn_test_GGGGGGGGGGGGGGGG"}');
 assert result ? 'attempt_id','Tras un rechazo se admite otro token';
 perform public.store_culqi_operation(jsonb_build_object('operation','finish','attempt_id',result->>'attempt_id','outcome','failed'));
end$$;
reset role;
-- Vencimiento: el pedido impago devuelve stock; el pagado no cambia.
update public.orders set created_at=now()-interval '31 minutes' where user_id='91000000-0000-4000-8000-000000000001';
do $$begin
 assert afcr_private.store_expire_unpaid_orders()=2,'Solo vencen los pedidos impagos';
 assert (select status from public.orders where id=current_setting('afcr.test_second')::uuid)='cancelled','Pedido impago cancelado';
 assert (select status from public.orders where id=current_setting('afcr.test_order')::uuid)='pending','Pedido pagado se conserva';
 assert (select stock from public.products where id='93000000-0000-4000-8000-000000000001')=3,'Stock devuelto una vez';
 assert (select status from public.orders where id=current_setting('afcr.test_shalom')::uuid)='cancelled','Pedido Shalom impago cancelado';
 assert afcr_private.store_expire_unpaid_orders()=0,'No devuelve dos veces';
 assert exists(select 1 from cron.job where jobname='afcr-store-expire-orders' and active),'Cron de vencimiento activo';
end$$;
-- Panel: en un pedido Culqi el envío se fija después del pago y la referencia del cargo no cambia.
insert into afcr_private.store_admins(email,user_id) values('pay-two@example.invalid','91000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000002","session_id":"92000000-0000-4000-8000-000000000002","afcr_revision":1,"role":"authenticated"}',true);
set local role authenticated;
do $$declare target uuid:=current_setting('afcr.test_order')::uuid;begin
 perform public.store_admin_mutate('order_update',jsonb_build_object('id',target,'version',(select (r->>'version')::bigint from jsonb_array_elements(public.store_admin_read('orders','91000000-0000-4000-8000-000000000001')->'rows') r where r->>'id'=target::text),
  'status','processing','payment_status','paid','shipping_cost',15,'payment_reference','editado','tracking_reference','','admin_note',''));
end$$;
reset role;
do $$begin
 assert (select shipping_cost=15 and payment_reference='chr_test_CCCCCCCCCCCCCCCC' and payment_provider='culqi' and status='processing' from public.orders where id=current_setting('afcr.test_order')::uuid),'Envío posterior sin tocar el cargo';
end$$;
rollback;
select 'store_payments: PASS (fixtures revertidas)' as result;
