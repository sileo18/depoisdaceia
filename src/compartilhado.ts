// Usado pelo build do HTML (vite.config.ts) e pelo Worker: imagens, variantes por anúncio e data.
import tamanhos from "../public/img/_tamanhos.json" with { type: "json" };

type Tam = { w: number; h: number; larguras: number[] };
const T = tamanhos as Record<string, Tam>;

export const SITE = "https://depoisdaceia.com.br";
export const PRECO = "14,90";

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export interface OpcoesFoto { alt: string; sizes?: string; prioridade?: boolean; classe?: string }

/** <picture> com AVIF + WebP nos tamanhos gerados por scripts/imagens.mjs */
export function foto(nome: string, o: OpcoesFoto): string {
  const t = T[nome];
  if (!t) throw new Error(`imagem desconhecida: ${nome}`);
  const ls = t.larguras;
  const maior = ls[ls.length - 1];
  const h = Math.round((t.h * maior) / t.w);
  const set = (ext: string) => ls.map((w) => `/img/${nome}-${w}.${ext} ${w}w`).join(", ");
  const sizes = o.sizes ?? "(min-width: 1024px) 340px, 64vw";
  const carga = o.prioridade ? `fetchpriority="high"` : `loading="lazy"`;
  return (
    `<picture${o.classe ? ` class="${o.classe}"` : ""}>` +
    `<source type="image/avif" srcset="${set("avif")}" sizes="${sizes}">` +
    `<source type="image/webp" srcset="${set("webp")}" sizes="${sizes}">` +
    `<img src="/img/${nome}-${ls.includes(768) ? 768 : maior}.webp" data-grande="/img/${nome}-${maior}.webp" width="${maior}" height="${h}" alt="${esc(o.alt)}" ${carga} decoding="async">` +
    `</picture>`
  );
}

/** srcset AVIF de uma imagem, para o <link rel="preload"> da imagem LCP */
export function preloadFoto(nome: string, sizes: string): string {
  const t = T[nome];
  const set = t.larguras.map((w) => `/img/${nome}-${w}.avif ${w}w`).join(", ");
  return `<link rel="preload" as="image" type="image/avif" imagesrcset="${set}" imagesizes="${sizes}" fetchpriority="high">`;
}

/** URL da maior versão WebP de uma imagem (para JSON-LD e para ampliar). */
export function fotoGrande(nome: string): string {
  const ls = T[nome].larguras;
  return `/img/${nome}-${ls[ls.length - 1]}.webp`;
}

export const ALT: Record<string, string> = {
  "mimica": "Página do kit com as cartas de mímica para recortar",
  "bingo-cartelas": "Página do kit com quatro cartelas do Bingo de Natal",
  "jogos-minuto": "Página do kit com os desafios de Minuto para ganhar",
  "jogos-mesa": "Página do kit com as brincadeiras À mesa, sem levantar",
  "quiznatal": "Página do kit com as perguntas do Quiz de Natal",
  "caca": "Página do kit com as pistas da caça ao tesouro",
  "historia": "Página do kit com a história da Esquerda e Direita para o amigo secreto",
  "contagem": "Página do kit com a contagem regressiva das 23h50 à meia-noite",
  "quizano": "Página do kit com as perguntas do Quiz do Ano 2026",
  "bingovirada-cartelas": "Página do kit com cartelas do Bingo da Virada",
  "cartela-natal-027": "Cartela número 027 do Bingo de Natal, com figura e nome em cada casa",
  "guia": "Página do guia do anfitrião com o roteiro da noite",
  "placar": "Página do placar por equipes",
  "certificado": "Certificado de Campeão do Natal",
  "celular": "Página que explica como jogar pelo celular",
};

const SIZES_LEQUE = "(min-width: 1024px) 300px, 50vw";
const SIZES_UNICA = "(min-width: 1024px) 420px, 74vw";

export function heroi(tipo: "padrao" | "bingo" | "empresa" | "professora" | "reveillon"): { html: string; preload: string } {
  const fan = (cls: string, nomes: string[], sizes: string) =>
    `<div class="leque ${cls}" aria-label="Páginas reais do kit">` +
    nomes
      .map((n, i) => `<button type="button" class="pagina p${i + 1}" data-zoom="${n}" aria-label="Ampliar: ${esc(ALT[n])}">${foto(n, { alt: ALT[n], sizes, prioridade: i === 0 })}</button>`)
      .join("") +
    `</div>`;
  const conj: Record<string, [string, string[], string]> = {
    padrao: ["", ["mimica", "bingo-cartelas", "jogos-minuto"], SIZES_LEQUE],
    bingo: ["unica", ["cartela-natal-027"], SIZES_UNICA],
    empresa: ["dupla", ["bingo-cartelas", "quiznatal"], SIZES_LEQUE],
    professora: ["dupla", ["bingo-cartelas", "caca"], SIZES_LEQUE],
    reveillon: ["", ["contagem", "quizano", "bingovirada-cartelas"], SIZES_LEQUE],
  };
  const [cls, nomes, sizes] = conj[tipo];
  return { html: fan(cls, nomes, sizes), preload: preloadFoto(nomes[0], sizes) };
}

