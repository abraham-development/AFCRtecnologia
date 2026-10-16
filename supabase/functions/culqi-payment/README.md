# Cobro de pedidos con Culqi

El navegador tokeniza la tarjeta o Yape con Culqi Checkout Custom v4 y envía
solo `order_id` + `token_id`. Esta función valida el bearer con `getUser`, la
sesión y la revisión del método de acceso, toma el importe de `orders` y crea
el cargo en `POST https://api.culqi.com/v2/charges`. Culqi cobra solo el
importe de productos; el envío se cobra aparte.

## Publicación

1. Añadir a `.env.local` las llaves de CulqiPanel → Desarrollo → API Keys, del
   mismo entorno: `NEXT_PUBLIC_CULQI_PUBLIC_KEY` y `CULQI_SECRET_KEY`.
2. `npm run store:deploy-payment` sube `CULQI_SECRET_KEY` como secreto de Edge
   y publica desde un workdir nuevo, con `--no-verify-jwt`.
3. Verificar el bundle remoto y probar: sin bearer → 401; origen ajeno → 403.
4. En CulqiPanel, registrar el webhook `charge.creation.succeeded` con
   `https://zuqxtogggkundznzwulg.supabase.co/functions/v1/culqi-payment/webhook`.
   El webhook no confía en el cuerpo: vuelve a leer el evento y el cargo en Culqi.
5. Para producción, cargar `NEXT_PUBLIC_CULQI_PUBLIC_KEY` en hPanel y compilar
   de nuevo. La llave privada nunca va a Hostinger.

## Estados de un intento (`afcr_private.store_payments`)

- `processing`: cargo en curso. Solo uno por pedido.
- `needs_3ds`: Culqi respondió 200 + `REVIEW`. El segundo cargo usa el mismo
  token y dispositivo, y añade `authentication_3DS`.
- `succeeded`: el pedido pasa a `payment_status='paid'` y `payment_provider='culqi'`.
  El estado del pedido sigue `pending` hasta que el admin lo prepare.
- `failed`: rechazo de Culqi (4xx). El cliente puede intentar con otro token.
- `uncertain`: timeout, 5xx, importe distinto o intento colgado más de 2 min.
  Nunca se cobra de nuevo: el siguiente intento o el webhook buscan el cargo
  por `metadata.attempt_id`. Si a los 10 min no hay cargo, se libera.

Los pedidos impagos vencen a los 30 min (Cron `afcr-store-expire-orders`),
salvo que tengan un intento en vuelo, y devuelven el stock una vez.

Consulta de estado sin datos de tarjeta:

```sql
select status, code, count(*) from afcr_private.store_payments group by 1, 2;
```

## Pruebas

`supabase/tests/store_payments.sql` corre con fixtures en BEGIN/ROLLBACK, sin
llamar a Culqi. Con llaves `pk_test_`/`sk_test_`, el checkout muestra las
tarjetas de prueba: 4111 1111 1111 1111 (09/30, CVV 123) se aprueba;
4456 5300 0000 1096 (07/30, CVV 111) pide el reto 3DS; 4456 5300 0000 1013
falla la autenticación; Yape usa el 900 000 001 con cualquier código de 6 dígitos.
