import { AuthForm } from '@/components/auth/AuthForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { authCopy } from '@/content/auth';
export const metadata={title:authCopy.verify.title,robots:{index:false,follow:false}};
export default function VerifyPage(){ return <AuthPageLayout title={authCopy.verify.title} lede={authCopy.verify.hint}><AuthForm mode="confirmation"/></AuthPageLayout>; }
