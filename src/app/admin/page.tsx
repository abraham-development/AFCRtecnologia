import { AdminPanel } from '@/components/admin/AdminPanel';
import { adminCopy } from '@/content/admin';
export const metadata={title:adminCopy.title,robots:{index:false,follow:false}};
export default function Page(){return <AdminPanel/>;}
