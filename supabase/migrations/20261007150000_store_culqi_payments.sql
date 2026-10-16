-- Pagos con Culqi. El importe sale del pedido y solo la Edge Function (service_role) registra resultados.
alter table public.orders add column payment_provider text check(payment_provider in('manual','culqi'));
grant select(payment_provider) on public.orders to authenticated;

create table afcr_private.store_payments(
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 token_id text not null check(token_id ~ '^[a-z]{3}_(test|live)_[A-Za-z0-9]{8,40}$'),
 device_id uuid,
 amount integer not null check(amount between 300 and 9999900),
 status text not null default 'processing' check(status in('processing','needs_3ds','succeeded','failed','uncertain')),
 charge_id text unique check(charge_id ~ '^chr_(test|live)_[A-Za-z0-9]{8,40}$'),
 code text, decline_code text, user_message text, merchant_message text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(order_id,token_id)
);
-- Un solo cobro en vuelo por pedido: no se pide otro token mientras uno puede haberse cobrado.
create unique index store_payments_inflight_idx on afcr_private.store_payments(order_id) where status in('processing','uncertain');
create index store_payments_user_idx on afcr_private.store_payments(user_id);
alter table afcr_private.store_payments enable row level security;
revoke all on afcr_private.store_payments from public,anon,authenticated;
grant all on afcr_private.store_payments to service_role;
create policy payments_service on afcr_private.store_payments to service_role using(true) with check(true);

