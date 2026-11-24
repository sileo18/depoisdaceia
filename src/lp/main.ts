// Página de vendas: botão fixo, ampliar páginas, consentimento, GA4, Pixel e repasse de UTMs.
import { PARAMS_REPASSE, linkCheckout } from "../utm.ts";

type Config = { CHECKOUT_URL: string; GA4_MEASUREMENT_ID: string; META_PIXEL_ID: string; modo: string; variante: string };
declare global {
  interface Window { dataLayer: unknown[]; gtag: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void; _fbq?: unknown }
}

const cfg: Config = (() => {
  try { return JSON.parse(document.getElementById("dc-config")?.textContent || "{}"); } catch { return {} as Config; }
})();
const gtag = (...a: unknown[]) => window.gtag?.(...a);

const ITEM = { item_id: "ddc-kit", item_name: "Depois da Ceia — Kit de Brincadeiras", price: 14.9, quantity: 1 };
const lerLS = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const gravarLS = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

/* ---------- UTMs da primeira visita ---------- */
const entrada = new URLSearchParams(location.search);
let utms = new URLSearchParams();
for (const p of PARAMS_REPASSE) { const v = entrada.get(p); if (v) utms.set(p, v); }
try {
  if ([...utms.keys()].length) sessionStorage.setItem("dc_utm", utms.toString());
  else utms = new URLSearchParams(sessionStorage.getItem("dc_utm") || "");
} catch { /* sem armazenamento */ }

/* ---------- botões de compra ---------- */
const ctas = [...document.querySelectorAll<HTMLAnchorElement>("a[data-cta]")];
const temCheckout = /^https:\/\//.test(cfg.CHECKOUT_URL || "");
for (const a of ctas) {
  if (a.getAttribute("aria-disabled") === "true") continue;
  if (temCheckout && a.href.startsWith(cfg.CHECKOUT_URL.split("?")[0])) a.href = linkCheckout(a.href, utms);
}

let idsGA: { client?: string; sessao?: string } = {};
document.addEventListener("click", (ev) => {
  const a = (ev.target as Element).closest?.<HTMLAnchorElement>("a[data-cta]");
  if (!a) return;
  if (a.getAttribute("aria-disabled") === "true") { ev.preventDefault(); return; }
  const local = a.dataset.cta || "";
  if (!temCheckout) return; // sem checkout: o link só leva à oferta
  if (consentimento() === "granted" && idsGA.client) {
    const u = new URL(a.href);
    u.searchParams.set("callback", `${idsGA.client}~${idsGA.sessao || ""}`);
    a.href = u.toString();
  }
  gtag("event", "begin_checkout", { currency: "BRL", value: 14.9, items: [ITEM], cta_local: local });
  window.fbq?.("trackCustom", "CliqueComprar", { local });
});

/* ---------- botão fixo no celular ---------- */
const barra = document.querySelector<HTMLElement>(".barra-fixa");
const topoCta = document.querySelector('a[data-cta="topo"]');
const zonasSemBarra = [document.getElementById("oferta"), document.getElementById("final")].filter(Boolean) as Element[];
if (barra && topoCta && "IntersectionObserver" in window) {
  const estado = { topo: true, zona: false };
  const atualizar = () => {
    const ver = !estado.topo && !estado.zona;
    barra.classList.toggle("visivel", ver);
    document.body.classList.toggle("com-barra", ver);
  };
  new IntersectionObserver(([e]) => { estado.topo = e.isIntersecting || e.boundingClientRect.top > 0; atualizar(); }).observe(topoCta);
  const vistos = new Set<Element>();
  new IntersectionObserver((es) => {
    for (const e of es) e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target);
    estado.zona = vistos.size > 0; atualizar();
  }).observe(zonasSemBarra[0]);
  if (zonasSemBarra[1]) new IntersectionObserver((es) => {
    for (const e of es) e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target);
    estado.zona = vistos.size > 0; atualizar();
  }).observe(zonasSemBarra[1]);
}

/* ---------- selo carimbado e oferta vista ---------- */
const oferta = document.getElementById("oferta");
const selo = oferta?.querySelector(".selo");
let ofertaVista = false;
if (oferta && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    selo?.classList.add("carimbado");
    if (!ofertaVista) { ofertaVista = true; medirOferta(); }
    io.disconnect();
  }, { threshold: 0.5 });
  io.observe(oferta);
}
let ofertaMedida = false;
function medirOferta() {
  if (!ofertaVista || ofertaMedida || consentimento() !== "granted" || !scriptsCarregados) return;
  ofertaMedida = true;
  gtag("event", "view_item", { currency: "BRL", value: 14.9, items: [ITEM] });
  window.fbq?.("track", "ViewContent", { value: 14.9, currency: "BRL", content_ids: ["ddc-kit"], content_type: "product" });
}

