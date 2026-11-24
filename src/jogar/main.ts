// App /jogar/: troca de abas pelo endereço (#bingo, #cartela...), cada aba carregada quando é aberta.
import type { Aba } from "./comum";

const ABAS: Record<string, { titulo: string; carregar: () => Promise<{ default: Aba }> }> = {
  bingo: { titulo: "Bingo", carregar: () => import("./bingo") },
  cartela: { titulo: "Minha cartela", carregar: () => import("./cartela") },
  cronometro: { titulo: "Cronômetro", carregar: () => import("./cronometro") },
  placar: { titulo: "Placar", carregar: () => import("./placar") },
  cartas: { titulo: "Cartas", carregar: () => import("./cartas") },
  quiz: { titulo: "Quiz", carregar: () => import("./quiz") },
  contagem: { titulo: "Virada", carregar: () => import("./contagem") },
};

const tela = document.getElementById("tela")!;
const titulo = document.getElementById("titulo-aba")!;
let atual = "";
let limpar: (() => void) | null = null;

async function abrir(nome: string, focar: boolean) {
  if (!ABAS[nome]) nome = "bingo";
  if (nome === atual) return;
  atual = nome;
  limpar?.(); limpar = null;
  document.querySelectorAll<HTMLAnchorElement>(".abas a").forEach((a) => { if (a.dataset.aba === nome) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  titulo.textContent = ABAS[nome].titulo;
  document.title = `${ABAS[nome].titulo} | Depois da Ceia`;
  tela.innerHTML = `<p class="carregando">Carregando…</p>`;
  try {
    const mod = await ABAS[nome].carregar();
    if (atual !== nome) return;
    tela.innerHTML = "";
    const r = (await mod.default(tela)) as unknown;
    if (typeof r === "function") limpar = r as () => void;
  } catch {
    tela.innerHTML = `<p class="carregando">Não deu para abrir esta aba. Confira a internet e tente de novo.</p>`;
  }
  if (focar) tela.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

addEventListener("hashchange", () => abrir(location.hash.slice(1), true));
abrir(location.hash.slice(1) || "bingo", false);

// funciona sem internet: service worker só para /jogar/
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("/jogar/sw.js", { scope: "/jogar/" }).catch(() => {});
}
// deixa todas as abas no cache depois de carregar a primeira
const quando = (fn: () => void) => ("requestIdleCallback" in window ? (window as any).requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 2500));
addEventListener("load", () => quando(() => {
  Object.values(ABAS).forEach((a) => a.carregar().catch(() => {}));
  ["bingo", "cartas", "quiz"].forEach((n) => fetch(`/dados/${n}.json`).catch(() => {}));
}));
