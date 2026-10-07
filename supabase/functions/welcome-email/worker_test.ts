import { createWelcomeHandler, classifyMailError, type Dependencies } from './worker.ts';
import { welcomeMessage } from './template.ts';

function assert(value: unknown, message = 'Assertion failed'): asserts value { if (!value) throw new Error(message); }
const job = { user_id: '71000000-0000-4000-8000-000000000001', recipient_email: 'fixture@qa.afcrtecnologia.com', lease_id: '71000000-0000-4000-8000-000000000002' };
const request = (body = '{}', token = 'a'.repeat(64)) => new Request('https://worker.invalid', { method: 'POST', headers: { authorization: `Bearer ${token}` }, body });
function fixture(overrides: Partial<Dependencies> = {}) {
  const results: Record<string, unknown>[] = [];
  let sent = 0, claims = 0, verified = 0;
  const handler = createWelcomeHandler({
    authorize: async token => token === 'a'.repeat(64),
    operation: async payload => { if (payload.operation === 'claim') return claims++ === 0 ? job : null; results.push(payload); return { status: payload.outcome }; },
    getUser: async () => ({ email: job.recipient_email, email_confirmed_at: '2026-10-07' }),
    send: async () => { sent++; }, verify: async () => { verified++; }, ...overrides,
  });
  return { handler, results, counts: () => ({ sent, claims, verified }) };
}
Deno.test('Custom authentication rejects missing/wrong token without claiming or sending', async () => {
  const test = fixture();
  assert((await test.handler(request('{}', 'b'.repeat(64)))).status === 401);
  assert((await test.handler(request('{}', ''))).status === 401);
  assert(test.counts().claims === 0 && test.counts().sent === 0);
});
Deno.test('Health check authenticates SMTP but does not send or claim; arbitrary recipient rejected', async () => {
  const test = fixture();
  assert((await test.handler(request('{"action":"check"}'))).status === 200);
  assert(test.counts().verified === 1 && test.counts().sent === 0 && test.counts().claims === 0);
  assert((await test.handler(request('{"to":"attacker@example.com"}'))).status === 400);
});
Deno.test('Verified registration sends once and acknowledges its exact lease', async () => {
  const test = fixture();
  assert((await test.handler(request())).status === 200);
  assert(test.counts().sent === 1 && test.results[0].outcome === 'sent' && test.results[0].lease_id === job.lease_id);
});
Deno.test('Changed, unverified, anonymous and test recipients never receive mail', async () => {
  for (const user of [null, { email: job.recipient_email }, { email: 'changed@example.com', email_confirmed_at: 'today' }, { email: job.recipient_email, email_confirmed_at: 'today', is_anonymous: true }]) {
    const test = fixture({ getUser: async () => user });
    await test.handler(request());
    assert(test.counts().sent === 0 && test.results[0].outcome === 'skipped');
  }
  // fixture separado para dominio reservado; no conexión SMTP.
  let claimed = false; const outcomes: unknown[] = [];
  const reserved = fixture({ operation: async payload => { if (payload.operation !== 'claim') { outcomes.push(payload); return null; } if (claimed) return null; claimed = true; return { ...job, recipient_email: 'test@example.invalid' }; }, getUser: async () => ({ email: 'test@example.invalid', email_confirmed_at: 'today' }) });
  await reserved.handler(request());
  assert(reserved.counts().sent === 0 && outcomes.length === 1);
});
Deno.test('SMTP failures retry only when acceptance is unambiguous', async () => {
  for (const [error, outcome] of [[{ responseCode: 451, command: 'DATA' }, 'retry'], [{ responseCode: 550 }, 'failed'], [{ code: 'ETIMEDOUT', command: 'CONN' }, 'retry'], [{ code: 'ETIMEDOUT', command: 'DATA' }, 'uncertain'], [new Error('unknown'), 'uncertain']] as const) {
    assert(classifyMailError(error).outcome === outcome);
    const test = fixture({ send: async () => { throw error; } });
    await test.handler(request()); assert(test.results[0].outcome === outcome);
  }
});
Deno.test('Auth outage retries before SMTP; failed acknowledgement never resends', async () => {
  const outage = fixture({ getUser: async () => { throw new Error('unavailable'); } });
  await outage.handler(request());
  assert(outage.counts().sent === 0 && outage.results[0].error_code === 'auth_temporary');
  let claims = 0, acks = 0;
  const ack = fixture({ operation: async payload => { if (payload.operation === 'claim') { claims++; return job; } acks++; throw new Error('DB down'); } });
  assert((await ack.handler(request())).status === 503);
  assert(ack.counts().sent === 1 && claims === 1 && acks === 3);
});
Deno.test('Email escapes recipient and includes text fallback and production links', () => {
  const email = welcomeMessage('<script>@example.invalid');
  assert(!email.html.includes('<script>') && email.html.includes('&lt;script&gt;'));
  assert(email.html.includes('cid:afcr-logo') && email.html.includes('https://afcrtecnologia.com/cuenta'));
  assert(email.text.includes('https://afcrtecnologia.com/tienda'));
});
