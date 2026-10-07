import rows from '@/data/peru-locations.json';
export interface PeruLocation { ubigeo:string; department:string; province:string; district:string; country:'Perú'; }
const locations:PeruLocation[] = rows.map(([ubigeo,department,province,district])=>({ubigeo,department,province,district,country:'Perú'}));
const lookup = new Map(locations.map(location=>[location.ubigeo,location]));
export function resolvePeruLocation(ubigeo:string) { return lookup.get(ubigeo); }
export const peruLocations = locations;
export function isLimaMetropolitanaDistrict(ubigeo:string) { return lookup.has(ubigeo) && (ubigeo.startsWith('1501') || ubigeo.startsWith('0701')); }
export const limaDistricts = locations.filter(location=>isLimaMetropolitanaDistrict(location.ubigeo)).sort((a,b)=>a.district.localeCompare(b.district,'es'));
export const pickupDepartments = [...new Map(locations.map(location=>[location.ubigeo.slice(0,2),{code:location.ubigeo.slice(0,2),name:location.department}])).values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
