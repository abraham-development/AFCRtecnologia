import { z } from 'zod';
import { authCopy } from '@/content/auth';

export const emailSchema = z.email(authCopy.errors.email).max(254, authCopy.errors.email);
export const passwordSchema = z.string().min(8, authCopy.errors.password).max(72, authCopy.errors.password)
  .regex(/[a-z]/, authCopy.errors.password).regex(/[A-Z]/, authCopy.errors.password).regex(/[0-9]/, authCopy.errors.password);
export const otpSchema = z.string().regex(/^\d{6}$/, authCopy.errors.otp);

export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
