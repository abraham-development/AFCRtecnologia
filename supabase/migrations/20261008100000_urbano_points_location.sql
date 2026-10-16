-- Ubicación exacta y horario real de los puntos Urbano, para el mapa de calles del checkout.
alter table afcr_private.urbano_pickup_points
 add column lat numeric(9,6) check(lat between -18.6 and 0.2),
 add column lng numeric(9,6) check(lng between -81.5 and -68.5),
 add column schedule jsonb check(schedule is null or jsonb_typeof(schedule)='object'),
 add column urbano_code text,
 add constraint urbano_pickup_points_coords check((lat is null)=(lng is null));

create or replace function afcr_private.store_pickup_points() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'street',p.street,'reference',p.reference,'hours',p.hours,'ubigeo',p.ubigeo,
  'lat',p.lat,'lng',p.lng,'schedule',p.schedule) order by p.name),'[]')
 from afcr_private.urbano_pickup_points p where p.active;
$$;

-- El panel puede corregir la posición de un punto; el horario estructurado solo lo escribe la sincronización.
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
  -- Coordenadas opcionales: si llegan, ambas y dentro del Perú; si no llegan, se conservan las sincronizadas.
  if (payload ? 'lat' or payload ? 'lng') and not (jsonb_typeof(payload->'lat')='number' and jsonb_typeof(payload->'lng')='number'
   and (payload->>'lat')::numeric between -18.6 and 0.2 and (payload->>'lng')::numeric between -81.5 and -68.5
   or jsonb_typeof(payload->'lat')='null' and jsonb_typeof(payload->'lng')='null') then raise exception 'STORE_INVALID_PICKUP'; end if;
  expected:=(payload->>'version')::bigint;select * into point from afcr_private.urbano_pickup_points where id=payload->>'id' for update;
  if expected is null or found and point.version<>expected or not found and expected<>0 then raise exception 'STORE_CONFLICT'; end if;
  insert into afcr_private.urbano_pickup_points(id,name,street,reference,hours,ubigeo,active,lat,lng)
  values(payload->>'id',btrim(payload->>'name'),btrim(payload->>'street'),btrim(payload->>'reference'),btrim(payload->>'hours'),payload->>'ubigeo',(payload->>'active')::boolean,
   (payload->>'lat')::numeric,(payload->>'lng')::numeric)
  on conflict(id) do update set name=excluded.name,street=excluded.street,reference=excluded.reference,hours=excluded.hours,ubigeo=excluded.ubigeo,active=excluded.active,
   lat=case when payload ? 'lat' then excluded.lat else afcr_private.urbano_pickup_points.lat end,
   lng=case when payload ? 'lng' then excluded.lng else afcr_private.urbano_pickup_points.lng end,
   version=afcr_private.urbano_pickup_points.version+1;
  changed:=jsonb_build_object('id',payload->>'id');
 else raise exception 'STORE_INVALID'; end if;
 insert into afcr_private.store_admin_events(actor_id,action,entity_id,details)
 values(uid,action,coalesce(identifier::text,payload->>'id'),case when action='stock_adjust' then jsonb_build_object('delta',delta,'reason',note) when action='order_update' then jsonb_build_object('status',new_status,'payment_status',pay,'note',note,'from_status',o.status,'from_payment_status',o.payment_status,'shipping_cost',fee,'payment_reference',payload->>'payment_reference') else jsonb_build_object('name',payload->>'name') end);
 return changed;
exception when invalid_text_representation or numeric_value_out_of_range or check_violation or not_null_violation then raise exception 'STORE_INVALID';
 when unique_violation then raise exception 'STORE_DUPLICATE';
end $$;
