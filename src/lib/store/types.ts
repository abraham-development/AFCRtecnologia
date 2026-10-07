export type ProductCategory = 'minipcs' | 'security-cameras';
export interface Product { id:string; name:string; brand:string|null; category:ProductCategory; description:string; features:string[]; image_url:string|null; price:number; stock:number; }
export interface CartItem { product:Product; quantity:number; }
export type ShippingMethod = 'lima_delivery' | 'urbano_pickup';
export interface Address { street:string; reference:string; department:string; province:string; district:string; ubigeo:string; country:'Perú'; }
export interface ShippingAddress extends Address { names:string; surnames:string; mobile:string; shippingMethod:ShippingMethod; pickupPointId?:string; pickupPointName?:string; }
export interface Order { id:string; status:string; total:number; created_at:string; shipping_address:ShippingAddress; shipping_cost?:number|null;payment_status?:string;tracking_reference?:string|null;order_items?:{ product_id:string; product_name:string; quantity:number; unit_price:number }[]; }
