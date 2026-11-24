import { dados, esc, embaralhar, ler, gravar } from "./comum";

type Cartas = {
  mimica: { texto: string }[]; quemSouEu: string[]; vocePrefere: { a: string; b: string }[];
  verdade: string[]; desafio: string[]; maisProvavel: string[]; missoes2027: string[];
  charadas: { pergunta: string; resposta: string }[]; travaLinguas: string[];
};
const BARALHOS: [keyof Cartas, string, string][] = [
  ["mimica", "Mímica", "faça a mímica de"],
  ["quemSouEu", "Quem sou eu?", "na testa de quem joga"],
  ["vocePrefere", "Você prefere?", "você prefere..."],
  ["verdade", "Verdade", "verdade"],
  ["desafio", "Desafio", "desafio"],
  ["maisProvavel", "Quem é mais provável?", "quem é mais provável de..."],
  ["missoes2027", "Missões de 2027", "sua missão"],
  ["charadas", "Charadas", "o que é, o que é?"],
  ["travaLinguas", "Trava-línguas", "três vezes, rápido"],
];

export default async function (tela: HTMLElement) {
  const c = await dados<Cartas>("cartas");
  let deck = ler<keyof Cartas>("cartas_deck", "mimica");
  let ordem: number[] = [], pos = 0, mostrar = false;

  tela.innerHTML = `
    <div class="chips" role="group" aria-label="Baralho">${BARALHOS.map(([k, n]) => `<button type="button" data-deck="${k}">${n}</button>`).join("")}</div>
    <div class="carta-app" aria-live="polite"></div>
    <div class="fila" style="margin-top:16px">
      <button type="button" class="btn grande" data-prox style="flex:1 1 60%">Próxima</button>
      <button type="button" class="btn" data-emb style="flex:1 1 30%;min-height:76px">Embaralhar</button>
    </div>`;
  const carta = tela.querySelector<HTMLElement>(".carta-app")!;

  function novaOrdem() { const n = (c[deck] as unknown[]).length; ordem = embaralhar([...Array(n).keys()]); pos = 0; mostrar = false; }
  function desenhar() {
    tela.querySelectorAll<HTMLButtonElement>("[data-deck]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.deck === deck)));
    const [, nome, rot] = BARALHOS.find(([k]) => k === deck)!;
    const item: any = (c[deck] as unknown[])[ordem[pos]];
    let corpo = "";
    if (deck === "vocePrefere") corpo = `<p class="txt">${esc(item.a)}</p><p class="ou">ou</p><p class="txt">${esc(item.b)}</p>`;
    else if (deck === "charadas") corpo = `<p class="txt">${esc(item.pergunta)}</p>${mostrar ? `<p class="resp">${esc(item.resposta)}</p>` : `<button type="button" class="btn" data-resp>Mostrar resposta</button>`}`;
    else if (deck === "mimica") corpo = `<p class="txt">${esc(item.texto)}</p>`;
    else corpo = `<p class="txt">${esc(item)}</p>`;
    carta.innerHTML = `<span class="rot">${esc(rot)}</span>${corpo}<span class="idx">${pos + 1}/${ordem.length}</span><span class="sr-only">${esc(nome)}</span>`;
  }
  carta.addEventListener("click", (ev) => { if ((ev.target as Element).closest("[data-resp]")) { mostrar = true; desenhar(); } });
  tela.querySelectorAll<HTMLButtonElement>("[data-deck]").forEach((b) => b.addEventListener("click", () => { deck = b.dataset.deck as keyof Cartas; gravar("cartas_deck", deck); novaOrdem(); desenhar(); }));
  tela.querySelector("[data-prox]")!.addEventListener("click", () => { pos = (pos + 1) % ordem.length; if (pos === 0) novaOrdem(); mostrar = false; desenhar(); });
  tela.querySelector("[data-emb]")!.addEventListener("click", () => { novaOrdem(); desenhar(); });
  novaOrdem(); desenhar();
}
