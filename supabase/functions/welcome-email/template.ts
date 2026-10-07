import { welcomeCopy as copy } from '../../../src/content/welcome.ts';
const site = 'https://afcrtecnologia.com';
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

/** HTML de correo con tablas y estilos inline; no scripts ni fuentes remotas. */
export function welcomeMessage(email: string) {
  return {
    subject: copy.subject,
    text: `${copy.title}\n\n${copy.body}\n\n${copy.emailLabel}: ${email}\n\n${copy.account}: ${site}/cuenta\n${copy.store}: ${site}/tienda\n\n${copy.help}\n\n${copy.closing}`,
    html: `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(copy.subject)}</title></head><body style="margin:0;background:#0d1828;color:#e8e5dd;font-family:Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escape(copy.preview)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d1828;"><tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;"><tr><td style="padding:8px 8px 28px;border-bottom:1px solid #243049;"><img src="cid:afcr-logo" width="200" height="54" alt="AFCRtecnologia" style="display:block;width:200px;max-width:100%;height:auto;border:0;"></td></tr>
<tr><td style="padding:32px 8px 0;"><h1 style="margin:0;font-family:Georgia,serif;font-size:32px;font-weight:normal;line-height:1.2;">${escape(copy.title)}</h1><p style="margin:20px 0 0;font-size:16px;line-height:1.65;">${escape(copy.body)}</p></td></tr>
<tr><td style="padding:24px 8px;"><p style="margin:0;font-size:14px;line-height:1.6;color:#a9b7c8;">${escape(copy.emailLabel)}</p><p style="margin:6px 0 0;font-size:15px;line-height:1.6;word-break:break-all;">${escape(email)}</p></td></tr>
<tr><td style="padding:0 8px 8px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" bgcolor="#5bc2d8" style="background:#5bc2d8;"><a href="${site}/cuenta" style="display:block;padding:16px 12px;font-size:16px;line-height:20px;font-weight:bold;color:#0d1828;text-decoration:none;">${escape(copy.account)}</a></td></tr></table></td></tr>
<tr><td align="center" style="padding:0 8px 24px;"><a href="${site}/tienda" style="display:block;padding:14px 12px;font-size:15px;line-height:20px;color:#5bc2d8;text-decoration:underline;">${escape(copy.store)}</a></td></tr>
<tr><td style="padding:24px 8px 8px;border-top:1px solid #243049;"><p style="margin:0;font-size:14px;line-height:1.6;color:#a9b7c8;">${escape(copy.help)}</p><p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#e8e5dd;">${escape(copy.closing)}</p></td></tr></table>
</td></tr></table></body></html>`,
  };
}
