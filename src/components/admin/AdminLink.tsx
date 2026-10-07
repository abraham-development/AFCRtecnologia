'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { getAuthClient } from '@/lib/auth/client';
import { adminCopy } from '@/content/admin';
export function AdminLink({userId}:{userId:string}) {
 const [allowed,setAllowed]=useState('');
 useEffect(()=>{let active=true;getAuthClient().rpc('store_is_admin').then(({data,error})=>{if(active)setAllowed(!error&&data?userId:'');});return()=>{active=false;};},[userId]);
 return allowed===userId?<Link href="/admin" className="mt-4 inline-flex min-h-12 items-center text-accent-cyan underline-offset-4 hover:underline">{adminCopy.title}</Link>:null;
}
