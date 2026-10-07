import type { Metadata } from 'next';
import { AccountPanel } from '@/components/auth/AccountPanel';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { authCopy } from '@/content/auth';

export const metadata: Metadata = { title: authCopy.account.title, robots: { index: false, follow: false } };
export default function AccountPage() {
  return <AuthPageLayout title={authCopy.account.title} lede={authCopy.account.lede}><AccountPanel /></AuthPageLayout>;
}
