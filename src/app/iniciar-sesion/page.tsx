import type { Metadata } from 'next';

import { AuthForm } from '@/components/auth/AuthForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { authCopy } from '@/content/auth';
import { pageIntros } from '@/content/pages';

const intro = pageIntros.signIn;

export const metadata: Metadata = {
  title: intro.metaTitle,
  description: intro.metaDescription,
  alternates: { canonical: '/iniciar-sesion' },
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <AuthPageLayout title={authCopy.signIn.title} lede={authCopy.signIn.lede}><AuthForm mode="signIn" /></AuthPageLayout>;
}
