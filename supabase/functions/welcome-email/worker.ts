export type Job = { user_id: string; recipient_email: string; lease_id: string };
type User = { email?: string; email_confirmed_at?: string; is_anonymous?: boolean };
export type Dependencies = {
  authorize(token: string): Promise<boolean>;
  operation(payload: Record<string, unknown>): Promise<unknown>;
  getUser(id: string): Promise<User | null>;
  send(job: Job): Promise<void>;
  verify(): Promise<void>;
};

/** Solo errores inequívocos anteriores a DATA o rechazos SMTP se reintentan. */
export function classifyMailError(error: unknown) {
  const issue = error as { responseCode?: number; command?: string; code?: string };
  if (issue?.responseCode && issue.responseCode >= 400 && issue.responseCode < 500)
    return { outcome: 'retry', error_code: 'smtp_temporary' };
  if (issue?.responseCode && issue.responseCode >= 500)
    return { outcome: 'failed', error_code: 'smtp_rejected' };
  if (['CONN', 'EHLO', 'HELO', 'STARTTLS', 'AUTH', 'MAIL FROM', 'RCPT TO'].includes(issue?.command ?? ''))
    return { outcome: 'retry', error_code: 'smtp_connect' };
  return { outcome: 'uncertain', error_code: 'smtp_ambiguous' };
}

export function createWelcomeHandler(deps: Dependencies) {
  return async (request: Request) => {
    const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
      status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
    if (request.method !== 'POST') return respond({ error: 'INVALID_METHOD' }, 405);
    const token = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
    if (!token) return respond({ error: 'UNAUTHORIZED' }, 401);
    try {
      if (!await deps.authorize(token)) return respond({ error: 'UNAUTHORIZED' }, 401);
      const text = await request.text();
      if (text.length > 128) return respond({ error: 'INVALID_REQUEST' }, 400);
      let body: { action?: string };
      try { body = JSON.parse(text); } catch { return respond({ error: 'INVALID_REQUEST' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => key !== 'action') || (body.action && !['check', 'run'].includes(body.action)))
        return respond({ error: 'INVALID_REQUEST' }, 400);
      if (body.action === 'check') {
        await deps.verify();
        return respond({ smtp_ready: true });
      }
      // Un lote acotado permite terminar antes del timeout del invocador.
      const started = Date.now();
      let processed = 0;
      while (processed < 3 && Date.now() - started < 60000) {
        const job = await deps.operation({ operation: 'claim' }) as Job | null;
        if (!job) break;
        const finish = (result: Record<string, string>) => deps.operation({ operation: 'finish', user_id: job.user_id, lease_id: job.lease_id, ...result });
        let result: Record<string, string>;
        let user: User | null;
        try { user = await deps.getUser(job.user_id); }
        catch {
          await finish({ outcome: 'retry', error_code: 'auth_temporary' });
          processed++;
          continue;
        }
        if (!user?.email_confirmed_at || user.email !== job.recipient_email || user.is_anonymous) {
          result = { outcome: 'skipped', error_code: 'recipient_changed' };
        } else if (/@(?:[^@]*\.)?(?:invalid|test|example|localhost)$/i.test(user.email)) {
          result = { outcome: 'skipped', error_code: 'test_address' };
        } else {
          try { await deps.send(job); result = { outcome: 'sent' }; }
          catch (error) { result = classifyMailError(error); }
        }
        // Reintentar solo el acuse, nunca sendMail; una respuesta perdida no duplica el correo.
        let acknowledged = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          try { await finish(result); acknowledged = true; break; } catch { /* Acuse idempotente con la misma reserva. */ }
        }
        if (!acknowledged) return respond({ error: 'ACK_UNAVAILABLE' }, 503);
        processed++;
      }
      return respond({ processed });
    } catch {
      // No imprimir objetos SMTP: pueden contener destinatarios o credenciales.
      return respond({ error: 'WELCOME_UNAVAILABLE' }, 503);
    }
  };
}
