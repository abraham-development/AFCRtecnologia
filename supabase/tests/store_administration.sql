-- Ejecutar después de la migración store_administration. Fixtures descartables, sin correos ni archivos.
begin;
insert into afcr_private.store_admins(email) values('admin-fixture@example.invalid');
insert into auth.users(id,aud,role,email,raw_app_meta_data,raw_user_meta_data) values
('81000000-0000-4000-8000-000000000091','authenticated','authenticated','admin-fixture@example.invalid','{"provider":"email"}','{}'),
('81000000-0000-4000-8000-000000000092','authenticated','authenticated','customer-fixture@example.invalid','{"provider":"email"}','{"role":"admin"}');
update auth.users set email_confirmed_at=now() where id='81000000-0000-4000-8000-000000000092';
insert into auth.sessions(id,user_id) values
('82000000-0000-4000-8000-000000000091','81000000-0000-4000-8000-000000000091'),
('82000000-0000-4000-8000-000000000092','81000000-0000-4000-8000-000000000092');
select afcr_private.enforce_auth_method('{"user_id":"81000000-0000-4000-8000-000000000091","authentication_method":"password","claims":{"session_id":"82000000-0000-4000-8000-000000000091","email":"admin-fixture@example.invalid"}}');
select afcr_private.enforce_auth_method('{"user_id":"81000000-0000-4000-8000-000000000092","authentication_method":"password","claims":{"session_id":"82000000-0000-4000-8000-000000000092","email":"customer-fixture@example.invalid"}}');
select set_config('request.jwt.claims','{"sub":"81000000-0000-4000-8000-000000000091","session_id":"82000000-0000-4000-8000-000000000091","afcr_revision":1,"role":"authenticated"}',true);
set local role authenticated;
do $$begin assert not public.store_is_admin(),'Correo sin verificar no obtiene permisos';end$$;
reset role;
update auth.users set email_confirmed_at=now() where id='81000000-0000-4000-8000-000000000091';
set local role authenticated;
do $$declare saved jsonb; adjustment jsonb; code text;begin
 assert public.store_is_admin(),'Correo verificado se liga al UUID';
 saved:=public.store_admin_mutate('product_save','{"id":"83000000-0000-4000-8000-000000000091","version":0,"name":"Fixture descartable","brand":"Fixture","sku":"FIXTURE-ADMIN-91","category":"minipcs","description":"Ficha descartable para prueba de permisos.","price":19.99,"stock":5,"low_stock_threshold":2,"features":[],"image_paths":[],"active":false}');
 assert (saved->>'stock')::int=5,'Stock inicial';
 adjustment:='{"id":"83000000-0000-4000-8000-000000000091","version":2,"delta":3,"reason":"Ingreso descartable","request_id":"84000000-0000-4000-8000-000000000091"}';
 perform public.store_admin_mutate('stock_adjust',adjustment);
 assert (public.store_admin_mutate('stock_adjust',adjustment)->>'replayed')::boolean,'Ajuste idempotente';
 begin perform public.store_admin_mutate('product_save','{"id":"83000000-0000-4000-8000-000000000091","version":1}');raise exception 'Version vieja aceptada';
 exception when raise_exception then get stacked diagnostics code=message_text;assert code='STORE_CONFLICT',code;end;
 begin perform public.store_admin_mutate('stock_adjust','{"id":"83000000-0000-4000-8000-000000000091","version":3,"delta":-9,"reason":"Inválido","request_id":"84000000-0000-4000-8000-000000000092"}');raise exception 'Stock negativo aceptado';
 exception when raise_exception then get stacked diagnostics code=message_text;assert code='STORE_INVALID_STOCK',code;end;
