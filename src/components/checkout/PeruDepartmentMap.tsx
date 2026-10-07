'use client';
import { pickupDepartments } from '@/lib/peru-ubigeo';
import { checkoutCopy as copy } from '@/content/store';
import { Field,Select } from '@/components/store/StoreUI';
/** Selector accesible de departamentos; no simula un mapa geográfico. */
export function PeruDepartmentMap({value,onChange}:{value:string;onChange:(value:string)=>void}) {return <Field id="department" label={copy.department}><Select id="department" value={value} onChange={event=>onChange(event.target.value)} required><option value="">{copy.selectDepartment}</option>{pickupDepartments.map(department=><option key={department.code} value={department.code}>{department.name}</option>)}</Select></Field>;}
