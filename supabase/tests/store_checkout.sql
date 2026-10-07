-- Fixtures descartables; ninguna cuenta, producto ni pedido persiste y no se envían correos.
begin;
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data) values
('71000000-0000-4000-8000-000000000001','authenticated','authenticated','store-one@example.invalid',now(),'{"provider":"email"}'),
('71000000-0000-4000-8000-000000000002','authenticated','authenticated','store-two@example.invalid',now(),'{"provider":"email"}');
insert into auth.sessions(id,user_id) values
('72000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001'),
('72000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000002');
select afcr_private.enforce_auth_method('{"user_id":"71000000-0000-4000-8000-000000000001","authentication_method":"password","claims":{"session_id":"72000000-0000-4000-8000-000000000001","email":"store-one@example.invalid"}}');
select afcr_private.enforce_auth_method('{"user_id":"71000000-0000-4000-8000-000000000002","authentication_method":"password","claims":{"session_id":"72000000-0000-4000-8000-000000000002","email":"store-two@example.invalid"}}');
insert into public.products(id,name,category,price,stock,active) values
('73000000-0000-4000-8000-000000000001','Fixture descartable','minipcs',1234.50,3,true),
('73000000-0000-4000-8000-000000000002','Fixture oculto','security-cameras',200,1,false);
insert into public.cart_items(user_id,product_id,quantity) values('71000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000001',2);
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000001","session_id":"72000000-0000-4000-8000-000000000001","afcr_revision":1,"role":"authenticated"}',true);
set local role authenticated;
do $$ declare payload jsonb; bad jsonb; result jsonb; replay jsonb; code text; before_count integer; begin
 payload:='{"request_id":"74000000-0000-4000-8000-000000000001","items":[{"product_id":"73000000-0000-4000-8000-000000000001","quantity":2,"unit_price":1234.50}],"total":2469,"shipping_address":{"names":"Nombre","surnames":"Apellido","mobile":"999999999","shippingMethod":"lima_delivery","street":"Calle de prueba 123","reference":"Referencia de prueba","ubigeo":"150101","department":"Falso","province":"Falso","district":"Falso","country":"Falso"}}';
 assert public.store_session_valid(),'Sesión vigente';
 assert (select count(*) from public.products where id='73000000-0000-4000-8000-000000000002')=0,'Producto inactivo oculto';
 before_count:=(select count(*) from public.orders);
 for i in 1..10 loop
  bad:=case i
   when 1 then jsonb_set(payload,'{items}','[]')
   when 2 then jsonb_set(payload,'{shipping_address,names}','""')
   when 3 then jsonb_set(payload,'{shipping_address,mobile}','"123"')
   when 4 then jsonb_set(payload,'{shipping_address,shippingMethod}','"otro"')
   when 5 then jsonb_set(payload,'{shipping_address,ubigeo}','"150201"')
   when 6 then jsonb_set(payload,'{shipping_address,reference}','""')
   when 7 then jsonb_set(payload,'{total}','1')
   when 8 then jsonb_set(payload,'{items,0,unit_price}','1')
   when 9 then jsonb_set(payload,'{items,0,quantity}','4')
   else jsonb_set(payload,'{shipping_address,shippingMethod}','"urbano_pickup"') || '{}' end;
  begin
   perform public.store_place_order(bad);
   raise exception 'Fixture inválido aceptado: %',i;
  exception when raise_exception then
   get stacked diagnostics code=message_text;
   assert code like 'STORE_INVALID%' or code in ('STORE_PRICE','STORE_STOCK'),code;
  end;
  assert (select count(*) from public.orders)=before_count,'Rechazo sin insertar';
 end loop;
 result:=public.store_place_order(payload);
 assert result->>'status'='pending','Pedido pendiente';
 assert (result->>'total')::numeric=2469,'Total canónico';
 assert result->'shipping_address'->>'department'='Lima','Departamento normalizado';
 assert result->'shipping_address'->>'country'='Perú','País normalizado';
 assert jsonb_array_length(result->'order_items')=1,'Recibo conserva líneas';
 assert (select count(*) from public.cart_items)=0,'Carrito remoto borrado';
 assert (select count(*) from public.profiles where names='Nombre')=1,'Perfil guardado';
 replay:=public.store_place_order(payload);
 assert replay->>'id'=result->>'id','Reintento idempotente';
 assert (select count(*) from public.orders)=before_count+1,'Sin duplicar orden';
 begin
  insert into public.orders(user_id,total,shipping_address,request_id,request_hash) values('71000000-0000-4000-8000-000000000002',0,'{}',gen_random_uuid(),'x');
  raise exception 'Inserción directa aceptada';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000002","session_id":"72000000-0000-4000-8000-000000000002","afcr_revision":1,"role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert public.store_session_valid(),'Segunda sesión válida';
 assert (select count(*) from public.orders)=0,'Otro usuario no ve pedidos';
 assert (select count(*) from public.order_items)=0,'Otro usuario no ve ítems';
 assert (select count(*) from public.profiles)=0,'Otro usuario no ve perfil';
 update public.profiles set names='Ataque' where user_id='71000000-0000-4000-8000-000000000001';
 assert not found,'Otro usuario no actualiza perfil';
end $$;
reset role;
update afcr_private.auth_methods set revision=2 where user_id='71000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"71000000-0000-4000-8000-000000000001","session_id":"72000000-0000-4000-8000-000000000001","afcr_revision":1,"role":"authenticated"}',true);
set local role authenticated;
do $$ declare code text;begin
 assert not public.store_session_valid(),'Revisión antigua bloqueada';
 assert (select count(*) from public.orders)=0,'JWT antiguo sin datos privados';
 begin perform public.store_place_order('{}');raise exception 'Sesión antigua aceptada';exception when raise_exception then get stacked diagnostics code=message_text;assert code='STORE_SESSION',code;end;
end $$;
reset role;
set local role anon;
do $$ begin begin perform public.store_place_order('{}');raise exception 'Anónimo aceptado';exception when insufficient_privilege then null;end;end $$;
reset role;
rollback;
select 'store_checkout: PASS (fixtures revertidas)' as result;
