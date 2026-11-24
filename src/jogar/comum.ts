// Utilidades compartilhadas pelas abas do app.
export const $ = <T extends Element = HTMLElement>(s: string, raiz: ParentNode = document) => raiz.querySelector<T>(s)!;

// memória da sessão: se o navegador bloquear o armazenamento, o app continua funcionando até fechar a aba
const memoria = new Map<string, string>();
export function ler<T>(chave: string, padrao: T): T {
  let v: string | null | undefined = memoria.get(chave);
  if (v === undefined) { try { v = localStorage.getItem(`dc_${chave}`); } catch { v = null; } }
  try { return v ? (JSON.parse(v) as T) : padrao; } catch { return padrao; }
}
export function gravar(chave: string, valor: unknown) {
  const s = JSON.stringify(valor);
  memoria.set(chave, s);
  try { localStorage.setItem(`dc_${chave}`, s); } catch { /* sem armazenamento: fica só na memória */ }
}

const cacheJson = new Map<string, Promise<any>>();
export function dados<T = any>(nome: string): Promise<T> {
  if (!cacheJson.has(nome)) cacheJson.set(nome, fetch(`/dados/${nome}.json`).then((r) => r.json()));
  return cacheJson.get(nome)!;
}

let mapa: Promise<Record<string, string>> | null = null;
const cacheIcone = new Map<string, Promise<string>>();
export async function icone(id: string): Promise<string> {
  mapa ??= fetch("/icones/_mapa.json").then((r) => r.json());
  if (!cacheIcone.has(id)) {
    cacheIcone.set(id, mapa.then((m) => (m[id] ? fetch(`/icones/${m[id]}`).then((r) => r.text()) : "")));
  }
  return cacheIcone.get(id)!;
}

export function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function anunciar(txt: string) {
  const el = document.getElementById("anuncio");
  if (el) { el.textContent = ""; setTimeout(() => (el.textContent = txt), 30); }
}

/** Botão que pede um segundo toque para confirmar (sem pop-up). */
export function confirmar(btn: HTMLButtonElement, acao: () => void, aviso = "Toque de novo para confirmar") {
  const original = btn.textContent;
  let armado = false, t = 0;
  btn.addEventListener("click", () => {
    if (!armado) {
      armado = true; btn.textContent = aviso; btn.classList.add("alerta");
      t = window.setTimeout(() => { armado = false; btn.textContent = original; btn.classList.remove("alerta"); }, 4000);
      return;
    }
    clearTimeout(t); armado = false; btn.textContent = original; btn.classList.remove("alerta"); acao();
  });
}

export function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function bipe() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    [0, 0.28, 0.56].forEach((d) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.type = "square";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.22);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.24);
    });
  } catch { /* sem áudio */ }
  try { navigator.vibrate?.([200, 100, 200, 100, 400]); } catch { /* sem vibração */ }
}

export type Aba = (tela: HTMLElement) => Promise<void | (() => void)> | void | (() => void);
