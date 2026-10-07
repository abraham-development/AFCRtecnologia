import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { authCopy } from '@/content/auth';

export const metadata: Metadata = { title: authCopy.recovery.title, robots: { index: false, follow: false } };
export default function RecoveryPage() {
  return <AuthPageLayout title={authCopy.recovery.title} lede={authCopy.recovery.lede}><AuthForm mode="recovery" /></AuthPageLayout>;
}