end$$;
reset role;
-- Publicación de fixture solo dentro de la transacción, sin imágenes ficticias en Storage.
update public.products set active=true where id='83000000-0000-4000-8000-000000000091';
select set_config('request.jwt.claims','{"sub":"81000000-0000-4000-8000-000000000092","session_id":"82000000-0000-4000-8000-000000000092","afcr_revision":1,"role":"authenticated","user_metadata":{"role":"admin"}}',true);
set local role authenticated;
do $$declare code text;begin
 assert not public.store_is_admin(),'Metadatos no conceden acceso';
 begin perform public.store_admin_read('orders');raise exception 'Cliente ve panel';
 exception when raise_exception then get stacked diagnostics code=message_text;assert code='STORE_FORBIDDEN',code;end;
 begin perform public.store_admin_mutate('product_save','{}');raise exception 'Cliente cambia productos';
 exception when raise_exception then get stacked diagnostics code=message_text;assert code='STORE_FORBIDDEN',code;end;
 begin perform 1 from afcr_private.store_admins;raise exception 'Cliente ve administradores';
 exception when insufficient_privilege then null;end;
 begin perform admin_note from public.orders;raise exception 'Cliente ve notas internas';
 exception when insufficient_privilege then null;end;
 perform public.store_place_order('{"request_id":"85000000-0000-4000-8000-000000000091","items":[{"product_id":"83000000-0000-4000-8000-000000000091","quantity":2,"unit_price":19.99}],"total":39.98,"shipping_address":{"names":"Fixture","surnames":"Descartable","mobile":"999999999","shippingMethod":"lima_delivery","street":"Calle descartable","reference":"Referencia descartable","ubigeo":"150101"}}');
 assert (select stock from public.products where id='83000000-0000-4000-8000-000000000091')=6,'Checkout reserva unidades';
end$$;
reset role;
select set_config('request.jwt.claims','{"sub":"81000000-0000-4000-8000-000000000091","session_id":"82000000-0000-4000-8000-000000000091","afcr_revision":1,"role":"authenticated"}',true);
set local role authenticated;
do $$declare snapshot jsonb; target jsonb;change jsonb;code text;begin
 snapshot:=public.store_admin_read('orders','85000000');
 -- Buscar por cliente para no depender de un UUID generado.
 snapshot:=public.store_admin_read('orders','81000000-0000-4000-8000-000000000092');
 target:=snapshot->'rows'->0;assert target->>'status'='pending','Administrador obtiene pedido';
 change:=jsonb_build_object('id',target->>'id','version',1,'status','cancelled','payment_status','pending','shipping_cost',null,'payment_reference','','tracking_reference','','admin_note','Cancelación descartable');
 perform public.store_admin_mutate('order_update',change);
 assert (select stock from public.products where id='83000000-0000-4000-8000-000000000091')=8,'Cancelar reintegra';
 perform public.store_admin_mutate('order_update',jsonb_set(change,'{version}','2'));
 assert (select stock from public.products where id='83000000-0000-4000-8000-000000000091')=8,'No reintegra dos veces';
 begin perform public.store_admin_mutate('order_update',jsonb_set(jsonb_set(change,'{version}','3'),'{status}','"processing"'));raise exception 'Reapertura aceptada';
 exception when raise_exception then get stacked diagnostics code=message_text;assert code='STORE_INVALID_TRANSITION',code;end;
 perform public.store_admin_mutate('pickup_save','{"id":"fixture-admin-91","version":0,"name":"Fixture descartable","street":"Calle descartable","reference":"Referencia descartable","hours":"Horario descartable","ubigeo":"040101","active":true}');
 assert exists(select 1 from jsonb_array_elements(public.store_pickup_points()) p where p->>'id'='fixture-admin-91'),'Punto publicado se ofrece al checkout';
 assert (public.store_admin_read('activity')->>'count')::int>=5,'Cambios auditados';
end$$;
reset role;
update afcr_private.auth_methods set revision=revision+1 where user_id='81000000-0000-4000-8000-000000000091';
set local role authenticated;
do $$begin assert not public.store_is_admin(),'Sesión antigua pierde permisos';end$$;
reset role;
set local role anon;
do $$begin begin perform public.store_admin_read('orders');raise exception 'Anónimo obtiene pedidos';exception when insufficient_privilege then null;end;end$$;
reset role;
rollback;
select 'store_administration: PASS (fixtures revertidas)' as result;
