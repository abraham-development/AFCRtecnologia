'use client';
import Link from 'next/link';
import { useCart,useCartReady } from '@/lib/store/cart';
import { storeCopy as copy } from '@/content/store';
import { CartLines } from './CartLines';
import { EmptyCart } from './EmptyCart';
import { OrderSummary } from './OrderSummary';
import { BUTTON,Spinner } from './StoreUI';
export function CartPage(){const ready=useCartReady();const items=useCart(state=>state.items);if(!ready)return <Spinner label={copy.loading}/>;return <section className="shell pb-20 pt-36 lg:pt-44"><h1 className="text-display-sm">{copy.cartTitle}</h1><p className="mt-5 text-text-secondary">{copy.cartSaved}</p><div className="mt-10">{items.length?<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]"><div className="border border-border-editorial p-5 sm:p-8"><CartLines/><Link href="/checkout" className={`${BUTTON} mt-6 bg-[#2563EB] text-white hover:bg-blue-700`}>{copy.checkout}</Link><Link href="/tienda" className={`${BUTTON} mt-4 text-accent-cyan`}>{copy.continueShopping}</Link></div><OrderSummary/></div>:<EmptyCart/>}</div></section>;}