-- Operaciones de la Edge Function. La sesión se comprueba con los claims que validó getUser.
create function afcr_private.store_culqi_operation(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 operation text:=payload->>'operation'; uid uuid; sid uuid; rev bigint; token text:=payload->>'token_id';
 o public.orders%rowtype; attempt afcr_private.store_payments%rowtype; cents integer; outcome text; target uuid; duplicate boolean:=false;
begin
 if jsonb_typeof(payload) is distinct from 'object' then return jsonb_build_object('error','STORE_INVALID'); end if;
 if operation='begin' then
  uid:=(payload->>'user_id')::uuid; sid:=(payload->>'session_id')::uuid; rev:=(payload->>'revision')::bigint;
  if uid is null or sid is null or rev is null or not exists(select 1 from afcr_private.auth_method_sessions s
   join afcr_private.auth_methods m on m.user_id=s.user_id join auth.sessions a on a.id=s.session_id and a.user_id=s.user_id
   where s.user_id=uid and s.session_id=sid and s.revision=m.revision and s.revision=rev and s.method=m.method) then
   return jsonb_build_object('error','STORE_SESSION');
  end if;
  if coalesce(token,'') !~ '^[a-z]{3}_(test|live)_[A-Za-z0-9]{8,40}$' then return jsonb_build_object('error','STORE_INVALID'); end if;
  select * into o from public.orders where id=(payload->>'order_id')::uuid and user_id=uid for update;
  if not found then return jsonb_build_object('error','STORE_ORDER_NOT_FOUND'); end if;
  if o.payment_status='paid' then return jsonb_build_object('paid',true); end if;
  if o.status<>'pending' or o.payment_status<>'pending' then return jsonb_build_object('error','STORE_ORDER_CLOSED'); end if;
  -- Un intento colgado pudo cobrarse antes de que la función muriera: se concilia, no se repite.
  update afcr_private.store_payments set status='uncertain',code='STALE_ATTEMPT',updated_at=now()
  where order_id=o.id and status='processing' and updated_at<now()-interval '2 minutes';
  if exists(select 1 from afcr_private.store_payments where order_id=o.id and status='processing') then
   return jsonb_build_object('error','STORE_PAYMENT_BUSY');
  end if;
  select * into attempt from afcr_private.store_payments where order_id=o.id and status='uncertain';
  if found then
   return jsonb_build_object('uncertain',jsonb_build_object('attempt_id',attempt.id,'amount',attempt.amount,'charge_id',attempt.charge_id,
    'since',floor(extract(epoch from attempt.created_at))::bigint));
  end if;
  if (select count(*) from afcr_private.store_payments where order_id=o.id)>=10 then return jsonb_build_object('error','STORE_PAYMENT_LIMIT'); end if;
  cents:=round(o.total*100)::integer;
  if cents<300 or cents>9999900 then return jsonb_build_object('error','STORE_AMOUNT'); end if;
  select * into attempt from afcr_private.store_payments where order_id=o.id and token_id=token for update;
  if found then
   -- El mismo token solo se reutiliza para el segundo cargo después de 3DS.
   if attempt.status<>'needs_3ds' or jsonb_typeof(payload->'authentication_3DS') is distinct from 'object' then
    return jsonb_build_object('error','STORE_TOKEN_USED');
   end if;
   update afcr_private.store_payments set status='processing',updated_at=now() where id=attempt.id returning * into attempt;
  else
   insert into afcr_private.store_payments(order_id,user_id,token_id,device_id,amount)
   values(o.id,uid,token,(payload->>'device_id')::uuid,cents) returning * into attempt;
  end if;
  return jsonb_build_object('attempt_id',attempt.id,'order_id',o.id,'amount',attempt.amount,'device_id',attempt.device_id,
   'names',o.shipping_address->>'names','surnames',o.shipping_address->>'surnames','mobile',o.shipping_address->>'mobile',
   'street',o.shipping_address->>'street','city',o.shipping_address->>'province');
 elsif operation='finish' then
  outcome:=payload->>'outcome';
  if outcome is null or outcome not in('succeeded','needs_3ds','failed','uncertain') then return jsonb_build_object('error','STORE_INVALID'); end if;
  -- Mismo orden de locks que begin y el panel: primero el pedido, después el intento.
  select order_id into target from afcr_private.store_payments where id=(payload->>'attempt_id')::uuid;
  if not found then return jsonb_build_object('error','STORE_INVALID'); end if;
  select * into o from public.orders where id=target for update;
  select * into attempt from afcr_private.store_payments where id=(payload->>'attempt_id')::uuid for update;
  if outcome='succeeded' and attempt.status not in('processing','uncertain','needs_3ds')
   or outcome in('failed','uncertain') and attempt.status not in('processing','uncertain')
   or outcome='needs_3ds' and attempt.status<>'processing' then
   return jsonb_build_object('error','STORE_INVALID_STATE','status',attempt.status);
  end if;
  if outcome='succeeded' and (jsonb_typeof(payload->'amount') is distinct from 'number' or (payload->>'amount')::numeric<>attempt.amount
   or payload->>'currency' is distinct from 'PEN' or coalesce(payload->>'charge_id','') !~ '^chr_(test|live)_[A-Za-z0-9]{8,40}$') then
   outcome:='uncertain'; payload:=payload||jsonb_build_object('code','AMOUNT_MISMATCH');
  end if;
  update afcr_private.store_payments set status=outcome,
   charge_id=case when coalesce(payload->>'charge_id','') ~ '^chr_(test|live)_[A-Za-z0-9]{8,40}$' then payload->>'charge_id' else charge_id end,
   code=left(nullif(payload->>'code',''),100),decline_code=left(nullif(payload->>'decline_code',''),100),
   user_message=left(nullif(payload->>'user_message',''),500),merchant_message=left(nullif(payload->>'merchant_message',''),500),updated_at=now()
  where id=attempt.id;
  if outcome='succeeded' then
   if o.payment_status='pending' then
    update public.orders set payment_status='paid',payment_provider='culqi',payment_reference=payload->>'charge_id',paid_at=now(),updated_at=now(),version=version+1
    where id=o.id;
   else
    -- Pedido ya pagado por otro cargo: queda registrado para devolverlo desde CulqiPanel.
    duplicate:=true;
   end if;
  end if;
  return jsonb_build_object('status',outcome,'order_id',o.id,'duplicate',duplicate,'order_status',o.status);
 else
  return jsonb_build_object('error','STORE_INVALID');
 end if;
exception when invalid_text_representation or numeric_value_out_of_range or check_violation then return jsonb_build_object('error','STORE_INVALID');
 when unique_violation then return jsonb_build_object('error','STORE_PAYMENT_BUSY');
end $$;
revoke all on function afcr_private.store_culqi_operation(jsonb) from public,anon,authenticated;
grant execute on function afcr_private.store_culqi_operation(jsonb) to service_role;
create function public.store_culqi_operation(payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if current_user<>'service_role' then raise insufficient_privilege; end if;
 return afcr_private.store_culqi_operation(payload);
end $$;
revoke all on function public.store_culqi_operation(jsonb) from public,anon,authenticated;
grant execute on function public.store_culqi_operation(jsonb) to service_role;

-- Un pedido impago retiene stock por la reserva: vence a los 30 minutos y devuelve las unidades una sola vez.
create function afcr_private.store_expire_unpaid_orders() returns integer language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype; item record; remaining integer; expired integer:=0;
begin
 for o in select * from public.orders x where x.status='pending' and x.payment_status='pending' and x.created_at<now()-interval '30 minutes'
  order by x.created_at limit 200 for update skip locked loop
  -- Con el pedido bloqueado, begin no puede abrir un cobro nuevo; los intentos en vuelo se concilian antes.
  continue when exists(select 1 from afcr_private.store_payments s where s.order_id=o.id and s.status in('processing','uncertain'));
  if o.stock_reserved then
   perform 1 from public.products where id in(select product_id from public.order_items where order_id=o.id) order by id for update;
   for item in select product_id,quantity from public.order_items where order_id=o.id order by product_id loop
    update public.products set stock=stock+item.quantity,version=version+1,updated_at=now() where id=item.product_id returning stock into remaining;
    insert into afcr_private.store_stock_movements(product_id,order_id,actor_id,delta,available_after,reason)
    values(item.product_id,o.id,null,item.quantity,remaining,'order_expired');
   end loop;
  end if;
  update public.orders set status='cancelled',stock_reserved=false,admin_note=case when admin_note='' then 'Vencido sin pago' else admin_note end,
   updated_at=now(),version=version+1 where id=o.id;
  expired:=expired+1;
 end loop;
 return expired;
end $$;
revoke all on function afcr_private.store_expire_unpaid_orders() from public,anon,authenticated;
select cron.schedule('afcr-store-expire-orders','*/5 * * * *','select afcr_private.store_expire_unpaid_orders()');

-- El recibo repetido expone el estado de pago para que el checkout no cobre un pedido vencido.
create or replace function afcr_private.store_place_order(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid := auth.uid(); address jsonb:=payload->'shipping_address'; method text:=address->>'shippingMethod';
 loc afcr_private.store_locations%rowtype; point afcr_private.urbano_pickup_points%rowtype;
 item jsonb; product public.products%rowtype; qty integer; sum_total numeric:=0; new_order_id uuid; request uuid;
 normalized jsonb; existing public.orders%rowtype; count_items integer;
begin
 if uid is null or not afcr_private.store_session_valid() then raise exception 'STORE_SESSION'; end if;
 if jsonb_typeof(payload) is distinct from 'object' or jsonb_typeof(payload->'items') is distinct from 'array' then raise exception 'STORE_INVALID'; end if;
 count_items:=jsonb_array_length(payload->'items');
 if count_items<1 or count_items>50 or jsonb_typeof(payload->'total') is distinct from 'number' or (payload->>'total')::numeric<0 then raise exception 'STORE_INVALID'; end if;
 if jsonb_typeof(address) is distinct from 'object' or method is null or method not in ('lima_delivery','urbano_pickup') then raise exception 'STORE_INVALID'; end if;
 if jsonb_typeof(address->'names') is distinct from 'string' or length(btrim(address->>'names')) not between 1 and 100
 or jsonb_typeof(address->'surnames') is distinct from 'string' or length(btrim(address->>'surnames')) not between 1 and 100
 or coalesce(address->>'mobile','') !~ '^9[0-9]{8}$' then raise exception 'STORE_INVALID'; end if;
 if method='lima_delivery' then
  select * into loc from afcr_private.store_locations where ubigeo=address->>'ubigeo';
  if not found or left(loc.ubigeo,4) not in ('1501','0701')
   or jsonb_typeof(address->'street') is distinct from 'string' or length(btrim(address->>'street')) not between 1 and 250
   or jsonb_typeof(address->'reference') is distinct from 'string' or length(btrim(address->>'reference')) not between 1 and 250 then raise exception 'STORE_INVALID_ADDRESS'; end if;
  normalized:=jsonb_build_object('street',btrim(address->>'street'),'reference',btrim(address->>'reference'));
 else
  select * into point from afcr_private.urbano_pickup_points where id=address->>'pickupPointId' and active;
  if not found or left(point.ubigeo,4) in ('1501','0701') then raise exception 'STORE_INVALID_PICKUP'; end if;
  select * into loc from afcr_private.store_locations where ubigeo=point.ubigeo;
  if not found then raise exception 'STORE_INVALID_ADDRESS'; end if;
  normalized:=jsonb_build_object('street',point.street,'reference',point.reference,'pickupPointId',point.id,'pickupPointName',point.name);
 end if;
 normalized:=normalized || jsonb_build_object('names',btrim(address->>'names'),'surnames',btrim(address->>'surnames'),'mobile',address->>'mobile','shippingMethod',method,
 'department',loc.department,'province',loc.province,'district',loc.district,'ubigeo',loc.ubigeo,'country','Perú');
 request:=(payload->>'request_id')::uuid;
 if request is null then raise exception 'STORE_INVALID'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into existing from public.orders where user_id=uid and request_id=request;
 if found then
  if existing.request_hash<>md5(payload::text) then raise exception 'STORE_INVALID_REPLAY'; end if;
  return jsonb_build_object('id',existing.id,'status',existing.status,'payment_status',existing.payment_status,'total',existing.total,'shipping_address',existing.shipping_address,'created_at',existing.created_at,'order_items',(select coalesce(jsonb_agg(jsonb_build_object('product_id',i.product_id,'product_name',i.product_name,'quantity',i.quantity,'unit_price',i.unit_price)),'[]'::jsonb) from public.order_items i where i.order_id=existing.id));
 end if;
 if (select count(distinct value->>'product_id') from jsonb_array_elements(payload->'items'))<>count_items then raise exception 'STORE_INVALID_ITEMS'; end if;
 -- Orden de locks constante entre pedidos; precios y stock proceden del catálogo.
 for item in select value from jsonb_array_elements(payload->'items') order by value->>'product_id' loop
  if jsonb_typeof(item->'quantity') is distinct from 'number' or (item->>'quantity') !~ '^[0-9]{1,2}$' then raise exception 'STORE_INVALID_ITEMS'; end if;
  qty:=(item->>'quantity')::integer;
  if qty not between 1 and 99 or jsonb_typeof(item->'unit_price') is distinct from 'number' then raise exception 'STORE_INVALID_ITEMS'; end if;
  select * into product from public.products where id=(item->>'product_id')::uuid and active for update;
  if not found or product.stock<qty then raise exception 'STORE_STOCK'; end if;
  if product.price<>(item->>'unit_price')::numeric then raise exception 'STORE_PRICE'; end if;
  sum_total:=sum_total+product.price*qty;
 end loop;
 if sum_total<>(payload->>'total')::numeric then raise exception 'STORE_PRICE'; end if;
 insert into public.profiles(user_id,names,surnames,mobile,address) values(uid,normalized->>'names',normalized->>'surnames',normalized->>'mobile',case when method='lima_delivery' then normalized - 'names' - 'surnames' - 'mobile' - 'shippingMethod' end)
 on conflict(user_id) do update set names=excluded.names,surnames=excluded.surnames,mobile=excluded.mobile,address=case when method='lima_delivery' then excluded.address else public.profiles.address end,updated_at=now();
 insert into public.orders(user_id,total,shipping_address,request_id,request_hash) values(uid,sum_total,normalized,request,md5(payload::text)) returning id into new_order_id;
 for item in select value from jsonb_array_elements(payload->'items') loop
  select * into product from public.products where id=(item->>'product_id')::uuid;
  insert into public.order_items(order_id,user_id,product_id,product_name,quantity,unit_price) values(new_order_id,uid,product.id,product.name,(item->>'quantity')::integer,product.price);
 end loop;
 delete from public.cart_items where user_id=uid;
 return jsonb_build_object('id',new_order_id,'status','pending','payment_status','pending','total',sum_total,'shipping_address',normalized,'created_at',now(),'order_items',(select coalesce(jsonb_agg(jsonb_build_object('product_id',i.product_id,'product_name',i.product_name,'quantity',i.quantity,'unit_price',i.unit_price)),'[]'::jsonb) from public.order_items i where i.order_id=new_order_id));
exception when invalid_text_representation or numeric_value_out_of_range then raise exception 'STORE_INVALID';
end;
$$;

-- El panel no fija a mano el pago de un cobro Culqi ni bloquea el envío que se coordina después.
create or replace function afcr_private.store_admin_mutate(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); p public.products%rowtype; o public.orders%rowtype; point afcr_private.urbano_pickup_points%rowtype;
 identifier uuid; expected bigint; initial integer; delta integer; remaining integer; req uuid; replay afcr_private.store_stock_movements%rowtype;
 paths jsonb; item jsonb; new_status text; pay text; fee numeric; note text; changed jsonb; path text; reservation boolean; culqi boolean;
begin
 if uid is null or not afcr_private.store_is_admin() then raise exception 'STORE_FORBIDDEN'; end if;
 if jsonb_typeof(payload) is distinct from 'object' then raise exception 'STORE_INVALID'; end if;
 if action in('product_save','product_archive','stock_adjust') then
  identifier:=(payload->>'id')::uuid; expected:=(payload->>'version')::bigint;
  if identifier is null or expected is null or expected<0 then raise exception 'STORE_INVALID'; end if;
  if action='stock_adjust' then
   req:=(payload->>'request_id')::uuid;if req is null then raise exception 'STORE_INVALID'; end if;
   perform pg_advisory_xact_lock(hashtextextended(uid::text||req::text,0));
   select * into replay from afcr_private.store_stock_movements where actor_id=uid and request_id=req;
   if found then
    if replay.request_hash<>md5(payload::text) then raise exception 'STORE_INVALID_REPLAY'; end if;
    return jsonb_build_object('id',replay.product_id,'replayed',true);
   end if;
  end if;
  select * into p from public.products where id=identifier for update;
  if found and p.version<>expected or not found and (action<>'product_save' or expected<>0) then raise exception 'STORE_CONFLICT'; end if;
  if action='product_save' then
   paths:=payload->'image_paths';
   if length(btrim(coalesce(payload->>'name',''))) not between 1 and 200 or length(coalesce(payload->>'description',''))>5000
    or length(coalesce(payload->>'brand',''))>100 or length(coalesce(payload->>'sku',''))>80
    or coalesce(payload->>'category','') not in('minipcs','security-cameras')
    or jsonb_typeof(payload->'price') is distinct from 'number' or (payload->>'price')::numeric not between 0 and 1000000
    or (payload->>'price')::numeric<>round((payload->>'price')::numeric,2)
    or coalesce(payload->>'low_stock_threshold','') !~ '^[0-9]{1,6}$'
    or jsonb_typeof(payload->'active') is distinct from 'boolean'
    or jsonb_typeof(payload->'features') is distinct from 'array' or jsonb_array_length(payload->'features')>20
    or jsonb_typeof(paths) is distinct from 'array' or jsonb_array_length(paths)>8 then raise exception 'STORE_INVALID'; end if;
   for item in select value from jsonb_array_elements(payload->'features') loop
    if jsonb_typeof(item)<>'string' or length(item#>>'{}') not between 1 and 200 then raise exception 'STORE_INVALID'; end if;
   end loop;
   for item in select value from jsonb_array_elements(paths) loop
    path:=item#>>'{}';
    if jsonb_typeof(item)<>'string' or not exists(select 1 from storage.objects where bucket_id='store-products' and name=path) then raise exception 'STORE_INVALID_IMAGE'; end if;
   end loop;
   if (payload->>'active')::boolean and (jsonb_array_length(paths)=0 or length(btrim(coalesce(payload->>'description','')))<20 or p.archived_at is not null) then raise exception 'STORE_INVALID_PUBLISH'; end if;
   if expected=0 then
    if coalesce(payload->>'stock','') !~ '^[0-9]{1,6}$' then raise exception 'STORE_INVALID'; end if;
    initial:=(payload->>'stock')::integer;
    insert into public.products(id,name,category,price,stock) values(identifier,btrim(payload->>'name'),payload->>'category',(payload->>'price')::numeric,initial);
    insert into afcr_private.store_stock_movements(product_id,actor_id,delta,available_after,reason) values(identifier,uid,initial,initial,'initial_stock');
   end if;
   update public.products set name=btrim(payload->>'name'),brand=nullif(btrim(payload->>'brand'),''),sku=nullif(btrim(payload->>'sku'),''),
    category=payload->>'category',description=payload->>'description',features=payload->'features',price=(payload->>'price')::numeric,
    low_stock_threshold=(payload->>'low_stock_threshold')::integer,image_paths=paths,
    image_url=case when jsonb_array_length(paths)>0 then 'https://zuqxtogggkundznzwulg.supabase.co/storage/v1/object/public/store-products/'||(paths->>0) end,
    active=(payload->>'active')::boolean,version=version+1,updated_at=now() where id=identifier returning to_jsonb(products.*) into changed;
  elsif action='product_archive' then
   if jsonb_typeof(payload->'archived') is distinct from 'boolean' then raise exception 'STORE_INVALID'; end if;
   update public.products set archived_at=case when (payload->>'archived')::boolean then now() end,active=false,version=version+1,updated_at=now()
   where id=identifier returning to_jsonb(products.*) into changed;
  else
   delta:=(payload->>'delta')::integer;note:=btrim(payload->>'reason');
   if delta is null or delta=0 or abs(delta)>999999 or length(coalesce(note,'')) not between 3 and 250 or p.stock+delta not between 0 and 999999 then raise exception 'STORE_INVALID_STOCK'; end if;
   update public.products set stock=stock+delta,version=version+1,updated_at=now() where id=identifier returning stock into remaining;
   insert into afcr_private.store_stock_movements(product_id,actor_id,delta,available_after,reason,request_id,request_hash) values(identifier,uid,delta,remaining,note,req,md5(payload::text));
   changed:=jsonb_build_object('id',identifier,'stock',remaining);
  end if;
 elsif action='order_update' then
  identifier:=(payload->>'id')::uuid;expected:=(payload->>'version')::bigint;
  select * into o from public.orders where id=identifier for update;
  if not found or expected is null or o.version<>expected then raise exception 'STORE_CONFLICT'; end if;
  new_status:=payload->>'status';pay:=payload->>'payment_status';note:=coalesce(payload->>'admin_note','');
  if new_status is null or pay is null or length(note)>2000 or length(coalesce(payload->>'tracking_reference',''))>200 or length(coalesce(payload->>'payment_reference',''))>200 then raise exception 'STORE_INVALID'; end if;
  if new_status<>o.status and not (
   o.status='pending' and new_status in('processing','cancelled') or
   o.status='processing' and new_status in('dispatched','ready_pickup','cancelled') or
   o.status in('dispatched','ready_pickup') and new_status='completed' or
   o.status='ready_pickup' and new_status='cancelled' or
   o.status='completed' and new_status='returned') then raise exception 'STORE_INVALID_TRANSITION'; end if;
  if new_status='dispatched' and o.shipping_address->>'shippingMethod'<>'lima_delivery'
   or new_status='ready_pickup' and o.shipping_address->>'shippingMethod'<>'urbano_pickup' then raise exception 'STORE_INVALID_TRANSITION'; end if;
  fee:=(payload->>'shipping_cost')::numeric;
  if fee is not null and (fee not between 0 and 1000000 or fee<>round(fee,2)) then raise exception 'STORE_INVALID'; end if;
  if pay<>o.payment_status and not(o.payment_status='pending' and pay='paid' and new_status not in('cancelled','returned')
   or o.payment_status='paid' and pay='refunded' and new_status in('cancelled','returned')) then raise exception 'STORE_INVALID_PAYMENT'; end if;
  -- Culqi cobra solo productos: el envío se fija después y la referencia del cargo no se edita.
  culqi:=o.payment_provider is not distinct from 'culqi';
  if pay='paid' and not culqi and (fee is null or length(btrim(coalesce(payload->>'payment_reference','')))<3) then raise exception 'STORE_INVALID_PAYMENT'; end if;
  if o.payment_status in('paid','refunded') and not culqi and fee is distinct from o.shipping_cost then raise exception 'STORE_INVALID_PAYMENT'; end if;
  if pay='paid' and o.payment_status='pending' and exists(select 1 from afcr_private.store_payments s where s.order_id=o.id and s.status in('processing','uncertain')) then raise exception 'STORE_PAYMENT_IN_PROGRESS'; end if;
  if pay='refunded' and length(btrim(note))<3 then raise exception 'STORE_INVALID_PAYMENT'; end if;
  if new_status in('dispatched','ready_pickup','completed') and pay<>'paid' then raise exception 'STORE_INVALID_PAYMENT'; end if;
  if new_status<>o.status and new_status in('cancelled','returned') and length(btrim(note))<3 then raise exception 'STORE_INVALID'; end if;
  reservation:=o.stock_reserved;
  if new_status<>o.status and new_status in('cancelled','returned') and reservation then
   -- Locks de productos en el mismo orden que checkout.
   perform 1 from public.products where id in(select product_id from public.order_items where order_id=o.id) order by id for update;
   for item in select to_jsonb(i) from public.order_items i where order_id=o.id order by product_id loop
    update public.products set stock=stock+(item->>'quantity')::integer,version=version+1,updated_at=now() where id=(item->>'product_id')::uuid returning stock into remaining;
    insert into afcr_private.store_stock_movements(product_id,order_id,actor_id,delta,available_after,reason)
    values((item->>'product_id')::uuid,o.id,uid,(item->>'quantity')::integer,remaining,case when new_status='returned' then 'order_returned' else 'order_cancelled' end);
   end loop;
   reservation:=false;
  end if;
  update public.orders set status=new_status,payment_status=pay,shipping_cost=fee,payment_reference=case when culqi then o.payment_reference else nullif(btrim(payload->>'payment_reference'),'') end,
   payment_provider=case when not culqi and pay='paid' and o.payment_status<>'paid' then 'manual' else o.payment_provider end,
   paid_at=case when pay='paid' and o.payment_status<>'paid' then now() else o.paid_at end,refunded_at=case when pay='refunded' and o.payment_status<>'refunded' then now() else o.refunded_at end,tracking_reference=nullif(btrim(payload->>'tracking_reference'),''),admin_note=note,stock_reserved=reservation,updated_at=now(),version=version+1
  where id=o.id returning jsonb_build_object('id',id,'version',version) into changed;
 elsif action='pickup_save' then
  if coalesce(payload->>'id','') !~ '^[a-z0-9-]{1,80}$' or length(btrim(coalesce(payload->>'name',''))) not between 1 and 200
   or length(btrim(coalesce(payload->>'street',''))) not between 1 and 250 or length(btrim(coalesce(payload->>'reference',''))) not between 1 and 250
   or length(btrim(coalesce(payload->>'hours',''))) not between 1 and 200 or jsonb_typeof(payload->'active') is distinct from 'boolean'
   or not exists(select 1 from afcr_private.store_locations where ubigeo=payload->>'ubigeo' and left(ubigeo,4) not in('1501','0701')) then raise exception 'STORE_INVALID_PICKUP'; end if;
  expected:=(payload->>'version')::bigint;select * into point from afcr_private.urbano_pickup_points where id=payload->>'id' for update;
  if expected is null or found and point.version<>expected or not found and expected<>0 then raise exception 'STORE_CONFLICT'; end if;
  insert into afcr_private.urbano_pickup_points(id,name,street,reference,hours,ubigeo,active)
  values(payload->>'id',btrim(payload->>'name'),btrim(payload->>'street'),btrim(payload->>'reference'),btrim(payload->>'hours'),payload->>'ubigeo',(payload->>'active')::boolean)
  on conflict(id) do update set name=excluded.name,street=excluded.street,reference=excluded.reference,hours=excluded.hours,ubigeo=excluded.ubigeo,active=excluded.active,version=afcr_private.urbano_pickup_points.version+1;
  changed:=jsonb_build_object('id',payload->>'id');
 else raise exception 'STORE_INVALID'; end if;
 insert into afcr_private.store_admin_events(actor_id,action,entity_id,details)
 values(uid,action,coalesce(identifier::text,payload->>'id'),case when action='stock_adjust' then jsonb_build_object('delta',delta,'reason',note) when action='order_update' then jsonb_build_object('status',new_status,'payment_status',pay,'note',note,'from_status',o.status,'from_payment_status',o.payment_status,'shipping_cost',fee,'payment_reference',payload->>'payment_reference') else jsonb_build_object('name',payload->>'name') end);
 return changed;
exception when invalid_text_representation or numeric_value_out_of_range or check_violation or not_null_violation then raise exception 'STORE_INVALID';
 when unique_violation then raise exception 'STORE_DUPLICATE';
end $$;
