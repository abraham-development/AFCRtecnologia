import { authCopy } from '@/content/auth';

/** No mostrar respuestas internas del proveedor ni revelar si existe un correo. */
export function authErrorMessage(error: unknown): string {
  const value = error as { code?: string; message?: string; status?: number } | null;
  const message = value?.message ?? '';
  if (message.includes('AFCR_CHANGE_PENDING')) return authCopy.methodChange.pending;
  if (message.includes('AFCR_WRONG_GOOGLE')) return authCopy.methodChange.wrongGoogle;
  if (message.includes('AFCR_SESSION_EXPIRED')) return authCopy.methodChange.sessionExpired;
  if (message.includes('AFCR_OTP_EXPIRED')) return authCopy.errors.expired;
  if (message.includes('AFCR_RATE_LIMIT')) return authCopy.errors.rateLimit;
  if (message.includes('AFCR_EMAIL_UNAVAILABLE')) return authCopy.methodChange.emailUnavailable;
  if (message.includes('AFCR_WEAK_PASSWORD')) return authCopy.errors.password;
  if (message.includes('AFCR_GOOGLE_ONLY')) return authCopy.errors.methodGoogle;
  if (message.includes('AFCR_PASSWORD_ONLY')) return authCopy.errors.methodPassword;
  if (message === 'AUTH_NOT_CONFIGURED') return authCopy.errors.config;
  if (value?.code === 'otp_expired' || value?.code === 'otp_disabled') return authCopy.errors.expired;
  if (value?.code === 'invalid_credentials') return authCopy.errors.credentials;
  if (value?.code === 'email_not_confirmed') return authCopy.unconfirmed;
  if (value?.status === 429 || value?.code?.includes('rate_limit')) return authCopy.errors.rateLimit;
  if (value?.code === 'weak_password') return authCopy.errors.password;
  if (value?.code === 'provider_disabled' || value?.code === 'validation_failed' && /provider/i.test(message)) return authCopy.errors.google;
  if (error instanceof TypeError || /fetch|network/i.test(message)) return authCopy.errors.network;
  return authCopy.errors.unavailable;
}
