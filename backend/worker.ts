import { AnthropicProvider } from './providers/anthropic';

interface Env {
  ANTHROPIC_API_KEY: string;
  HARLO_HMAC_SECRET: string;
  RATE_LIMIT_KV: KVNamespace;
  AI_MODEL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Harlo-Client, X-Harlo-Signature, X-Harlo-Timestamp',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const clientHeader = request.headers.get('X-Harlo-Client');
    if (!clientHeader?.startsWith('harlo-mobile-')) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    const signature = request.headers.get('X-Harlo-Signature');
    const timestamp = request.headers.get('X-Harlo-Timestamp');
    if (!signature || !timestamp) {
      return new Response('Missing signature', { status: 401, headers: corsHeaders });
    }

    const requestAge = Date.now() - parseInt(timestamp);
    if (requestAge > 5 * 60 * 1000) {
      return new Response('Request expired', { status: 401, headers: corsHeaders });
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `rl:${ip}:${Math.floor(Date.now() / 60000)}`;
    const currentCount = parseInt(await env.RATE_LIMIT_KV.get(rateLimitKey) || '0');

    if (currentCount >= 20) {
      return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders });
    }

    await env.RATE_LIMIT_KV.put(rateLimitKey, String(currentCount + 1), { expirationTtl: 60 });

    const body = await request.json() as { messages: unknown[]; system?: string };

    try {
      const provider = new AnthropicProvider(env.ANTHROPIC_API_KEY);
      const result = await provider.chat({
        model: env.AI_MODEL || 'claude-haiku-4-5-20251001',
        messages: body.messages,
        maxTokens: 300,
        system: body.system,
      });

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
