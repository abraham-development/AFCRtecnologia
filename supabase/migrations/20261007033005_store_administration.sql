-- Administración ligada a una identidad verificada; no se confía en metadatos del usuario.
create table afcr_private.store_admins (
 email text primary key check(email=lower(email)), user_id uuid unique references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table afcr_private.store_admins enable row level security;
revoke all on afcr_private.store_admins from public,anon,authenticated;
grant all on afcr_private.store_admins to service_role;
create policy admins_service on afcr_private.store_admins to service_role using(true) with check(true);
insert into afcr_private.store_admins(email,user_id)
values('time45120@gmail.com',(select id from auth.users where lower(email)='time45120@gmail.com' and email_confirmed_at is not null));

create function afcr_private.bind_store_administrator() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.email_confirmed_at is not null then
  update afcr_private.store_admins set user_id=new.id where email=lower(new.email) and user_id is null;
 end if;
 return new;
end $$;
revoke all on function afcr_private.bind_store_administrator() from public,anon,authenticated;
create trigger bind_store_administrator after insert or update of email,email_confirmed_at on auth.users
for each row execute function afcr_private.bind_store_administrator();

create function afcr_private.store_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and afcr_private.store_session_valid() and exists(
 select 1 from afcr_private.store_admins a join auth.users u on u.id=a.user_id
 where a.user_id=(select auth.uid()) and lower(u.email)=a.email and u.email_confirmed_at is not null);
$$;
revoke all on function afcr_private.store_is_admin() from public,anon,authenticated;
grant execute on function afcr_private.store_is_admin() to authenticated;
create function public.store_is_admin() returns boolean language sql stable security invoker set search_path='' as $$select afcr_private.store_is_admin();$$;
revoke all on function public.store_is_admin() from public,anon,authenticated;
grant execute on function public.store_is_admin() to authenticated;
create policy products_admin_read on public.products for select to authenticated using((select public.store_is_admin()));

alter table public.products add column sku text unique,
 add column low_stock_threshold integer not null default 3 check(low_stock_threshold between 0 and 999999),
 add column image_paths jsonb not null default '[]' check(jsonb_typeof(image_paths)='array' and jsonb_array_length(image_paths)<=8),
 add column archived_at timestamptz,
 add column updated_at timestamptz not null default now(),
 add column version bigint not null default 1;
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check(status in('pending','processing','dispatched','ready_pickup','completed','cancelled','returned')),
 add column payment_status text not null default 'pending' check(payment_status in('pending','paid','refunded')),
 add column payment_reference text,
 add column paid_at timestamptz,
 add column refunded_at timestamptz,
 add column tracking_reference text,
 add column admin_note text not null default '',
 add column stock_reserved boolean not null default false,
 add column updated_at timestamptz not null default now(),
 add column version bigint not null default 1;
revoke select on public.orders from authenticated;
grant select(id,user_id,status,total,shipping_address,shipping_cost,request_id,request_hash,created_at,payment_status,payment_reference,paid_at,refunded_at,tracking_reference,stock_reserved,updated_at,version) on public.orders to authenticated;
alter table afcr_private.urbano_pickup_points add column version bigint not null default 1;
create index orders_status_created_idx on public.orders(status,created_at desc);
create table afcr_private.store_admin_events(
 id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id) on delete set null,
 action text not null,entity_id text not null,details jsonb not null default '{}',created_at timestamptz not null default now()
);
create index admin_events_created_idx on afcr_private.store_admin_events(created_at desc);
create index admin_events_actor_idx on afcr_private.store_admin_events(actor_id);
create table afcr_private.store_stock_movements(
 id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),
 order_id uuid references public.orders(id) on delete set null,actor_id uuid references auth.users(id) on delete set null,
 delta integer not null,available_after integer not null check(available_after>=0),reason text not null,
 request_id uuid,request_hash text,created_at timestamptz not null default now(),unique(actor_id,request_id)
);
create index stock_movements_product_created_idx on afcr_private.store_stock_movements(product_id,created_at desc);
create index stock_movements_order_idx on afcr_private.store_stock_movements(order_id);
create index stock_movements_created_idx on afcr_private.store_stock_movements(created_at desc);
alter table afcr_private.store_admin_events enable row level security;
alter table afcr_private.store_stock_movements enable row level security;
revoke all on afcr_private.store_admin_events,afcr_private.store_stock_movements from public,anon,authenticated;
grant all on afcr_private.store_admin_events,afcr_private.store_stock_movements to service_role;
create policy events_service on afcr_private.store_admin_events to service_role using(true) with check(true);
create policy movements_service on afcr_private.store_stock_movements to service_role using(true) with check(true);

