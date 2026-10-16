export interface PickupSchedule { weekdays: [string, string][]; saturday: [string, string][]; sunday: [string, string][] }
export type ShippingMode = 'terrestre' | 'aereo';
/**
 * Agencia de recojo publicada (hoy solo Shalom; los puntos Urbano quedan archivados para pedidos antiguos).
 * lat/lng son la ubicación exacta (null si no hay una válida) y shipping_price la tarifa de envío a esa agencia.
 */
export interface PickupPoint {
  id: string; name: string; street: string; reference: string; hours: string; ubigeo: string;
  lat?: number | null; lng?: number | null; schedule?: PickupSchedule | null;
  carrier?: 'shalom' | 'urbano'; shipping_price?: number | null; shipping_mode?: ShippingMode | null;
}
