<?php
/**
 * AFCRtecnologia — recepción del formulario de contacto (hosting compartido).
 *
 * Reemplaza a /api/contact cuando el sitio se publica como export estático.
 * Valida con las mismas reglas que src/lib/validations.ts y responde el mismo
 * JSON: { ok, message, fieldErrors }.
 *
 * ───────────── CONFIGURACIÓN (edita solo este bloque) ─────────────
 */

/** Dónde quieres recibir los leads. */
const DESTINO       = 'contacto@afcrtecnologia.com';

/** Remitente. DEBE ser una cuenta de tu propio dominio o el correo se marcará
 *  como spam. Créala en hPanel → Correos. */
const REMITENTE     = 'web@afcrtecnologia.com';

/** Opcional: URL de webhook (n8n, Make, Zapier, Slack). Vacío = desactivado. */
const WEBHOOK_URL   = '';

/** Copia de seguridad de cada lead, fuera de public_html. Vacío = desactivado. */
const ARCHIVO_LEADS = __DIR__ . '/../afcr-leads.jsonl';

/** Límite: peticiones permitidas por IP y ventana en segundos. */
const LIMITE_PETICIONES = 5;
const LIMITE_VENTANA    = 60;

/* ─────────────────────── FIN DE LA CONFIGURACIÓN ─────────────────────── */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

/** Responde en JSON y termina. */
function responder(int $codigo, array $cuerpo): void {
    http_response_code($codigo);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function longitud(string $texto): int {
    return function_exists('mb_strlen') ? mb_strlen($texto, 'UTF-8') : strlen($texto);
}

function ip_cliente(): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $clave) {
        if (!empty($_SERVER[$clave])) {
            $valor = explode(',', $_SERVER[$clave])[0];
            return trim($valor);
        }
    }
    return 'anonimo';
}

/* ---------------------------- Método ---------------------------- */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder(405, ['ok' => false, 'message' => 'Método no permitido.']);
}

/* -------------------------- Rate limit -------------------------- */

$registro = sys_get_temp_dir() . '/afcr_rl_' . sha1(ip_cliente()) . '.txt';
$ahora    = time();
$conteo   = 0;
$expira   = $ahora + LIMITE_VENTANA;

if (is_readable($registro)) {
    $previo = explode(':', (string) file_get_contents($registro));
    if (count($previo) === 2 && (int) $previo[1] > $ahora) {
        $conteo = (int) $previo[0];
        $expira = (int) $previo[1];
    }
}

if ($conteo >= LIMITE_PETICIONES) {
    responder(429, [
        'ok'      => false,
        'message' => 'Demasiadas solicitudes. Intenta nuevamente en un minuto.',
    ]);
}

@file_put_contents($registro, ($conteo + 1) . ':' . $expira, LOCK_EX);

/* ------------------------- Cuerpo JSON -------------------------- */

$crudo  = file_get_contents('php://input');
$datos  = json_decode((string) $crudo, true);

// Respaldo por si el formulario llegara como application/x-www-form-urlencoded
if (!is_array($datos)) {
    $datos = $_POST;
}

if (!is_array($datos) || $datos === []) {
    responder(400, ['ok' => false, 'message' => 'El cuerpo de la solicitud no es JSON válido.']);
}

$campo = static function (string $clave) use ($datos): string {
    $valor = $datos[$clave] ?? '';
    return is_string($valor) ? trim($valor) : '';
};

$nombre  = $campo('name');
$empresa = $campo('company');
$correo  = $campo('email');
$telefono = $campo('phone');
$mensaje = $campo('message');
$trampa  = $campo('website');

/* ------------------------- Validación --------------------------- */

$errores = [];

if (longitud($nombre) < 2) {
    $errores['name'] = 'Ingresa tu nombre completo.';
} elseif (longitud($nombre) > 80) {
    $errores['name'] = 'Máximo 80 caracteres.';
} elseif (!preg_match("/^[\p{L}\p{M}\s'.-]+$/u", $nombre)) {
    $errores['name'] = 'El nombre solo admite letras, espacios y guiones.';
}

