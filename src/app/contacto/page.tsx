import type { Metadata } from 'next';

import ContactChannels from '@/components/contact/ContactChannels';
import ContactForm from '@/components/contact/ContactForm';
import PageIntro from '@/components/layout/PageIntro';
import { agency, contactCopy } from '@/content/agency';
import { pageIntros } from '@/content/pages';

const intro = pageIntros.contact;

export const metadata: Metadata = {
  title: intro.metaTitle,
  description: intro.metaDescription,
  alternates: { canonical: '/contacto' },
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        title={intro.title}
        lede={intro.lede}
        aside={
          <dl className="border-border-editorial grid grid-cols-2 gap-6 border-t pt-6">
            <div>
              <dt className="text-micro text-text-secondary">{contactCopy.asideResponse.label}</dt>
              <dd className="text-data text-text-primary mt-2">{contactCopy.asideResponse.value}</dd>
            </div>
            <div>
              <dt className="text-micro text-text-secondary">{contactCopy.asideBase.label}</dt>
              <dd className="text-data text-text-primary mt-2">
                {agency.address.locality}, {agency.country}
              </dd>
            </div>
          </dl>
        }
      />
      <ContactChannels />
      <ContactForm />
    </>
  );
}
