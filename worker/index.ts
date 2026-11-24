// Worker do Depois da Ceia:
//  1. "/" → injeta configuração, título por anúncio/data e links de compra (HTMLRewriter)
//  2. POST /api/cakto → webhook da Cakto → compra e reembolso no GA4 (Measurement Protocol)
//  3. www → domínio sem www
import { escolher, heroi, linkCheckout, esc } from "../src/compartilhado.ts";

export interface Env {
  ASSETS: Fetcher;
  DC_KV?: KVNamespace;
  CHECKOUT_URL?: string;
  GA4_MEASUREMENT_ID?: string;
  META_PIXEL_ID?: string;
  RESPONSAVEL_NOME?: string;
  RESPONSAVEL_DOCUMENTO?: string;
  CONTATO?: string;
  GA4_API_SECRET?: string;
  CAKTO_WEBHOOK_SECRET?: string;
  PERMITIR_TESTE?: string; // "1" só em desenvolvimento: libera ?agora=AAAA-MM-DDTHH:MM
  GA4_ENDPOINT?: string; // troque por https://www.google-analytics.com/debug/mp/collect para validar
}

const CTA_TXT = 'Quero o kit por R$ 14,90 <span class="seta" aria-hidden="true">→</span>';

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === "/api/cakto") {
      if (req.method !== "POST") return new Response("Método não permitido", { status: 405 });
      return webhook(req, env, ctx);
    }
    const resp = await env.ASSETS.fetch(req);
    if (url.pathname === "/privacidade/") return privacidade(resp, env);
    if (url.pathname !== "/" && url.pathname !== "/index.html") return resp;
    if (!(resp.headers.get("content-type") || "").includes("text/html")) return resp;
    try {
      return pagina(resp, url, env);
    } catch {
      return resp; // se algo der errado, a página padrão continua no ar
    }
  },
} satisfies ExportedHandler<Env>;

function agora(url: URL, env: Env): number {
  const t = url.searchParams.get("agora");
  if (env.PERMITIR_TESTE === "1" && t) {
    const ms = Date.parse(t.length === 16 ? `${t}:00-03:00` : t);
    if (!Number.isNaN(ms)) return ms;
  }
  return Date.now();
}

function pagina(resp: Response, url: URL, env: Env): Response {
  const e = escolher(url.searchParams.get("utm_content"), agora(url, env));
  const h = heroi(e.variante.heroi);
  const checkout = /^https:\/\//.test(env.CHECKOUT_URL || "") ? env.CHECKOUT_URL! : "";
  const config = {
    CHECKOUT_URL: checkout,
    GA4_MEASUREMENT_ID: env.GA4_MEASUREMENT_ID || "",
    META_PIXEL_ID: env.META_PIXEL_ID || "",
    modo: e.modo,
    variante: e.chave,
  };
  const resp2 = new HTMLRewriter()
    .on('link[rel="preload"][as="image"]', { element: (el) => { el.replace(h.preload, { html: true }); } })
    .on("body", { element: (el) => { el.setAttribute("class", e.modo); } })
    .on("#dc-config", { element: (el) => { el.setInnerContent(JSON.stringify(config).replace(/</g, "\\u003c"), { html: true }); } })
    .on('[data-v="h1"]', { element: (el) => { el.setInnerContent(e.variante.h1); } })
    .on('[data-v="sub"]', { element: (el) => { el.setInnerContent(e.variante.sub); } })
    .on('[data-v="data"]', { element: (el) => { el.setInnerContent(e.linhaData); } })
    .on('[data-v="heroi"]', { element: (el) => { el.setInnerContent(h.html, { html: true }); } })
    .on("a[data-cta]", {
      element: (el) => {
        if (checkout) {
          el.setAttribute("href", linkCheckout(checkout, url.searchParams));
        } else {
          el.removeAttribute("href");
          el.setAttribute("aria-disabled", "true");
          el.setAttribute("role", "link");
          el.setInnerContent("Em breve");
        }
      },
    })
    .on('[data-v="responsavel"]', {
      element: (el) => {
        const partes = [env.RESPONSAVEL_NOME, env.RESPONSAVEL_DOCUMENTO].filter(Boolean).map((s) => esc(s!));
        if (partes.length) { el.setInnerContent(partes.join(" · "), { html: true }); el.removeAttribute("hidden"); }
      },
    })
    .transform(resp);
  const headers = new Headers(resp2.headers);
  headers.set("Cache-Control", "no-cache");
  headers.set("X-Variante", e.chave);
  headers.delete("ETag");
  return new Response(resp2.body, { status: resp.status, headers });
}

