import type { Metadata } from 'next';

import { AuthForm } from '@/components/auth/AuthForm';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { authCopy } from '@/content/auth';
import { pageIntros } from '@/content/pages';

const intro = pageIntros.signUp;

export const metadata: Metadata = {
  title: intro.metaTitle,
  description: intro.metaDescription,
  alternates: { canonical: '/crear-cuenta' },
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return <AuthPageLayout title={authCopy.signUp.title} lede={authCopy.signUp.lede}><AuthForm mode="signUp" /></AuthPageLayout>;
}
