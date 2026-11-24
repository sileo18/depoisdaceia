import { dados, icone, esc, ler, gravar } from "./comum";

type Bingo = Record<"natal" | "virada", { pool: { nome: string; icone: string }[]; cartelas: number[][] }>;

export default async function (tela: HTMLElement) {
  const b = await dados<Bingo>("bingo");
  let modo = ler<"natal" | "virada">("cartela_modo", "natal");
  let num = ler<number>("cartela_num", 1);

  tela.innerHTML = `
    <div class="chips" role="group" aria-label="Qual bingo">
      <button type="button" data-modo="natal">Bingo de Natal</button>
      <button type="button" data-modo="virada">Bingo da Virada</button>
    </div>
    <div class="campo">
      <label for="num-cartela">Número da cartela</label>
      <input id="num-cartela" type="number" inputmode="numeric" min="1" max="100" value="${num}">
      <span class="dica">de 1 a 100, o mesmo da cartela impressa</span>
    </div>
    <div class="cartela"></div>
    <div class="fila" style="margin-top:14px"><button type="button" class="btn" data-limpar>Limpar cartela</button></div>
    <p class="dica" style="margin-top:10px">Toque numa casa para marcar. Toque de novo para desmarcar.</p>`;

  const caixa = tela.querySelector<HTMLElement>(".cartela")!;
  const campo = tela.querySelector<HTMLInputElement>("#num-cartela")!;
  const chaveMarcas = () => `cartela_${modo}_${num}`;

  async function desenhar() {
    document.body.classList.toggle("virada-on", modo === "virada");
    tela.querySelectorAll<HTMLButtonElement>("[data-modo]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.modo === modo)));
    const { pool, cartelas } = b[modo];
    const idx = cartelas[num - 1];
    const marcas = new Set(ler<number[]>(chaveMarcas(), []));
    const casas: string[] = [];
    let k = 0;
    for (let pos = 0; pos < 25; pos++) {
      const col = (pos % 5) + 1;
      if (pos === 12) { casas.push(`<div class="casa livre c3" aria-label="Livre">LIVRE</div>`); continue; }
      const f = pool[idx[k]];
      casas.push(`<button type="button" class="casa c${col}" data-k="${k}" aria-pressed="${marcas.has(k)}">${await icone(f.icone)}<span>${esc(f.nome)}</span></button>`);
      k++;
    }
    const titulo = modo === "natal" ? "Bingo de Natal" : "Bingo da Virada";
    caixa.innerHTML = `<div class="cab"><b>${titulo}</b><span>cartela ${String(num).padStart(3, "0")}</span></div>
      <div class="letras" aria-hidden="true"><b>B</b><b>I</b><b>N</b><b>G</b><b>O</b></div>
      <div class="grade">${casas.join("")}</div>
      <p class="cod">BINGO-${modo.toUpperCase()}-${String(num).padStart(3, "0")}</p>`;
  }

  caixa.addEventListener("click", (ev) => {
    const c = (ev.target as Element).closest<HTMLButtonElement>("button.casa");
    if (!c) return;
    const k = Number(c.dataset.k);
    const marcas = new Set(ler<number[]>(chaveMarcas(), []));
    marcas.has(k) ? marcas.delete(k) : marcas.add(k);
    gravar(chaveMarcas(), [...marcas]);
    c.setAttribute("aria-pressed", String(marcas.has(k)));
  });
  campo.addEventListener("change", () => {
    const n = Math.round(Number(campo.value));
    num = Math.min(100, Math.max(1, Number.isFinite(n) ? n : 1));
    campo.value = String(num); gravar("cartela_num", num); desenhar();
  });
  tela.querySelectorAll<HTMLButtonElement>("[data-modo]").forEach((x) => x.addEventListener("click", () => { modo = x.dataset.modo as any; gravar("cartela_modo", modo); desenhar(); }));
  tela.querySelector("[data-limpar]")!.addEventListener("click", () => { gravar(chaveMarcas(), []); desenhar(); });
  await desenhar();
  return () => document.body.classList.remove("virada-on");
}
