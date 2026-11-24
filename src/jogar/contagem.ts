import { dados, esc } from "./comum";

type Item = { hora: string; desafio: string };

export default async function (tela: HTMLElement) {
  const c = await dados<{ contagemRegressiva: Item[] }>("cartas");
  const itens = c.contagemRegressiva;
  tela.innerHTML = `
    <p class="dica">Falta para a virada:</p>
    <p class="relogio" style="font-size:clamp(3.2rem,16vw,7rem)" role="timer" aria-live="off"></p>
    <div class="desafio-agora" aria-live="polite" hidden></div>
    <h2 style="margin-top:24px;font-size:1.3rem">Um desafio por minuto, das 23h50 à meia-noite</h2>
    <ol class="lista-contagem">${itens.map((it, k) => `<li data-k="${k}"><b>${esc(it.hora)}</b><span>${esc(it.desafio)}</span></li>`).join("")}</ol>`;
  const rel = tela.querySelector<HTMLElement>(".relogio")!;
  const agoraBox = tela.querySelector<HTMLElement>(".desafio-agora")!;
  let ultimo = -2;

  function alvo(): Date {
    const d = new Date();
    // depois da virada (até 1º/1 às 6h) mostra zero; senão conta até o próximo 1º de janeiro
    const ano = d.getMonth() === 0 && d.getDate() === 1 && d.getHours() < 6 ? d.getFullYear() : d.getFullYear() + 1;
    return new Date(ano, 0, 1, 0, 0, 0);
  }
  function indiceAgora(d: Date): number {
    if (d.getMonth() === 11 && d.getDate() === 31 && d.getHours() === 23 && d.getMinutes() >= 50) return d.getMinutes() - 50;
    if (d.getMonth() === 0 && d.getDate() === 1 && d.getHours() === 0 && d.getMinutes() < 5) return itens.length - 1;
    return -1;
  }
  function tique() {
    const d = new Date();
    const ms = Math.max(0, alvo().getTime() - d.getTime());
    const s = Math.floor(ms / 1000);
    const dias = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    rel.textContent = ms === 0 ? "Feliz 2027!" : `${dias ? `${dias}d ` : ""}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    const k = indiceAgora(d);
    if (k !== ultimo) {
      ultimo = k;
      tela.querySelectorAll("li[data-k]").forEach((li) => li.classList.toggle("agora", Number((li as HTMLElement).dataset.k) === k));
      if (k >= 0) { agoraBox.hidden = false; agoraBox.innerHTML = `<p class="hora">${esc(itens[k].hora)}</p><p>${esc(itens[k].desafio)}</p>`; }
      else agoraBox.hidden = true;
    }
  }
  tique();
  const t = setInterval(tique, 1000);
  return () => clearInterval(t);
}
