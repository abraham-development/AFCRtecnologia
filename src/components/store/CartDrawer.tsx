'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useCart } from '@/lib/store/cart';
import { cartTotal,formatPrice } from '@/lib/store/price';
import { storeCopy as copy } from '@/content/store';
import { CartLines } from './CartLines';
import { EmptyCart } from './EmptyCart';
import { BUTTON } from './StoreUI';
export function CartDrawer({open,onClose}:{open:boolean;onClose:()=>void}) { const ref=useRef<HTMLDialogElement>(null);const items=useCart(state=>state.items);useEffect(()=>{const dialog=ref.current;if(open){dialog?.showModal();window.__afcrLenis?.stop?.();}else dialog?.close();return()=>{window.__afcrLenis?.start?.();};},[open]);return <dialog ref={ref} onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}} aria-labelledby="drawer-title" className="fixed inset-y-0 left-auto right-0 m-0 h-svh max-h-svh w-full max-w-md overflow-y-auto border-l border-border-editorial bg-bg-primary p-0 text-text-primary backdrop:bg-black/70" data-lenis-prevent><div className="p-5 sm:p-8"><header className="mb-8 flex items-center justify-between gap-4 border-b border-border-editorial pb-5"><h2 id="drawer-title" className="text-2xl font-medium">{copy.cart}</h2><button onClick={onClose} aria-label={copy.close} className="flex h-12 w-12 items-center justify-center hover:text-accent-cyan"><X size={23} aria-hidden="true"/></button></header>{items.length?<><CartLines/><div className="mt-5 border-t border-border-editorial pt-6"><div className="flex justify-between gap-4 font-medium"><span>{copy.subtotal}</span><span>{formatPrice(cartTotal(items))}</span></div><p className="mt-3 text-sm text-text-secondary">{copy.shippingNote}</p><Link href="/checkout" onClick={onClose} className={`${BUTTON} mt-6 bg-accent-cyan text-bg-darkest hover:bg-accent-cyan/90`}>{copy.checkout}</Link><Link href="/carrito" onClick={onClose} className={`${BUTTON} mt-3 border border-border-editorial`}>{copy.cartTitle}</Link></div></>:<EmptyCart/>}</div></dialog>; }
