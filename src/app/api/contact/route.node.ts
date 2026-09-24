import { NextResponse } from 'next/server';

import { agency } from '@/content/agency';
import { contactSchema, toFieldErrors, type ContactResponse } from '@/lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Rate limiting (best effort, en memoria de instancia)                       */
/*  Para produccion multi-region usa Upstash Redis o Vercel KV.                */
/* -------------------------------------------------------------------------- */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const hits = new Map<string, { count: number; expires: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || entry.expires < now) {
    hits.set(ip, { count: 1, expires: now + WINDOW_MS });
    if (hits.size > 500) {
      for (const [key, value] of hits) if (value.expires < now) hits.delete(key);
    }
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'anonimo';
}

/* -------------------------------------------------------------------------- */
/*  Entrega del lead                                                           */
/* -------------------------------------------------------------------------- */

interface Lead {
  name: string;
  company: string;
  email: string;
  phone?: string;
  message: string;
  receivedAt: string;
  source: string;
}

async function forwardToWebhook(lead: Lead): Promise<void> {
  const url = process.env.CONTACT_WEBHOOK_URL;
  if (!url) return;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(8000),
  });
}

async function sendEmail(lead: Lead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL ?? agency.email;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) return;

  const text = [
    `Nuevo lead desde ${agency.name}`,
    '',
    `Nombre:   ${lead.name}`,
    `Empresa:  ${lead.company}`,
    `Correo:   ${lead.email}`,
    `Teléfono: ${lead.phone || '—'}`,
    '',
    'Mensaje:',
    lead.message,
    '',
    `Recibido: ${lead.receivedAt}`,
  ].join('\n');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: lead.email,
      subject: `[Lead] ${lead.company} — ${lead.name}`,
      text,
    }),
    signal: AbortSignal.timeout(8000),
  });
}

/* -------------------------------------------------------------------------- */
/*  Handler                                                                    */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request): Promise<NextResponse<ContactResponse>> {
  if (!rateLimit(clientIp(request))) {
    return NextResponse.json(
      { ok: false, message: 'Demasiadas solicitudes. Intenta nuevamente en un minuto.' },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Revisa los campos marcados e intenta nuevamente.',
        fieldErrors: toFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  // Honeypot: un bot rellena el campo oculto. Respondemos 200 para no darle señal.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true, message: 'Solicitud recibida.' }, { status: 200 });
  }

  const lead: Lead = {
    name: parsed.data.name,
    company: parsed.data.company,
    email: parsed.data.email.toLowerCase(),
    phone: parsed.data.phone || undefined,
    message: parsed.data.message,
    receivedAt: new Date().toISOString(),
    source: 'landing/09-contacto',
  };

  try {
    await Promise.all([forwardToWebhook(lead), sendEmail(lead)]);
  } catch (error) {
    console.error('[contact] fallo al entregar el lead', error);
    return NextResponse.json(
      {
        ok: false,
        message: `No pudimos registrar tu solicitud. Escríbenos a ${agency.email} o por WhatsApp.`,
      },
      { status: 500 },
    );
  }

  if (!process.env.CONTACT_WEBHOOK_URL && !process.env.RESEND_API_KEY) {
    // Sin integracion configurada: dejamos traza en el log del servidor.
    console.info('[contact] lead recibido (sin integración configurada)', lead);
  }

  return NextResponse.json(
    { ok: true, message: 'Solicitud recibida. Te contactaremos en menos de 24 horas.' },
    { status: 200 },
  );
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: false, message: 'Método no permitido.' }, { status: 405 });
}