export interface Variante { h1: string; sub: string; heroi: Parameters<typeof heroi>[0] }

export const SUB_PADRAO = "72 brincadeiras prontas para a família inteira largar o celular e brincar junto, do Natal até a virada. Para imprimir ou jogar no celular.";

export const VARIANTES: Record<string, Variante> = {
  padrao: { h1: "Acabou a ceia? Agora começa a brincadeira.", sub: SUB_PADRAO, heroi: "padrao" },
  "a-dor": { h1: "Acabou a ceia e todo mundo foi pro celular?", sub: "Este ano vai ser diferente: 72 brincadeiras prontas para a família inteira, para imprimir ou jogar no celular.", heroi: "padrao" },
  "b-oferta": { h1: "72 brincadeiras de Natal e Réveillon por R$ 14,90.", sub: "Bingo com 200 cartelas, 60 perguntas de quiz, 304 cartas prontas e o roteiro da noite. Acesso imediato no e-mail.", heroi: "padrao" },
  "c-bingo": { h1: "200 cartelas de bingo. Nenhuma se repete.", sub: "Bingo de Natal e Bingo da Virada com figura e nome escrito, mais 70 brincadeiras para a família toda.", heroi: "bingo" },
  "v3-passos": { h1: "Comprou hoje, joga hoje.", sub: "O kit chega no seu e-mail em minutos. Imprima o que quiser ou jogue direto no celular.", heroi: "padrao" },
  empresa: { h1: "Brincadeiras prontas para a confraternização da equipe.", sub: "Bingo para até 100 pessoas, quiz com placas A, B e C e mímica. No checkout, dá para incluir o Kit Confraternização da Empresa, com 20 dinâmicas.", heroi: "empresa" },
  professora: { h1: "A festa de fim de ano da turma, pronta.", sub: "Bingo com figura e nome escrito, caça ao tesouro com pistas prontas e desafios de 1 minuto. Uso em sala de aula liberado.", heroi: "professora" },
  "d-reveillon": { h1: "A virada mais animada da família.", sub: "Bingo da virada, quiz do ano 2026, previsões para 2027 e um desafio por minuto até a meia-noite.", heroi: "reveillon" },
};
VARIANTES["v1-folheando"] = VARIANTES["a-dor"];

// ----- datas no fuso de São Paulo (UTC−3, sem horário de verão desde 2019) -----
const SP = -3 * 3600 * 1000;
const INICIO_REVEILLON = Date.UTC(2026, 11, 25, 15, 0); // 25/12 12h00 em São Paulo
const FIM_REVEILLON = Date.UTC(2027, 0, 1, 9, 0); // 01/01 06h00 em São Paulo

function diaSP(ms: number): number {
  const d = new Date(ms + SP);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export interface Escolha { chave: string; modo: "natal" | "reveillon"; variante: Variante; linhaData: string }

export function escolher(utmContent: string | null, agoraMs: number): Escolha {
  const reveillon = agoraMs >= INICIO_REVEILLON && agoraMs < FIM_REVEILLON;
  let chave = utmContent && VARIANTES[utmContent] ? utmContent : "padrao";
  if (reveillon || chave === "d-reveillon") chave = "d-reveillon";
  const modo = chave === "d-reveillon" ? "reveillon" : "natal";
  const hoje = diaSP(agoraMs);
  const ano = new Date(agoraMs + SP).getUTCFullYear();
  const dia = 86400000;
  let linhaData = "O kit chega no e-mail em minutos.";
  if (modo === "natal") {
    const n = Math.round((Date.UTC(ano, 11, 25) - hoje) / dia);
    if (n === 1) linhaData = "Hoje é véspera de Natal. O kit chega no e-mail em minutos.";
    else if (n === 0) linhaData = "Hoje é Natal. O kit chega no e-mail em minutos.";
    else if (n > 1 && n <= 45) linhaData = `Faltam ${n} dias para o Natal. O kit chega no e-mail em minutos.`;
  } else {
    const alvo = Date.UTC(ano, 11, 31);
    const n = Math.round((alvo - hoje) / dia);
    if (n === 0) linhaData = "Hoje é a virada. O kit chega no e-mail em minutos.";
    else if (n === 1) linhaData = "Falta 1 dia para a virada. O kit chega no e-mail em minutos.";
    else if (n > 1 && n <= 45) linhaData = `Faltam ${n} dias para a virada. O kit chega no e-mail em minutos.`;
  }
  return { chave, modo, variante: VARIANTES[chave], linhaData };
}

export { PARAMS_REPASSE, linkCheckout } from "./utm.ts";