-- La reserva y la línea del pedido se crean en la misma transacción del checkout.
create function afcr_private.reserve_store_stock() returns trigger language plpgsql security definer set search_path='' as $$
declare remaining integer;
begin
 update public.products set stock=stock-new.quantity,version=version+1,updated_at=now()
 where id=new.product_id and stock>=new.quantity returning stock into remaining;
 if not found then raise exception 'STORE_STOCK'; end if;
 update public.orders set stock_reserved=true where id=new.order_id;
 insert into afcr_private.store_stock_movements(product_id,order_id,actor_id,delta,available_after,reason)
 values(new.product_id,new.order_id,auth.uid(),-new.quantity,remaining,'order_reserved');
 return new;
end $$;
revoke all on function afcr_private.reserve_store_stock() from public,anon,authenticated;
create trigger reserve_store_stock after insert on public.order_items for each row execute function afcr_private.reserve_store_stock();

-- Imágenes públicas de producto; solo un administrador vigente puede cargarlas.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('store-products','store-products',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy store_images_read on storage.objects for select to authenticated
using(bucket_id='store-products' and (select public.store_is_admin()));
create policy store_images_insert on storage.objects for insert to authenticated
with check(bucket_id='store-products' and (select public.store_is_admin()) and name ~ '^[a-f0-9-]+\.(jpg|png|webp)$');
create policy store_images_delete on storage.objects for delete to authenticated
using(bucket_id='store-products' and (select public.store_is_admin()) and not exists(select 1 from public.products p where p.image_paths ? storage.objects.name));

-- Catálogo público de recojo: datos publicados, sin perfiles ni permisos administrativos.
create function afcr_private.store_pickup_points() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'street',p.street,'reference',p.reference,'hours',p.hours,'ubigeo',p.ubigeo) order by p.name),'[]')
 from afcr_private.urbano_pickup_points p where p.active;
$$;
revoke all on function afcr_private.store_pickup_points() from public,anon,authenticated;
grant usage on schema afcr_private to anon;
grant execute on function afcr_private.store_pickup_points() to anon,authenticated;
create function public.store_pickup_points() returns jsonb language sql stable security invoker set search_path='' as $$select afcr_private.store_pickup_points();$$;
revoke all on function public.store_pickup_points() from public,anon,authenticated;
grant execute on function public.store_pickup_points() to anon,authenticated;

