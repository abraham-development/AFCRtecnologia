import { CartPage } from '@/components/store/CartPage';
import { storeCopy } from '@/content/store';
export const metadata={title:storeCopy.cartTitle,robots:{index:false,follow:false}};
export default function Page(){return <CartPage/>;}
