import type { Metadata } from 'next';
import { AuthCallback } from '@/components/auth/AuthCallback';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { authCopy } from '@/content/auth';

export const metadata: Metadata = { title: authCopy.signIn.title, robots: { index: false, follow: false } };
export default function CallbackPage() {
  return <AuthPageLayout title={authCopy.signIn.title} lede={authCopy.signIn.lede}><AuthCallback /></AuthPageLayout>;
}
