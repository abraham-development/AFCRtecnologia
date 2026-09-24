'use client';

import { ArrowUpRight, Mail } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import type { PointerEvent, ReactNode } from 'react';

import BrandIcon from '@/components/ui/BrandIcon';
import TiltCard from '@/components/ui/TiltCard';
import { agency, contactCopy, hasWhatsApp, whatsappUrl } from '@/content/agency';
import { useIsFinePointer } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface ChannelCardProps {
  href: string;
  external?: boolean;
  label: string;
  value: string;
  action: string;
  icon: ReactNode;
  primary?: boolean;
  className?: string;
}

/** Icono que se deja atraer por el cursor dentro de la tarjeta principal. */
function MagneticIcon({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const finePointer = useIsFinePointer();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 200, damping: 18 });
  const y = useSpring(rawY, { stiffness: 200, damping: 18 });
  const enabled = finePointer && !reduced;

  const handleMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (!enabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    rawX.set((event.clientX - (rect.left + rect.width / 2)) * 0.35);
    rawY.set((event.clientY - (rect.top + rect.height / 2)) * 0.35);
  };

  return (
    <span
      onPointerMove={handleMove}
      onPointerLeave={() => {
        rawX.set(0);
        rawY.set(0);
      }}
      className="-m-6 inline-flex p-6"
    >
      <motion.span style={{ x, y }} className="inline-flex">
        {children}
      </motion.span>
    </span>
  );
}

function ChannelCard({ href, external, label, value, action, icon, primary, className }: ChannelCardProps) {
  return (
    <TiltCard
      max={primary ? 5 : 7}
      className={cn('h-full', className)}
      innerClassName={cn(
        'border bg-bg-secondary transition-colors duration-500',
        primary ? 'border-accent-cyan/40 hover:border-accent-cyan' : 'border-border-editorial hover:border-accent-cyan/50',
      )}
    >
      <a
        href={href}
        data-cursor="expand"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={cn('group flex h-full min-h-72 flex-col p-7 md:p-9')}
      >
        <span className={cn('self-start transition-colors', primary ? 'text-accent-cyan' : 'text-text-secondary group-hover:text-accent-cyan')}>
          {primary ? <MagneticIcon>{icon}</MagneticIcon> : icon}
        </span>

        <p
          className={cn(
            'mt-auto pt-10 font-serif leading-tight font-light tracking-[-0.02em] break-words',
            primary ? 'text-[clamp(2rem,4vw,3.25rem)]' : 'text-[clamp(1.125rem,2.2vw,1.5rem)]',
          )}
        >
          <span className="sr-only">{label}: </span>
          {value}
        </p>
        <span className="text-micro text-text-primary group-hover:text-accent-cyan mt-6 inline-flex items-center gap-2 transition-colors">
          {action}
          <ArrowUpRight
            size={13}
            strokeWidth={1.5}
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </a>
    </TiltCard>
  );
}

export function ContactChannels() {
  const { channels } = contactCopy;

  return (
    <section aria-labelledby="canales-title" className="shell pb-20 md:pb-28">
      <h2 id="canales-title" className="sr-only">
        {contactCopy.channelsTitle}
      </h2>

      <ul className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-12">
        {hasWhatsApp ? (
          <li className="min-w-0 lg:col-span-7">
            <ChannelCard
              primary
              href={whatsappUrl}
              external
              label={channels.whatsapp.label}
              value={channels.whatsapp.value}
              action={channels.whatsapp.action}
              icon={<BrandIcon network="whatsapp" size={44} />}
            />
          </li>
        ) : null}

        <li className={cn('min-w-0', hasWhatsApp ? 'lg:col-span-5' : 'md:col-span-2 lg:col-span-12')}>
          <ChannelCard
            href={`mailto:${agency.email}`}
            label={channels.email.label}
            value={agency.email}
            action={channels.email.action}
            icon={<Mail size={22} strokeWidth={1.5} aria-hidden="true" />}
          />
        </li>
      </ul>
    </section>
  );
}

export default ContactChannels;