create function afcr_private.store_admin_read(section text,search text default '',page integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare rows jsonb; amount bigint; skip integer:=greatest(0,least(page,100000))*30; term text:=left(coalesce(search,''),100);
begin
 if not afcr_private.store_is_admin() then raise exception 'STORE_FORBIDDEN'; end if;
 if section='overview' then
  return jsonb_build_object(
   'active_products',(select count(*) from public.products where active and archived_at is null),
   'low_stock',(select count(*) from public.products where archived_at is null and stock<=low_stock_threshold),
   'pending_orders',(select count(*) from public.orders where status='pending'),
   'paid_30_days',(select coalesce(sum(total+coalesce(shipping_cost,0)),0) from public.orders where payment_status='paid' and status not in('cancelled','returned') and paid_at>=now()-interval '30 days'),
   'rows',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from(select id,name,sku,stock,low_stock_threshold,version,(select coalesce(sum(i.quantity),0) from public.order_items i join public.orders o on o.id=i.order_id where i.product_id=public.products.id and o.stock_reserved and o.status in('pending','processing','dispatched','ready_pickup')) as reserved from public.products where archived_at is null and stock<=low_stock_threshold order by stock,name limit 8)x));
 elsif section in('products','inventory') then
  select count(*) into amount from public.products where name ilike '%'||term||'%' or coalesce(sku,'') ilike '%'||term||'%';
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(select p.*,
   (select coalesce(sum(i.quantity),0) from public.order_items i join public.orders o on o.id=i.order_id where i.product_id=p.id and o.stock_reserved and o.status in('pending','processing','dispatched','ready_pickup')) as reserved
   from public.products p where name ilike '%'||term||'%' or coalesce(sku,'') ilike '%'||term||'%' order by archived_at nulls first,created_at desc,id limit 30 offset skip)x;
 elsif section='orders' then
  select count(*) into amount from public.orders where id::text ilike '%'||term||'%' or shipping_address->>'names' ilike '%'||term||'%' or shipping_address->>'surnames' ilike '%'||term||'%' or status=term or user_id::text=term;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(select o.*,
   (select coalesce(jsonb_agg(jsonb_build_object('product_id',i.product_id,'product_name',i.product_name,'quantity',i.quantity,'unit_price',i.unit_price)),'[]') from public.order_items i where i.order_id=o.id) as order_items
   from public.orders o where id::text ilike '%'||term||'%' or shipping_address->>'names' ilike '%'||term||'%' or shipping_address->>'surnames' ilike '%'||term||'%' or status=term or user_id::text=term order by created_at desc,id limit 30 offset skip)x;
 elsif section='customers' then
  select count(*) into amount from public.profiles where names ilike '%'||term||'%' or surnames ilike '%'||term||'%' or mobile ilike '%'||term||'%';
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(select p.user_id,p.names,p.surnames,p.mobile,
   (select count(*) from public.orders o where o.user_id=p.user_id) as order_count,
   (select max(created_at) from public.orders o where o.user_id=p.user_id) as last_order
   from public.profiles p where names ilike '%'||term||'%' or surnames ilike '%'||term||'%' or mobile ilike '%'||term||'%' order by updated_at desc,user_id limit 30 offset skip)x;
 elsif section='pickup' then
  select count(*) into amount from afcr_private.urbano_pickup_points where name ilike '%'||term||'%';
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(select p.*,l.department,l.province,l.district from afcr_private.urbano_pickup_points p join afcr_private.store_locations l using(ubigeo) where name ilike '%'||term||'%' order by name,id limit 30 offset skip)x;
 elsif section='activity' then
  select count(*) into amount from afcr_private.store_admin_events where action ilike '%'||term||'%';
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(select * from afcr_private.store_admin_events where action ilike '%'||term||'%' order by created_at desc,id limit 30 offset skip)x;
 elsif section='movements' then
  select count(*) into amount from afcr_private.store_stock_movements;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(select m.*,p.name as product_name from afcr_private.store_stock_movements m join public.products p on p.id=m.product_id order by m.created_at desc,m.id limit 30 offset skip)x;
 else raise exception 'STORE_INVALID'; end if;
 return jsonb_build_object('rows',rows,'count',amount,'page',page);
end $$;
revoke all on function afcr_private.store_admin_read(text,text,integer) from public,anon,authenticated;
grant execute on function afcr_private.store_admin_read(text,text,integer) to authenticated;
create function public.store_admin_read(section text,search text default '',page integer default 0) returns jsonb language sql stable security invoker set search_path='' as $$select afcr_private.store_admin_read(section,search,page);$$;
revoke all on function public.store_admin_read(text,text,integer) from public,anon,authenticated;
grant execute on function public.store_admin_read(text,text,integer) to authenticated;

create function afcr_private.store_admin_mutate(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); p public.products%rowtype; o public.orders%rowtype; point afcr_private.urbano_pickup_points%rowtype;
 identifier uuid; expected bigint; initial integer; delta integer; remaining integer; req uuid; replay afcr_private.store_stock_movements%rowtype;
 paths jsonb; item jsonb; new_status text; pay text; fee numeric; note text; changed jsonb; path text; reservation boolean;
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
  if pay='paid' and (fee is null or length(btrim(coalesce(payload->>'payment_reference','')))<3) then raise exception 'STORE_INVALID_PAYMENT'; end if;
  if o.payment_status in('paid','refunded') and fee is distinct from o.shipping_cost then raise exception 'STORE_INVALID_PAYMENT'; end if;
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
  update public.orders set status=new_status,payment_status=pay,shipping_cost=fee,payment_reference=nullif(btrim(payload->>'payment_reference'),''),
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
revoke all on function afcr_private.store_admin_mutate(text,jsonb) from public,anon,authenticated;
grant execute on function afcr_private.store_admin_mutate(text,jsonb) to authenticated;
create function public.store_admin_mutate(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select afcr_private.store_admin_mutate(action,payload);$$;
revoke all on function public.store_admin_mutate(text,jsonb) from public,anon,authenticated;
grant execute on function public.store_admin_mutate(text,jsonb) to authenticated;
