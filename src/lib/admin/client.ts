import { getAuthClient } from '@/lib/auth/client';
import { adminCopy } from '@/content/admin';
import type { AdminSection,AdminResult } from './types';
export function adminError(issue:unknown) {
 const message=issue&&typeof issue==='object'&&'message' in issue?String(issue.message):'';
 const code=Object.keys(adminCopy.errors).find(code=>message.includes(code)) as keyof typeof adminCopy.errors|undefined;
 return code?adminCopy.errors[code]:adminCopy.loadError;
}
export async function adminRead<T>(section:AdminSection,search='',page=0):Promise<AdminResult<T>> {
 const {data,error}=await getAuthClient().rpc('store_admin_read',{section,search,page});
 if(error)throw error;
 return data as AdminResult<T>;
}
export async function adminMutate(action:string,payload:Record<string,unknown>) {
 const {data,error}=await getAuthClient().rpc('store_admin_mutate',{action,payload});
 if(error)throw error;return data;
}
export function formatAdminDate(date:string|null) {return date?new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Lima'}).format(new Date(date)):'—';}
export function orderStatus(status:string) {return adminCopy.statuses[status as keyof typeof adminCopy.statuses]??status;}
