import { z } from 'zod';
import type { UrbanoPickupPoint } from '@/data/urbano-pickup-points';
import { resolvePeruLocation,isLimaMetropolitanaDistrict } from '@/lib/peru-ubigeo';
import type { ShippingAddress } from './types';
const text=z.string().trim().min(1).max(100);
export const orderSchema=z.object({items:z.array(z.object({product_id:z.uuid(),quantity:z.number().int().min(1).max(99),unit_price:z.number().finite().min(0).max(1000000)})).min(1).max(50),shipping_address:z.object({names:text,surnames:text,mobile:z.string().regex(/^9[0-9]{8}$/),shippingMethod:z.enum(['lima_delivery','urbano_pickup']),street:z.string().trim().max(250).optional(),reference:z.string().trim().max(250).optional(),ubigeo:z.string().optional(),pickupPointId:z.string().max(100).optional(),department:z.string().optional(),province:z.string().optional(),district:z.string().optional(),country:z.string().optional(),pickupPointName:z.string().optional()}),total:z.number().finite().min(0).max(100000000),request_id:z.uuid()});
export function normalizeShipping(input:z.infer<typeof orderSchema>['shipping_address'],point?:UrbanoPickupPoint):ShippingAddress|null { const common={names:input.names,surnames:input.surnames,mobile:input.mobile,shippingMethod:input.shippingMethod};
 if(input.shippingMethod==='lima_delivery'){const location=resolvePeruLocation(input.ubigeo??'');if(!location || !isLimaMetropolitanaDistrict(location.ubigeo) || !input.street?.trim() || !input.reference?.trim())return null;return {...common,...location,street:input.street.trim(),reference:input.reference.trim()};}
 const location=point && resolvePeruLocation(point.ubigeo);if(!point || point.id!==input.pickupPointId || !location || isLimaMetropolitanaDistrict(point.ubigeo))return null;return {...common,...location,street:point.street,reference:point.reference,pickupPointId:point.id,pickupPointName:point.name};
}
