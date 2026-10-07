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
  return jsonb_build_object('id',existing.id,'status',existing.status,'total',existing.total,'shipping_address',existing.shipping_address,'created_at',existing.created_at,'order_items',(select coalesce(jsonb_agg(jsonb_build_object('product_id',i.product_id,'product_name',i.product_name,'quantity',i.quantity,'unit_price',i.unit_price)),'[]'::jsonb) from public.order_items i where i.order_id=existing.id));
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
 return jsonb_build_object('id',new_order_id,'status','pending','total',sum_total,'shipping_address',normalized,'created_at',now(),'order_items',(select coalesce(jsonb_agg(jsonb_build_object('product_id',i.product_id,'product_name',i.product_name,'quantity',i.quantity,'unit_price',i.unit_price)),'[]'::jsonb) from public.order_items i where i.order_id=new_order_id));
exception when invalid_text_representation or numeric_value_out_of_range then raise exception 'STORE_INVALID';
end;
$$;
