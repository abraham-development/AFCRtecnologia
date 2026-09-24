'use client';

import { ArrowUpRight } from 'lucide-react';

import BrandIcon from '@/components/ui/BrandIcon';
import ButtonMagnetic from '@/components/ui/ButtonMagnetic';
import { CONTACT_FORM_HREF, footerCopy, hasWhatsApp, whatsappUrl } from '@/content/agency';

interface CtaBandProps {
  title: string;
  body: string;
  /** Texto del boton al formulario. */
  cta: string;
}

/** Cierre de pagina interior: formulario como accion principal y WhatsApp al lado. */
export function CtaBand({ title, body, cta }: CtaBandProps) {
  return (
    <section className="hairline-t">
      <div className="shell grid gap-10 py-20 md:py-28 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <h2 className="text-display-sm max-w-[18ch]">{title}</h2>
          <p className="text-text-secondary mt-6 max-w-md leading-relaxed">{body}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
          <ButtonMagnetic variant="solid" href={CONTACT_FORM_HREF}>
            {cta}
            <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
          </ButtonMagnetic>
          {hasWhatsApp ? (
            <ButtonMagnetic variant="ghost" href={whatsappUrl} external aria-label={footerCopy.whatsappCta}>
              <BrandIcon network="whatsapp" size={15} />
              {footerCopy.whatsappShort}
            </ButtonMagnetic>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default CtaBand;
