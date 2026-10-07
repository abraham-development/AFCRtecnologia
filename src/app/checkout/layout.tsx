import type { ReactNode } from 'react';
import { checkoutCopy } from '@/content/store';
export const metadata={title:checkoutCopy.title,robots:{index:false,follow:false}};
export default function Layout({children}:{children:ReactNode}){return children;}
