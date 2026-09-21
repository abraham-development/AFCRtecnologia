'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpRight, LoaderCircle, MessageCircle, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import ButtonMagnetic from '@/components/ui/ButtonMagnetic';
import KeyBadge from '@/components/ui/KeyBadge';
import SectionBadge from '@/components/ui/SectionBadge';
import Toast from '@/components/ui/Toast';
import { agency, hasPhone, hasWhatsApp, whatsappUrl } from '@/content/agency';
import { contactSchema, type ContactInput, type ContactResponse } from '@/lib/validations';
import type { SubmitState, ToastMessage } from '@/types';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

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
  'w-full border-b bg-transparent pt-2 pb-3 text-text-primary placeholder:text-text-secondary/50 transition-colors duration-300 focus:outline-none';

export function Contact() {
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

  const fieldState = (field: keyof ContactInput) => {
    if (errors[field]) return 'border-red-400/70';
    if (touchedFields[field]) return 'border-accent-cyan/60';
    return 'border-border-editorial focus:border-accent-cyan';
  };

  return (
    <section id="contacto" aria-labelledby="contacto-title" className="hairline-t py-chapter scroll-mt-20">
      <div className="shell">
        <SectionBadge index="09" title="CONTACTO" meta={`RESPUESTA < 24 H · ${agency.timezone}`} />

        <div className="mt-12 grid gap-14 md:mt-16 lg:grid-cols-12 lg:gap-16">
          {/* Columna editorial */}
          <div className="lg:col-span-5">
            <motion.h2
              id="contacto-title"
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="text-display-sm max-w-[14ch]"
            >
              ¿Tienes un proceso que debería funcionar solo?
            </motion.h2>

            <p className="text-text-secondary mt-8 max-w-md leading-relaxed">
              Cuéntanos qué quieres mejorar. En una llamada de diagnóstico de 30 minutos
              identificaremos oportunidades reales de retorno con IA.
            </p>

            {/* Canal directo */}
            <div className="border-border-editorial mt-10 border-t pt-8">
              <p className="text-micro text-text-secondary">CANAL DIRECTO</p>

              {hasWhatsApp ? (
                <ButtonMagnetic
                  variant="ghost"
                  href={whatsappUrl}
                  external
                  className="mt-5 w-full sm:w-auto"
                  aria-label="Escribir por WhatsApp Business"
                >
                  <MessageCircle size={16} strokeWidth={1.5} aria-hidden="true" />
                  Escribir por WhatsApp
                  <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
                </ButtonMagnetic>
              ) : null}

              <dl className="mt-8 space-y-3 text-sm">
                <div className="flex gap-3">
                  <dt className="text-micro text-text-secondary w-24 shrink-0 pt-0.5">CORREO</dt>
                  <dd>
                    <a
                      href={`mailto:${agency.email}`}
                      data-cursor="expand"
                      className="text-text-primary hover:text-accent-cyan transition-colors"
                    >
                      {agency.email}
                    </a>
                  </dd>
                </div>
                {hasPhone ? (
                  <div className="flex gap-3">
                    <dt className="text-micro text-text-secondary w-24 shrink-0 pt-0.5">TELÉFONO</dt>
                    <dd className="text-text-primary">{agency.phoneDisplay}</dd>
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <dt className="text-micro text-text-secondary w-24 shrink-0 pt-0.5">BASE</dt>
                  <dd className="text-text-primary">
                    {agency.address.locality}, {agency.country}
                  </dd>
                </div>
              </dl>

              <p className="text-text-secondary mt-8 text-xs leading-relaxed">
                {agency.legal.privacyNote}
              </p>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-7">
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
                {errors.company ? (
                  <p id="error-company" role="alert" className="mt-2 text-xs text-red-400">
                    {errors.company.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="contact-email" className="text-micro text-text-secondary block">
                  Correo corporativo <span className="text-accent-cyan">*</span>
                </label>
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
                {errors.phone ? (
                  <p id="error-phone" role="alert" className="mt-2 text-xs text-red-400">
                    {errors.phone.message}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-baseline justify-between gap-4">
                  <label htmlFor="contact-message" className="text-micro text-text-secondary block">
                    Proceso a automatizar <span className="text-accent-cyan">*</span>
                  </label>
                  <span className="text-micro text-text-secondary tabular-nums">
                    {messageLength}/2000
                  </span>
                </div>
                <textarea
                  id="contact-message"
                  rows={4}
                  placeholder="Describe el proceso: qué se hace hoy manualmente, con qué herramientas y cuántas horas consume."
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'error-message' : undefined}
                  className={cn(FIELD_BASE, fieldState('message'), 'resize-y')}
                  {...register('message')}
                />
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
                    <>Solicitud recibida</>
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
                        : 'DIAGNÓSTICO SIN COSTO · 30 MINUTOS'}
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

export default Contact;
