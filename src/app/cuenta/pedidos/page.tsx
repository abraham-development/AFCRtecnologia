import { OrdersPanel } from '@/components/store/OrdersPanel';
import { checkoutCopy } from '@/content/store';
export const metadata={title:checkoutCopy.ordersTitle,robots:{index:false,follow:false}};
export default function Page(){return <OrdersPanel/>;}
