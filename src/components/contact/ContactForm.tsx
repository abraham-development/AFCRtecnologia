'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, LoaderCircle, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import ButtonMagnetic from '@/components/ui/ButtonMagnetic';
import KeyBadge from '@/components/ui/KeyBadge';
import Toast from '@/components/ui/Toast';
import { agency, contactCopy } from '@/content/agency';
import { contactSchema, type ContactInput, type ContactResponse } from '@/lib/validations';
import type { SubmitState, ToastMessage } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Destino del formulario. En el build de Node es el route handler; en el
 * export estático (Hostinger) apunta a `/contact.php`. Ver next.config.ts.
 */
const CONTACT_ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT ?? '/api/contact';

/** Identificador incremental: evita llamadas impuras dentro del componente. */
let toastSequence = 0;

function createToast(
  variant: ToastMessage['variant'],
  title: string,
  description: string,
): ToastMessage {
  toastSequence += 1;
  return { id: toastSequence, variant, title, description };
}

const FIELD_BASE =
  'peer w-full border-b bg-transparent pt-2 pb-3 text-text-primary placeholder:text-text-secondary/50 transition-colors duration-300 focus:outline-none';

/** Linea cian que crece bajo el campo con foco (hermana `peer` del input). */
const FOCUS_LINE =
  'bg-accent-cyan pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 transition-[scale] duration-500 ease-(--ease-editorial) peer-focus:scale-x-100';

