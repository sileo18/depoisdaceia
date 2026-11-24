import { bipe, anunciar } from "./comum";

export default function (tela: HTMLElement) {
  let total = 60, resta = 60_000, fim = 0, rodando = false, raf = 0;
  let trava: any = null;

  tela.innerHTML = `
    <div class="chips" role="group" aria-label="Tempo">
      ${[30, 60, 90, 120].map((s) => `<button type="button" data-s="${s}">${s} s</button>`).join("")}
    </div>
    <p class="relogio" role="timer" aria-live="off">60</p>
    <div class="fila">
      <button type="button" class="btn grande" data-iniciar style="flex:1 1 60%">Começar</button>
      <button type="button" class="btn" data-zerar style="flex:1 1 30%;min-height:76px">Zerar</button>
    </div>
    <p class="dica" style="margin-top:12px">Apita e vibra quando o tempo acaba. A tela não apaga enquanto o tempo corre.</p>`;

  const rel = tela.querySelector<HTMLElement>(".relogio")!;
  const btn = tela.querySelector<HTMLButtonElement>("[data-iniciar]")!;

  const mostrar = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    rel.textContent = s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : String(s);
    rel.classList.toggle("fim", ms <= 0);
  };
  const chips = () => tela.querySelectorAll<HTMLButtonElement>("[data-s]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.s) === total)));

  async function travar(on: boolean) {
    try {
      if (on && "wakeLock" in navigator) trava = await (navigator as any).wakeLock.request("screen");
      else { await trava?.release(); trava = null; }
    } catch { /* o navegador não deixou */ }
  }
  function passo() {
    const ms = fim - performance.now();
    if (ms <= 0) { rodando = false; resta = 0; mostrar(0); btn.textContent = "Começar"; bipe(); anunciar("Tempo esgotado"); travar(false); return; }
    mostrar(ms); raf = requestAnimationFrame(passo);
  }
  btn.addEventListener("click", () => {
    if (rodando) { rodando = false; cancelAnimationFrame(raf); resta = fim - performance.now(); btn.textContent = "Continuar"; travar(false); return; }
    if (resta <= 0) resta = total * 1000;
    rodando = true; fim = performance.now() + resta; btn.textContent = "Pausar"; travar(true); passo();
  });
  tela.querySelector("[data-zerar]")!.addEventListener("click", () => { rodando = false; cancelAnimationFrame(raf); resta = total * 1000; mostrar(resta); btn.textContent = "Começar"; travar(false); });
  tela.querySelectorAll<HTMLButtonElement>("[data-s]").forEach((b) => b.addEventListener("click", () => {
    total = Number(b.dataset.s); rodando = false; cancelAnimationFrame(raf); resta = total * 1000; mostrar(resta); btn.textContent = "Começar"; chips(); travar(false);
  }));
  chips(); mostrar(resta);
  return () => { cancelAnimationFrame(raf); travar(false); };
}