/* ---------- ampliar páginas ---------- */
const dialogo = document.querySelector<HTMLDialogElement>("dialog.zoom");
let origem: HTMLElement | null = null;
document.addEventListener("click", (ev) => {
  const b = (ev.target as Element).closest?.<HTMLButtonElement>("button[data-zoom]");
  if (!b || !dialogo) return;
  origem = b;
  const nome = b.dataset.zoom!;
  const img = dialogo.querySelector("img")!;
  const original = b.querySelector("img");
  img.src = original?.dataset.grande || original?.currentSrc || `/img/${nome}-768.webp`;
  img.alt = original?.alt || "";
  if (original) { img.width = original.width; img.height = original.height; }
  dialogo.querySelector("[data-zoom-legenda]")!.textContent = original?.alt || "";
  dialogo.showModal();
  gtag("event", "select_content", { content_type: "pagina_ampliada", item_id: nome });
});
dialogo?.addEventListener("click", (ev) => {
  if (ev.target === dialogo || (ev.target as Element).closest("[data-fechar]")) dialogo.close();
});
dialogo?.addEventListener("close", () => origem?.focus());

/* ---------- FAQ e lista ---------- */
document.querySelectorAll<HTMLDetailsElement>("details").forEach((d) => d.addEventListener("toggle", () => {
  if (!d.open) return;
  if (d.dataset.faq) gtag("event", "faq_open", { pergunta: d.querySelector("summary")?.textContent || "" });
  if (d.dataset.medir) gtag("event", "select_content", { content_type: d.dataset.medir, item_id: "72" });
}));

/* ---------- consentimento ---------- */
const aviso = document.querySelector<HTMLElement>(".cookies");
function consentimento(): "granted" | "denied" | null {
  try { const v = JSON.parse(lerLS("dc_consent") || "null"); return v?.escolha ?? null; } catch { return null; }
}
function mostrarAviso(ver: boolean) {
  if (!aviso) return;
  aviso.hidden = !ver;
  document.body.classList.toggle("com-cookies", ver);
}
function apagarCookies() {
  const dom = location.hostname.split(".").slice(-3).join(".");
  for (const c of document.cookie.split(";")) {
    const nome = c.split("=")[0].trim();
    if (/^(_ga|_gid|_gat|_fbp|_fbc)/.test(nome)) {
      for (const d of ["", `; domain=${location.hostname}`, `; domain=.${dom}`]) document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`;
    }
  }
}
aviso?.addEventListener("click", (ev) => {
  const b = (ev.target as Element).closest<HTMLButtonElement>("button[data-consent]");
  if (!b) return;
  const escolha = b.dataset.consent as "granted" | "denied";
  const anterior = consentimento();
  gravarLS("dc_consent", JSON.stringify({ v: 1, escolha, data: new Date().toISOString() }));
  mostrarAviso(false);
  if (escolha === "granted") carregarScripts();
  else if (anterior === "granted") { apagarCookies(); location.reload(); }
});
document.querySelector("[data-preferencias]")?.addEventListener("click", () => mostrarAviso(true));

let scriptsCarregados = false;
function carregarScripts() {
  if (scriptsCarregados) return;
  scriptsCarregados = true;
  const quando = (fn: () => void) => ("requestIdleCallback" in window ? (window as any).requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 1200));
  quando(() => {
    gtag("consent", "update", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
    if (/^G-[A-Z0-9]+$/.test(cfg.GA4_MEASUREMENT_ID || "")) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.GA4_MEASUREMENT_ID}`;
      document.head.appendChild(s);
      gtag("js", new Date());
      gtag("config", cfg.GA4_MEASUREMENT_ID, { variante: cfg.variante, modo: cfg.modo });
      gtag("get", cfg.GA4_MEASUREMENT_ID, "client_id", (v: string) => (idsGA.client = v));
      gtag("get", cfg.GA4_MEASUREMENT_ID, "session_id", (v: string) => (idsGA.sessao = String(v)));
      import("web-vitals").then(({ onLCP, onCLS, onINP }) => {
        const enviar = (m: { name: string; value: number; rating: string }) =>
          gtag("event", "web_vitals", { metric_name: m.name, value: Math.round(m.name === "CLS" ? m.value * 1000 : m.value), rating: m.rating });
        onLCP(enviar); onCLS(enviar); onINP(enviar);
      });
    }
    if (/^\d{8,20}$/.test(cfg.META_PIXEL_ID || "")) {
      /* código base do Pixel da Meta */
      const w = window as any;
      if (!w.fbq) {
        const n: any = (w.fbq = function (...a: unknown[]) { n.callMethod ? n.callMethod(...a) : n.queue.push(a); });
        if (!w._fbq) w._fbq = n;
        n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
        const s = document.createElement("script");
        s.async = true; s.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(s);
      }
      w.fbq("init", cfg.META_PIXEL_ID);
      w.fbq("track", "PageView");
    }
    medirOferta();
  });
}

const escolha = consentimento();
if (escolha === "granted") carregarScripts();
else if (escolha === null) mostrarAviso(true);
if (location.hash === "#cookies") mostrarAviso(true);
