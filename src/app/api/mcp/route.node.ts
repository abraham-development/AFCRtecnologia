import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { authenticateAgent } from '@/lib/mcp/auth';
import { createNewsMcpServer } from '@/lib/mcp/news-server';

/**
 * Servidor MCP de noticias: https://afcrtecnologia.com/api/mcp
 *
 * Streamable HTTP sin estado: cada request crea su propio servidor y
 * transporte, asi que no depende de sesiones en memoria. Autenticacion con
 * `Authorization: Bearer afcr_…` (tokens en `agent_tokens`, ver
 * scripts/mcp-token.mjs). Solo existe en el build Node, igual que /api/contact.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Rate limit por agente, en memoria de instancia (mismo patron que /api/contact). */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const hits = new Map<string, { count: number; expires: number }>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.expires < now) {
    hits.set(key, { count: 1, expires: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

function jsonRpcError(status: number, message: string, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message }, id: null }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

function siteUrlFor(request: Request): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/+$/, '');
}

async function handle(request: Request): Promise<Response> {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return jsonRpcError(401, 'Token ausente, inválido o revocado.', {
      'WWW-Authenticate': 'Bearer realm="afcrtecnologia-mcp"',
    });
  }
  if (!rateLimit(agent.tokenId)) {
    return jsonRpcError(429, 'Demasiadas solicitudes: espera un minuto.', { 'Retry-After': '60' });
  }

  const server = createNewsMcpServer(agent, siteUrlFor(request));
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    // Cubre attach_cover con imageBase64 (2 MB en base64 ≈ 2,7 MB) y el sobre JSON-RPC.
    maxRequestBodySize: 3 * 1024 * 1024,
  });
  await server.connect(transport);

  const isGet = request.method === 'GET';
  try {
    const response = await transport.handleRequest(request, {
      authInfo: { token: agent.tokenId, clientId: agent.name, scopes: ['news:write'] },
    });
    if (isGet) {
      request.signal.addEventListener('abort', () => {
        void transport.close();
        void server.close();
      });
    }
    return response;
  } finally {
    if (!isGet) {
      // Con respuestas JSON el cuerpo ya esta completo: se puede cerrar el par.
      void transport.close();
      void server.close();
    }
  }
}

export { handle as GET, handle as POST, handle as DELETE };
