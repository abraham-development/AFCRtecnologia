'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { authCopy } from '@/content/auth';
import { cn } from '@/lib/utils';

export const AUTH_INPUT = 'border-border-editorial bg-bg-darkest text-text-primary placeholder:text-text-secondary w-full min-h-12 border px-4 py-3 text-base transition-colors focus:border-accent-cyan disabled:opacity-60';

interface PasswordFieldProps { id: string; label?: string; autoComplete: 'new-password' | 'current-password'; error?: string; hint?: boolean; disabled?: boolean; }

export function PasswordField({ id, label = authCopy.password, autoComplete, error, hint, disabled }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">{label}</label>
      <div className="relative">
        <input id={id} name={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} required maxLength={72}
          disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(AUTH_INPUT, 'pr-14', error && 'border-red-400')} />
        <button type="button" onClick={() => setVisible(!visible)} disabled={disabled} aria-pressed={visible}
          aria-label={visible ? authCopy.hidePassword : authCopy.showPassword}
          className="text-text-secondary hover:text-accent-cyan absolute inset-y-0 right-0 flex w-12 items-center justify-center disabled:opacity-60">
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      {hint ? <p id={`${id}-hint`} className="text-text-secondary mt-2 text-sm leading-relaxed">{authCopy.passwordHint}</p> : null}
      {error ? <p id={`${id}-error`} className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
