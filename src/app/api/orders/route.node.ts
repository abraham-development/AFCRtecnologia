import { createClient } from '@supabase/supabase-js';
import { orderSchema,normalizeShipping } from '@/lib/store/order-validation';
import type { UrbanoPickupPoint } from '@/data/urbano-pickup-points';
export const runtime='nodejs';
export async function POST(request:Request) {
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return Response.json({error:'UNAUTHORIZED'},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url || !key)return Response.json({error:'UNAVAILABLE'},{status:503});
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
 try {
  const {data,error}=await client.auth.getUser(token);
  if(error || !data.user?.email_confirmed_at)return Response.json({error:'UNAUTHORIZED'},{status:401});
  const text=await request.text();if(text.length>32768)return Response.json({error:'INVALID_ORDER'},{status:400});
  let body:unknown;try{body=JSON.parse(text);}catch{return Response.json({error:'INVALID_ORDER'},{status:400});}
  const parsed=orderSchema.safeParse(body);if(!parsed.success)return Response.json({error:'INVALID_ORDER'},{status:400});
  let point:UrbanoPickupPoint|undefined;
  if(parsed.data.shipping_address.shippingMethod==='urbano_pickup'){
   const {data:points,error}=await client.rpc('store_pickup_points');
   if(error)return Response.json({error:'UNAVAILABLE'},{status:503});
   point=(Array.isArray(points)?points:[]).find((p:UrbanoPickupPoint)=>p.id===parsed.data.shipping_address.pickupPointId);
  }
  const shipping=normalizeShipping(parsed.data.shipping_address,point);if(!shipping)return Response.json({error:'INVALID_ADDRESS'},{status:400});
  const result=await client.rpc('store_place_order',{payload:{...parsed.data,shipping_address:shipping}});
  if(result.error){const message=result.error.message;const unauthorized=message.includes('STORE_SESSION');const changed=message.includes('STORE_PRICE')||message.includes('STORE_STOCK');const invalid=message.includes('STORE_INVALID');return Response.json({error:unauthorized?'UNAUTHORIZED':changed?'PRODUCT_CHANGED':invalid?'INVALID_ORDER':'UNAVAILABLE'},{status:unauthorized?401:changed?409:invalid?400:503});}
  return Response.json({order:result.data},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'UNAVAILABLE'},{status:503});}
}
