import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
// @ts-types="npm:@types/nodemailer@8.0.2"
import nodemailer from 'npm:nodemailer@10.0.15';
import { createWelcomeHandler } from './worker.ts';
import { welcomeMessage } from './template.ts';
import { logoPngBase64 } from './logo.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const config = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(Deno.env.get('AFCR_MAIL_CONFIG_B64')!), value => value.charCodeAt(0))));
const mailer = nodemailer.createTransport({
  host: config.host, port: 465, secure: true,
  auth: { user: config.user, pass: config.password },
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
});

Deno.serve(createWelcomeHandler({
  async authorize(token) {
    const { data, error } = await admin.rpc('afcr_welcome_authorized', { token });
    if (error) throw new Error('AUTH_UNAVAILABLE');
    return data === true;
  },
  async operation(payload) {
    const { data, error } = await admin.rpc('afcr_welcome_operation', { payload });
    if (error) throw new Error('QUEUE_UNAVAILABLE');
    return data;
  },
  async getUser(id) {
    const { data, error } = await admin.auth.admin.getUserById(id);
    if (error) throw new Error('AUTH_UNAVAILABLE');
    return data.user;
  },
  async send(job) {
    await mailer.sendMail({
      from: { name: config.name, address: config.from }, to: job.recipient_email,
      messageId: `<welcome-${job.user_id}@afcrtecnologia.com>`,
      ...welcomeMessage(job.recipient_email),
      attachments: [{ filename: 'afcr-logotipo.png', content: logoPngBase64, encoding: 'base64', cid: 'afcr-logo', contentDisposition: 'inline' }],
      disableFileAccess: true, disableUrlAccess: true,
    });
  },
  async verify() { await mailer.verify(); },
}));