function privacidade(resp: Response, env: Env): Response {
  if (!(resp.headers.get("content-type") || "").includes("text/html")) return resp;
  return new HTMLRewriter()
    .on("[data-resp-nome]", { element: (el) => { if (env.RESPONSAVEL_NOME) el.setInnerContent(env.RESPONSAVEL_NOME); } })
    .on("[data-resp-doc]", { element: (el) => { if (env.RESPONSAVEL_DOCUMENTO) el.setInnerContent(env.RESPONSAVEL_DOCUMENTO); } })
    .transform(resp);
}

/* ---------------- webhook da Cakto ---------------- */

type Cakto = {
  secret?: string;
  event?: string;
  data?: {
    id?: string; refId?: string; amount?: number; callback?: string | null; checkoutUrl?: string | null;
    offer?: { id?: string; name?: string; price?: number };
    product?: { id?: string; short_id?: string; name?: string };
  };
};

function iguais(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
  let dif = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) dif |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return dif === 0;
}

function idItem(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("confraterniza")) return "ddc-bump-empresa";
  if (n.includes("convite")) return "ddc-bump-convites";
  return "ddc-kit";
}

function lerCallback(d: NonNullable<Cakto["data"]>): { client: string; sessao?: string } | null {
  let cb = d.callback || "";
  if (!cb && d.checkoutUrl) { try { cb = new URL(d.checkoutUrl).searchParams.get("callback") || ""; } catch { /* ignora */ } }
  if (!cb) return null;
  const [client, sessao] = decodeURIComponent(cb).split("~");
  if (!/^\d+\.\d+$/.test(client)) return null; // formato do client_id do GA4
  return { client, sessao: /^\d+$/.test(sessao || "") ? sessao : undefined };
}

async function webhook(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: Cakto;
  try { body = await req.json(); } catch { return new Response("JSON inválido", { status: 400 }); }
  if (!env.CAKTO_WEBHOOK_SECRET || !body.secret || !iguais(body.secret, env.CAKTO_WEBHOOK_SECRET)) {
    return new Response("Não autorizado", { status: 401 });
  }
  const d = body.data;
  const evento = body.event;
  if (!d || !d.id || (evento !== "purchase_approved" && evento !== "refund")) return new Response("ok (ignorado)", { status: 200 });
  const ids = lerCallback(d);
  if (!ids || !env.GA4_MEASUREMENT_ID || !env.GA4_API_SECRET) return new Response("ok (sem envio ao GA4)", { status: 200 });

  const chave = `${evento}:${d.id}`;
  if (env.DC_KV && (await env.DC_KV.get(chave))) return new Response("ok (repetido)", { status: 200 });

  const nome = d.product?.name || d.offer?.name || "Depois da Ceia";
  const valor = typeof d.amount === "number" ? d.amount : d.offer?.price ?? 0;
  const params: Record<string, unknown> = {
    transaction_id: d.id, currency: "BRL", value: valor, engagement_time_msec: 1,
    items: [{ item_id: idItem(nome), item_name: nome, price: valor, quantity: 1 }],
  };
  if (ids.sessao) params.session_id = ids.sessao;
  const payload = { client_id: ids.client, events: [{ name: evento === "refund" ? "refund" : "purchase", params }] };
  const base = env.GA4_ENDPOINT || "https://www.google-analytics.com/mp/collect";
  const destino = `${base}?measurement_id=${encodeURIComponent(env.GA4_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(env.GA4_API_SECRET)}`;

  ctx.waitUntil((async () => {
    const r = await fetch(destino, { method: "POST", body: JSON.stringify(payload), headers: { "content-type": "application/json" } });
    if (r.ok && env.DC_KV) await env.DC_KV.put(chave, "1", { expirationTtl: 60 * 60 * 24 * 30 });
    // sem logs de dados do comprador: registra só o resultado
    console.log(`ga4 ${evento} ${r.status}`);
    if (base.includes("/debug/")) console.log(`validação ga4: ${(await r.text()).replace(/\s+/g, " ")}`);
  })());
  return new Response("ok", { status: 200 });
}
