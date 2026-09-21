import { z } from 'zod';

const NAME_RE = /^[\p{L}\p{M}\s'.-]+$/u;
/** Dominios gratuitos: se permiten, pero avisamos que preferimos correo corporativo. */
const FREE_MAIL = new Set(['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com']);

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Ingresa tu nombre completo.')
    .max(80, 'Máximo 80 caracteres.')
    .regex(NAME_RE, 'El nombre solo admite letras, espacios y guiones.'),

  company: z
    .string()
    .trim()
    .min(2, 'Ingresa el nombre de tu empresa.')
    .max(80, 'Máximo 80 caracteres.'),

  email: z
    .string()
    .trim()
    .min(1, 'El correo es obligatorio.')
    .max(120, 'Máximo 120 caracteres.')
    .email('Ingresa un correo válido.'),

  phone: z
    .string()
    .trim()
    .max(25, 'Máximo 25 caracteres.')
    .regex(/^[+()\d\s-]*$/, 'El teléfono solo admite números, espacios y + ( ) -')
    .optional()
    .or(z.literal('')),

  message: z
    .string()
    .trim()
    .min(20, 'Cuéntanos un poco más: mínimo 20 caracteres.')
    .max(2000, 'Máximo 2000 caracteres.'),

  /** Campo trampa anti-spam: debe llegar vacio. */
  website: z.string().max(0).optional().or(z.literal('')),
});

export type ContactInput = z.infer<typeof contactSchema>;

export interface ContactResponse {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof ContactInput, string>>;
}

/** Sugerencia suave (no bloqueante) para correos no corporativos. */
export function isFreeMailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? FREE_MAIL.has(domain) : false;
}

/** Convierte los issues de Zod en un mapa campo -> mensaje. */
export function toFieldErrors(error: z.ZodError): Partial<Record<keyof ContactInput, string>> {
  const fieldErrors: Partial<Record<keyof ContactInput, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in fieldErrors)) {
      fieldErrors[key as keyof ContactInput] = issue.message;
    }
  }
  return fieldErrors;
}
