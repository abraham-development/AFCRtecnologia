'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { headerCopy } from '@/content/agency';
import { cn } from '@/lib/utils';

const BUTTON =
  'inline-flex h-11 shrink-0 items-center justify-center border px-2.5 text-[0.75rem] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-300 min-[380px]:px-3 min-[380px]:text-[0.8125rem] sm:px-3.5';

interface AccountActionsProps {
  className?: string;
  onNavigate?: () => void;
}

/** Iniciar sesión y crear cuenta: a la derecha del topbar, y también en el menú. */
export function AccountActions({ className, onNavigate }: AccountActionsProps) {
  const pathname = usePathname();
  const signInActive = pathname === headerCopy.signInHref;
  const signUpActive = pathname === headerCopy.signUpHref;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Link
        href={headerCopy.signInHref}
        data-cursor="expand"
        aria-current={signInActive ? 'page' : undefined}
        onClick={onNavigate}
        className={cn(
          BUTTON,
          'bg-bg-darkest/80 text-text-primary hover:border-accent-cyan hover:text-accent-cyan',
          signInActive ? 'border-accent-cyan' : 'border-border-editorial',
        )}
      >
        {headerCopy.signIn}
      </Link>
      <Link
        href={headerCopy.signUpHref}
        data-cursor="expand"
        aria-current={signUpActive ? 'page' : undefined}
        onClick={onNavigate}
        className={cn(
          BUTTON,
          'border-accent-cyan/70 bg-bg-darkest/80 text-text-primary hover:border-accent-cyan hover:bg-accent-cyan hover:text-bg-darkest focus-visible:bg-accent-cyan focus-visible:text-bg-darkest',
          signUpActive && 'border-accent-cyan',
        )}
      >
        {headerCopy.signUp}
      </Link>
    </div>
  );
}

export default AccountActions;
