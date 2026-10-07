import type { Metadata } from 'next';
import { StoreCatalog } from '@/components/store/StoreCatalog';
import { storeCopy } from '@/content/store';
export const metadata:Metadata={title:storeCopy.title,description:storeCopy.lede,alternates:{canonical:'/tienda'}};
export default function StorePage(){return <StoreCatalog/>;}
