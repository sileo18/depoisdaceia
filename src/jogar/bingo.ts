import { dados, icone, esc, ler, gravar, anunciar, confirmar } from "./comum";

type Pool = { nome: string; icone: string }[];
type Bingo = Record<"natal" | "virada", { pool: Pool; cartelas: number[][] }>;

export default async function (tela: HTMLElement) {
  const b = await dados<Bingo>("bingo");
  let modo = ler<"natal" | "virada">("bingo_modo", "natal");
  let voz = ler<boolean>("bingo_voz", false);
  const sorteadas = () => ler<number[]>(`bingo_${modo}`, []);

  tela.innerHTML = `
    <div class="chips" role="group" aria-label="Qual bingo">
      <button type="button" data-modo="natal">Bingo de Natal</button>
      <button type="button" data-modo="virada">Bingo da Virada</button>
    </div>
    <div class="sorteada" aria-live="polite"></div>
    <button type="button" class="btn grande" data-sortear>Sortear</button>
    <div class="fila" style="margin-top:14px">
      <button type="button" class="btn" data-desfazer>Desfazer</button>
      <button type="button" class="btn" data-recomecar>Recomeçar</button>
      <button type="button" class="btn" data-voz aria-pressed="false">Ler em voz alta</button>
    </div>
    <h2 class="mt-6 text-[1.3rem]" style="margin-top:24px">Já saíram</h2>
    <ul class="historico"></ul>`;

  const caixa = tela.querySelector<HTMLElement>(".sorteada")!;
  const hist = tela.querySelector<HTMLElement>(".historico")!;
  const btnSortear = tela.querySelector<HTMLButtonElement>("[data-sortear]")!;
  const btnVoz = tela.querySelector<HTMLButtonElement>("[data-voz]")!;

  async function desenhar() {
    document.body.classList.toggle("virada-on", modo === "virada");
    tela.querySelectorAll<HTMLButtonElement>("[data-modo]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.modo === modo)));
    btnVoz.setAttribute("aria-pressed", String(voz));
    const pool = b[modo].pool, s = sorteadas();
    btnSortear.disabled = s.length >= pool.length;
    if (!s.length) {
      caixa.innerHTML = `<p class="nome" style="font-size:1.6rem">Toque em Sortear</p><p class="cont">${pool.length} fichas no pote</p>`;
    } else {
      const f = pool[s[s.length - 1]];
      caixa.innerHTML = `<div class="ic">${await icone(f.icone)}</div><p class="nome">${esc(f.nome)}</p><p class="cont">${s.length} de ${pool.length} fichas</p>`;
    }
    const itens = await Promise.all([...s].reverse().map(async (i) => `<li>${await icone(pool[i].icone)}<span>${esc(pool[i].nome)}</span></li>`));
    hist.innerHTML = itens.join("") || `<li style="grid-column:1/-1">Nenhuma ficha ainda.</li>`;
  }

  tela.querySelectorAll<HTMLButtonElement>("[data-modo]").forEach((x) => x.addEventListener("click", () => { modo = x.dataset.modo as any; gravar("bingo_modo", modo); desenhar(); }));
  btnSortear.addEventListener("click", () => {
    const pool = b[modo].pool, s = sorteadas();
    const resto = pool.map((_, i) => i).filter((i) => !s.includes(i));
    if (!resto.length) return;
    const i = resto[Math.floor(Math.random() * resto.length)];
    s.push(i); gravar(`bingo_${modo}`, s);
    anunciar(pool[i].nome);
    if (voz && "speechSynthesis" in window) {
      try { const u = new SpeechSynthesisUtterance(pool[i].nome); u.lang = "pt-BR"; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { /* sem voz */ }
    }
    desenhar();
  });
  tela.querySelector<HTMLButtonElement>("[data-desfazer]")!.addEventListener("click", () => { const s = sorteadas(); s.pop(); gravar(`bingo_${modo}`, s); desenhar(); });
  confirmar(tela.querySelector<HTMLButtonElement>("[data-recomecar]")!, () => { gravar(`bingo_${modo}`, []); desenhar(); anunciar("Bingo recomeçado"); });
  btnVoz.addEventListener("click", () => { voz = !voz; gravar("bingo_voz", voz); desenhar(); });
  await desenhar();
  return () => document.body.classList.remove("virada-on");
}
