import { ler, gravar, esc, confirmar } from "./comum";

type Equipe = { nome: string; pts: number };

export default function (tela: HTMLElement) {
  let eq = ler<Equipe[]>("placar", [{ nome: "Equipe 1", pts: 0 }, { nome: "Equipe 2", pts: 0 }]);
  const salvar = () => gravar("placar", eq);

  tela.innerHTML = `
    <div class="equipes" aria-live="polite"></div>
    <div class="fila" style="margin-top:16px">
      <button type="button" class="btn pinho" data-mais>+ Equipe</button>
      <button type="button" class="btn" data-menos>− Equipe</button>
      <button type="button" class="btn" data-ordenar>Ordenar por pontos</button>
      <button type="button" class="btn" data-zerar>Zerar pontos</button>
    </div>
    <p class="dica" style="margin-top:10px">De 2 a 6 equipes. Toque no nome para mudar.</p>`;
  const lista = tela.querySelector<HTMLElement>(".equipes")!;

  function desenhar() {
    lista.innerHTML = eq.map((e, i) => `
      <div class="equipe">
        <input aria-label="Nome da equipe ${i + 1}" value="${esc(e.nome)}" data-i="${i}" maxlength="24">
        <button type="button" class="btn" data-menos1="${i}" aria-label="Tirar 1 ponto de ${esc(e.nome)}">−</button>
        <span class="pts" aria-label="${e.pts} pontos">${e.pts}</span>
        <button type="button" class="btn pinho" data-mais1="${i}" aria-label="Dar 1 ponto para ${esc(e.nome)}">+</button>
      </div>`).join("");
    tela.querySelector<HTMLButtonElement>("[data-mais]")!.disabled = eq.length >= 6;
    tela.querySelector<HTMLButtonElement>("[data-menos]")!.disabled = eq.length <= 2;
  }
  lista.addEventListener("click", (ev) => {
    const t = ev.target as HTMLElement;
    const mais = t.closest<HTMLElement>("[data-mais1]"), menos = t.closest<HTMLElement>("[data-menos1]");
    if (mais) eq[Number(mais.dataset.mais1)].pts++;
    else if (menos) eq[Number(menos.dataset.menos1)].pts--;
    else return;
    salvar(); desenhar();
  });
  lista.addEventListener("change", (ev) => {
    const inp = ev.target as HTMLInputElement;
    if (inp.dataset.i) { eq[Number(inp.dataset.i)].nome = inp.value.trim() || `Equipe ${Number(inp.dataset.i) + 1}`; salvar(); desenhar(); }
  });
  tela.querySelector("[data-mais]")!.addEventListener("click", () => { if (eq.length < 6) { eq.push({ nome: `Equipe ${eq.length + 1}`, pts: 0 }); salvar(); desenhar(); } });
  tela.querySelector("[data-menos]")!.addEventListener("click", () => { if (eq.length > 2) { eq.pop(); salvar(); desenhar(); } });
  tela.querySelector("[data-ordenar]")!.addEventListener("click", () => { eq.sort((a, b) => b.pts - a.pts); salvar(); desenhar(); });
  confirmar(tela.querySelector<HTMLButtonElement>("[data-zerar]")!, () => { eq = eq.map((e) => ({ ...e, pts: 0 })); salvar(); desenhar(); });
  desenhar();
}