if (longitud($empresa) < 2) {
    $errores['company'] = 'Ingresa el nombre de tu empresa.';
} elseif (longitud($empresa) > 80) {
    $errores['company'] = 'Máximo 80 caracteres.';
}

if ($correo === '') {
    $errores['email'] = 'El correo es obligatorio.';
} elseif (longitud($correo) > 120 || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    $errores['email'] = 'Ingresa un correo válido.';
}

if ($telefono !== '') {
    if (longitud($telefono) > 25) {
        $errores['phone'] = 'Máximo 25 caracteres.';
    } elseif (!preg_match('/^[+()\d\s-]*$/', $telefono)) {
        $errores['phone'] = 'El teléfono solo admite números, espacios y + ( ) -';
    }
}

if (longitud($mensaje) < 20) {
    $errores['message'] = 'Cuéntanos un poco más: mínimo 20 caracteres.';
} elseif (longitud($mensaje) > 2000) {
    $errores['message'] = 'Máximo 2000 caracteres.';
}

if ($errores !== []) {
    responder(400, [
        'ok'          => false,
        'message'     => 'Revisa los campos marcados e intenta nuevamente.',
        'fieldErrors' => $errores,
    ]);
}

// Honeypot: un bot rellena el campo oculto. Respondemos 200 para no darle señal.
if ($trampa !== '') {
    responder(200, ['ok' => true, 'message' => 'Solicitud recibida.']);
}

/* --------------------------- Entrega ---------------------------- */

$correo = strtolower($correo);
$lead = [
    'name'       => $nombre,
    'company'    => $empresa,
    'email'      => $correo,
    'phone'      => $telefono !== '' ? $telefono : null,
    'message'    => $mensaje,
    'receivedAt' => gmdate('c'),
    'source'     => 'landing/09-contacto (php)',
    'ip'         => ip_cliente(),
];

$entregado = false;

// 1. Copia en disco, fuera de public_html: nunca se pierde un lead.
if (ARCHIVO_LEADS !== '') {
    $linea = json_encode($lead, JSON_UNESCAPED_UNICODE) . PHP_EOL;
    if (@file_put_contents(ARCHIVO_LEADS, $linea, FILE_APPEND | LOCK_EX) !== false) {
        $entregado = true;
    }
}

// 2. Webhook opcional.
if (WEBHOOK_URL !== '' && function_exists('curl_init')) {
    $ch = curl_init(WEBHOOK_URL);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($lead, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
    ]);
    curl_exec($ch);
    $estado = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($estado >= 200 && $estado < 300) {
        $entregado = true;
    }
}

// 3. Correo. El asunto va codificado en UTF-8 y el Reply-To ya está validado,
//    así que no hay riesgo de inyección de cabeceras.
$asunto = '=?UTF-8?B?' . base64_encode('[Lead] ' . $empresa . ' — ' . $nombre) . '?=';

$cuerpo = implode("\n", [
    'Nuevo lead desde AFCRtecnologia',
    '',
    'Nombre:   ' . $nombre,
    'Empresa:  ' . $empresa,
    'Correo:   ' . $correo,
    'Teléfono: ' . ($telefono !== '' ? $telefono : '—'),
    '',
    'Proceso a automatizar:',
    $mensaje,
    '',
    'Recibido: ' . $lead['receivedAt'],
    'IP:       ' . $lead['ip'],
]);

$cabeceras = implode("\r\n", [
    'From: AFCRtecnologia <' . REMITENTE . '>',
    'Reply-To: ' . $correo,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    'X-Mailer: PHP/' . phpversion(),
]);

if (@mail(DESTINO, $asunto, $cuerpo, $cabeceras, '-f' . REMITENTE)) {
    $entregado = true;
}

if (!$entregado) {
    responder(500, [
        'ok'      => false,
        'message' => 'No pudimos registrar tu solicitud. Escríbenos a ' . DESTINO . ' o por WhatsApp.',
    ]);
}

responder(200, [
    'ok'      => true,
    'message' => 'Solicitud recibida. Te contactaremos en menos de 24 horas.',
]);
