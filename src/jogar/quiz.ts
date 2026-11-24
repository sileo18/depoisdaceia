import { dados, esc, ler, gravar } from "./comum";

type Q = { pergunta: string; opcoes: string[]; correta: number };

export default async function (tela: HTMLElement) {
  const q = await dados<Record<"natal" | "ano2026", Q[]>>("quiz");
  let qual = ler<"natal" | "ano2026">("quiz_qual", "natal");
  let i = ler<number>(`quiz_i_${qual}`, 0);
  let ver = false;

  tela.innerHTML = `
    <div class="chips" role="group" aria-label="Qual quiz">
      <button type="button" data-q="natal">Quiz de Natal</button>
      <button type="button" data-q="ano2026">Quiz do Ano 2026</button>
    </div>
    <div class="caixa-quiz" aria-live="polite"></div>
    <div class="fila" style="margin-top:16px">
      <button type="button" class="btn" data-ant>Anterior</button>
      <button type="button" class="btn pinho" data-ver>Mostrar resposta</button>
      <button type="button" class="btn" data-prox>Próxima</button>
    </div>`;
  const caixa = tela.querySelector<HTMLElement>(".caixa-quiz")!;

  function desenhar() {
    tela.querySelectorAll<HTMLButtonElement>("[data-q]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.q === qual)));
    const lista = q[qual], p = lista[i];
    caixa.innerHTML = `<p class="dica"><b>${i + 1} de ${lista.length}</b></p><p class="pergunta">${esc(p.pergunta)}</p>
      <ol class="opcoes">${p.opcoes.map((o, k) => `<li class="${ver && k === p.correta ? "certa" : ""}"><b>${"ABC"[k]}</b><span>${esc(o)}</span></li>`).join("")}</ol>`;
    tela.querySelector<HTMLButtonElement>("[data-ant]")!.disabled = i === 0;
    tela.querySelector<HTMLButtonElement>("[data-prox]")!.disabled = i === lista.length - 1;
    tela.querySelector<HTMLButtonElement>("[data-ver]")!.textContent = ver ? "Esconder resposta" : "Mostrar resposta";
    gravar(`quiz_i_${qual}`, i);
  }
  tela.querySelectorAll<HTMLButtonElement>("[data-q]").forEach((b) => b.addEventListener("click", () => { qual = b.dataset.q as any; gravar("quiz_qual", qual); i = ler(`quiz_i_${qual}`, 0); ver = false; desenhar(); }));
  tela.querySelector("[data-ant]")!.addEventListener("click", () => { if (i > 0) { i--; ver = false; desenhar(); } });
  tela.querySelector("[data-prox]")!.addEventListener("click", () => { if (i < q[qual].length - 1) { i++; ver = false; desenhar(); } });
  tela.querySelector("[data-ver]")!.addEventListener("click", () => { ver = !ver; desenhar(); });
  desenhar();
}
