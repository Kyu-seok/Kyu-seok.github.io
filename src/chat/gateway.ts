// Client for the portfolio-ask gateway (server/). Generated replies are an enhancement:
// every caller must be ready to fall back to the scripted reply when this says 'unavailable'.

const BASE = ((import.meta.env.VITE_GATEWAY_URL as string | undefined) ?? 'https://ask.code-bite.com').replace(/\/$/, '');
const FIRST_TOKEN_BUDGET_MS = 4000;
const TOTAL_BUDGET_MS = 30000;
const HEALTH_TIMEOUT_MS = 2500;
const RETRY_HEALTH_AFTER_MS = 60000;

export interface Stamp {
  model: string;
  tokS: number;
  seconds: number;
}

export interface Handlers {
  onToken: (text: string) => void;
  onDone: (stamp: Stamp) => void;
}

let health: Promise<boolean> | null = null;

// Probed once per session on the first free-text question, never on page load.
export function gatewayReady(): Promise<boolean> {
  if (!health) {
    health = fetch(`${BASE}/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { ready?: boolean } | null) => Boolean(j?.ready))
      .catch(() => false);
    health.then((ok) => {
      if (!ok) window.setTimeout(() => (health = null), RETRY_HEALTH_AFTER_MS);
    });
  }
  return health;
}

type Outcome = 'generated' | 'unavailable';

export async function askGateway(question: string, intent: string, lang: string, h: Handlers): Promise<Outcome> {
  if (!(await gatewayReady())) return 'unavailable';

  const ctl = new AbortController();
  let firstTimer: number | null = window.setTimeout(() => ctl.abort(), FIRST_TOKEN_BUDGET_MS);
  const totalTimer = window.setTimeout(() => ctl.abort(), TOTAL_BUDGET_MS);
  let gotToken = false;

  try {
    const res = await fetch(`${BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, intent, lang }),
      signal: ctl.signal,
    });
    if (!res.ok || !res.body) return 'unavailable';

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buf.indexOf('\n\n')) >= 0) {
        const frame = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        let event = 'message';
        let data = '';
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (!data) continue;
        if (event === 'token') {
          const { text } = JSON.parse(data) as { text: string };
          if (!gotToken) {
            gotToken = true;
            if (firstTimer) window.clearTimeout(firstTimer);
            firstTimer = null;
          }
          h.onToken(text);
        } else if (event === 'done') {
          const d = JSON.parse(data) as { model: string; tok_s: number; seconds: number };
          h.onDone({ model: d.model, tokS: d.tok_s, seconds: d.seconds });
        }
      }
    }
    return gotToken ? 'generated' : 'unavailable';
  } catch {
    // Aborted before the first token, network error, or cut mid-stream: the caller keeps whatever streamed.
    return gotToken ? 'generated' : 'unavailable';
  } finally {
    if (firstTimer) window.clearTimeout(firstTimer);
    window.clearTimeout(totalTimer);
  }
}