export function ContactForm() {
  const [state, setState] = useState<SubmitState>('idle');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, touchedFields },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { name: '', company: '', email: '', phone: '', message: '', website: '' },
  });

  const messageLength = useWatch({ control, name: 'message' })?.length ?? 0;

  const onSubmit = async (values: ContactInput) => {
    setState('loading');

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as ContactResponse;

      if (!response.ok || !data.ok) {
        if (data.fieldErrors) {
          for (const [field, message] of Object.entries(data.fieldErrors)) {
            if (message) setError(field as keyof ContactInput, { type: 'server', message });
          }
        }
        throw new Error(data.message || 'No pudimos enviar tu solicitud.');
      }

      setState('success');
      reset();
      setToast(
        createToast(
          'success',
          'SOLICITUD RECIBIDA',
          'Te contactaremos en menos de 24 horas hábiles.',
        ),
      );
      window.setTimeout(() => setState('idle'), 6000);
    } catch (error) {
      setState('error');
      setToast(
        createToast(
          'error',
          'NO SE PUDO ENVIAR',
          error instanceof Error
            ? error.message
            : `Escríbenos directamente a ${agency.email} o por WhatsApp.`,
        ),
      );
      window.setTimeout(() => setState('idle'), 6000);
    }
  };

  /* Llegada desde «Empezar un proyecto» o el atajo E: foco en el primer campo */
  useEffect(() => {
    if (window.location.hash !== '#formulario') return;
    const timer = window.setTimeout(
      () => document.getElementById('contact-name')?.focus({ preventScroll: true }),
      700,
    );
    return () => window.clearTimeout(timer);
  }, []);

  const fieldState = (field: keyof ContactInput) => {
    if (errors[field]) return 'border-red-400/70';
    if (touchedFields[field]) return 'border-accent-cyan/60';
    return 'border-border-editorial focus:border-accent-cyan';
  };

  return (
    <section id="formulario" aria-labelledby="formulario-title" className="hairline-t py-chapter scroll-mt-28">
      <div className="shell">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 id="formulario-title" className="text-display-sm max-w-[12ch]">
              {contactCopy.formTitle}
            </h2>
            <p className="text-text-secondary mt-6 max-w-sm leading-relaxed">{contactCopy.formLede}</p>
            <p className="text-text-secondary border-border-editorial mt-10 border-t pt-6 text-xs leading-relaxed">
              {agency.legal.privacyNote}
            </p>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-8 sm:grid-cols-2">
              {/* Trampa anti-spam */}
              <div aria-hidden="true" className="sr-only">
                <label htmlFor="contact-website">No completar</label>
                <input
                  id="contact-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register('website')}
                />
              </div>

              <div>
                <label htmlFor="contact-name" className="text-micro text-text-secondary block">
                  Nombre <span className="text-accent-cyan">*</span>
                </label>
                <div className="relative">
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Nombre y apellido"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'error-name' : undefined}
                    className={cn(FIELD_BASE, fieldState('name'))}
                    {...register('name')}
                  />
                  <span aria-hidden="true" className={FOCUS_LINE} />
                </div>
                {errors.name ? (
                  <p id="error-name" role="alert" className="mt-2 text-xs text-red-400">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="contact-company" className="text-micro text-text-secondary block">
                  Empresa <span className="text-accent-cyan">*</span>
                </label>
                <div className="relative">
                  <input
                    id="contact-company"
                    type="text"
                    autoComplete="organization"
                    placeholder="Razón social o marca"
                    aria-invalid={Boolean(errors.company)}
                    aria-describedby={errors.company ? 'error-company' : undefined}
                    className={cn(FIELD_BASE, fieldState('company'))}
                    {...register('company')}
                  />
                  <span aria-hidden="true" className={FOCUS_LINE} />
                </div>
                {errors.company ? (
                  <p id="error-company" role="alert" className="mt-2 text-xs text-red-400">
                    {errors.company.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="contact-email" className="text-micro text-text-secondary block">
                  Correo <span className="text-accent-cyan">*</span>
                </label>
                <div className="relative">
                  <input
                    id="contact-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="nombre@empresa.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'error-email' : undefined}
                    className={cn(FIELD_BASE, fieldState('email'))}
                    {...register('email')}
                  />
                  <span aria-hidden="true" className={FOCUS_LINE} />
                </div>
                {errors.email ? (
                  <p id="error-email" role="alert" className="mt-2 text-xs text-red-400">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="contact-phone" className="text-micro text-text-secondary block">
                  Teléfono <span className="normal-case">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    id="contact-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+51 999 999 999"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'error-phone' : undefined}
                    className={cn(FIELD_BASE, fieldState('phone'))}
                    {...register('phone')}
                  />
                  <span aria-hidden="true" className={FOCUS_LINE} />
                </div>
                {errors.phone ? (
                  <p id="error-phone" role="alert" className="mt-2 text-xs text-red-400">
                    {errors.phone.message}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-baseline justify-between gap-4">
                  <label htmlFor="contact-message" className="text-micro text-text-secondary block">
                    ¿En qué te ayudamos? <span className="text-accent-cyan">*</span>
                  </label>
                  <span className="text-micro text-text-secondary tabular-nums">
                    {messageLength}/2000
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    id="contact-message"
                    rows={4}
                    placeholder="¿Qué servicio te interesa y qué quieres lograr? Por ejemplo: facturar con SUNAT desde mi sistema, o atender pedidos por WhatsApp."
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'error-message' : undefined}
                    className={cn(FIELD_BASE, fieldState('message'), 'resize-y')}
                    {...register('message')}
                  />
                  <span aria-hidden="true" className={FOCUS_LINE} />
                </div>
                {errors.message ? (
                  <p id="error-message" role="alert" className="mt-2 text-xs text-red-400">
                    {errors.message.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <ButtonMagnetic
                  type="submit"
                  variant="solid"
                  disabled={state === 'loading'}
                  className="w-full sm:w-auto"
                >
                  {state === 'loading' ? (
                    <>
                      <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
                      Enviando…
                    </>
                  ) : state === 'success' ? (
                    <>
                      <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                      Solicitud recibida
                    </>
                  ) : (
                    <>
                      <Send size={15} strokeWidth={1.5} aria-hidden="true" />
                      Enviar solicitud
                      <KeyBadge keyLabel="E" tone="dark" />
                    </>
                  )}
                </ButtonMagnetic>

                <p className="text-micro text-text-secondary" aria-live="polite">
                  {state === 'loading'
                    ? 'PROCESANDO…'
                    : state === 'success'
                      ? 'TE CONTACTAREMOS EN MENOS DE 24 HORAS'
                      : state === 'error'
                        ? 'REVISA LOS DATOS O ESCRÍBENOS POR WHATSAPP'
                        : contactCopy.formHint}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}

export default ContactForm;
