import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { storeCopy as copy } from '@/content/store';
import { BUTTON } from './StoreUI';
export function EmptyCart(){return <div className="border border-border-editorial px-5 py-14 text-center sm:px-10"><ShoppingBag size={40} strokeWidth={1} className="mx-auto text-accent-cyan" aria-hidden="true"/><h2 className="mt-6 text-2xl font-medium">{copy.emptyCart}</h2><p className="mx-auto mt-3 max-w-prose text-text-secondary">{copy.emptyCartBody}</p><Link href="/tienda" className={`${BUTTON} mt-7 bg-accent-cyan text-bg-darkest hover:bg-accent-cyan/90`}>{copy.continueShopping}</Link></div>;}
