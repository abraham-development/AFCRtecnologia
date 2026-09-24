import type { Metadata } from 'next';

import CtaBand from '@/components/layout/CtaBand';
import PageIntro from '@/components/layout/PageIntro';
import ServicesDirectory from '@/components/services/ServicesDirectory';
import { pageIntros, servicesCloser } from '@/content/pages';

const intro = pageIntros.services;

export const metadata: Metadata = {
  title: intro.metaTitle,
  description: intro.metaDescription,
  alternates: { canonical: '/servicios' },
};

export default function ServicesPage() {
  return (
    <>
      <PageIntro title={intro.title} lede={intro.lede} />
      <ServicesDirectory />
      <CtaBand title={servicesCloser.title} body={servicesCloser.body} cta={servicesCloser.cta} />
    </>
  );
}
