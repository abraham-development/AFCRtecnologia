# Bienvenida tras completar el registro

El trigger de Auth encola cuentas con correo verificado, no logins. La clave
primaria por usuario evita duplicados. Las cuentas previamente verificadas se
marcan `skipped/existing_account`; no se les envía una bienvenida retroactiva.
Las cuentas pendientes de OTP sí reciben bienvenida cuando se verifican.

## Publicación

1. Aplicar solamente la migración `welcome_email_outbox` (Cron queda pausado).
2. Publicar `npm run auth:deploy-welcome`. Reutiliza `AFCR_MAIL_CONFIG_B64` de
   `auth-method`; no crea secretos SMTP ni cambia los ajustes globales de Auth.
3. Verificar los archivos remotos, ejecutar `supabase/tests/welcome_emails.sql`
   y verificar SMTP desde el worker con `action: check`. Esta acción NO envía.
4. Aplicar `welcome_email_activation` después de comprobar las pruebas.

No usar `db push`: hay otra migración pendiente y un desfase histórico ajeno.
El build del sitio no activa este flujo; vive completamente en Supabase.

## Autenticación y pruebas

El JWT estándar está desactivado exclusivamente porque el handler valida un
token privado de Vault con una RPC disponible solo para `service_role`. No
acepta destinatarios ni contenido desde el request. Ni las cuentas normales ni
la clave pública pueden leer la cola o enviar mensajes. No mostrar el token.

`deno check --node-modules-dir=none supabase/functions/welcome-email/index.ts`
y `deno test --node-modules-dir=none supabase/functions/welcome-email/worker_test.ts`
comprueban tipos y comportamiento con dependencias falsas: no envían correo.
Los fixtures SQL se revierten. El worker descarta dominios reservados `.invalid`,
`.test`, `.example` y `.localhost`, incluso si una fixture queda guardada.

## Estado y reintentos

Consulta administrativa sin exponer destinatarios:

```sql
select status, error_code, count(*)
from afcr_private.welcome_emails group by status, error_code;
select jobname, active, schedule from cron.job
where jobname = 'afcr-welcome-emails';
```

Solo el servicio reclama trabajos, con `FOR UPDATE SKIP LOCKED` y reserva de
cinco minutos. SMTP temporal o fallo anterior a DATA: máximo seis intentos,
con esperas de 1 min, 5 min, 15 min, 1 h y 6 h. Rechazo permanente: `failed`.
Acuse perdido o worker vencido: `uncertain`, sin reenvío automático. Revisar
los registros del proveedor antes de decidir un reenvío manual; Message-ID
estable por usuario permite rastrear el correo. SMTP no garantiza exactamente
una entrega después de una desconexión. Una respuesta perdida de la base solo
reintenta el acuse, nunca la transmisión. `sent` significa aceptación SMTP,
no recepción en bandeja ni lectura.

La cola tiene RLS sin políticas intencionalmente: clientes sin acceso y RPC
privilegiada para el servicio. El aviso informativo del [asesor RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
no requiere abrir políticas públicas. No modificar las tablas antiguas de noticias.

El HTML usa tablas, CSS inline, fallback de texto y Arial/Georgia compatibles
con correo. El PNG CID deriva del logo oficial de 400 px sin redimensionarlo.
Las capturas de Chrome comprueban 320/390/600 px; no sustituyen pruebas en
Gmail, Outlook, Apple Mail ni una recepción real de correo.
