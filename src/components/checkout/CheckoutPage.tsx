'use client';
import { useState } from 'react';
import type { Order } from '@/lib/store/types';
import Link from 'next/link';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useCartReady } from '@/lib/store/cart';
import { checkoutCopy as copy } from '@/content/store';
import { Spinner,Toast } from '@/components/store/StoreUI';
import { OrderSummary } from '@/components/store/OrderSummary';
import { CheckoutAuthGate } from './CheckoutAuthGate';
import { CheckoutStepper } from './CheckoutStepper';
export function CheckoutPage(){const {user,loading}=useAuthUser();const ready=useCartReady();const [expired,setExpired]=useState(false);const [receipt,setReceipt]=useState<Order|null>(null);if(loading||!ready)return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]"><Spinner label={copy.loading}/></div>;const account=user;return <section className="min-h-svh bg-[#0F172A] pb-20 pt-36 lg:pt-44"><div className="shell"><div className="border-b border-border-editorial pb-9"><h1 className="text-display-sm">{copy.title}</h1><p className="mt-5 max-w-2xl leading-relaxed text-text-secondary">{copy.lede}</p><Link href="/carrito" className="mt-4 inline-flex min-h-11 items-center text-sm text-accent-cyan underline-offset-4 hover:underline">{copy.editCart}</Link></div><div className="mt-8 mb-5"><Toast message={expired?copy.sessionExpired:''} error/></div><div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] xl:gap-12">{account&&!expired?<CheckoutStepper user={account} onConfirmed={setReceipt} onExpired={()=>{setExpired(true);}}/>:<CheckoutAuthGate onSuccess={()=>setExpired(false)}/>}<OrderSummary order={receipt}/></div></div></section>;}
