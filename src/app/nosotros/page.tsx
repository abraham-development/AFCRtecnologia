import type { Metadata } from 'next';

import AboutContent from '@/components/about/AboutContent';
import PageIntro from '@/components/layout/PageIntro';
import { agency } from '@/content/agency';
import { pageIntros } from '@/content/pages';

const intro = pageIntros.about;

export const metadata: Metadata = {
  title: intro.metaTitle,
  description: intro.metaDescription,
  alternates: { canonical: '/nosotros' },
};

export default function AboutPage() {
  return (
    <>
      <PageIntro title={intro.title} lede={agency.longDescription} />
      <AboutContent />
    </>
  );
}
