import type { Product,Order } from '@/lib/store/types';
import type { UrbanoPickupPoint } from '@/data/urbano-pickup-points';
export type AdminSection='overview'|'products'|'inventory'|'orders'|'customers'|'pickup'|'activity'|'movements';
export interface AdminProduct extends Product {sku:string|null;low_stock_threshold:number;image_paths:string[];active:boolean;archived_at:string|null;updated_at:string;version:number;reserved:number;}
export interface AdminOrder extends Order {payment_status:'pending'|'paid'|'refunded';shipping_cost:number|null;payment_reference:string|null;tracking_reference:string|null;admin_note:string;version:number;stock_reserved:boolean;}
export interface AdminPoint extends UrbanoPickupPoint {active:boolean;version:number;department?:string;province?:string;district?:string;}
export interface AdminCustomer {user_id:string;names:string;surnames:string;mobile:string;order_count:number;last_order:string|null;}
export interface AdminEvent {id:string;action:string;entity_id:string;details:Record<string,unknown>;created_at:string;}
export interface StockMovement {id:string;product_name:string;delta:number;available_after:number;reason:string;created_at:string;order_id:string|null;}
export interface AdminResult<T> {rows:T[];count:number;page:number;active_products?:number;low_stock?:number;pending_orders?:number;paid_30_days?:number;}
