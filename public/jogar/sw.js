// Service worker do app /jogar/: funciona sem internet depois da primeira visita.
const VERSAO = "ddc-jogar-v1";
const BASE = ["/jogar/", "/dados/bingo.json", "/dados/cartas.json", "/dados/quiz.json", "/icones/_mapa.json",
  "/fontes/fraunces-900-normal-v1.woff2", "/fontes/fraunces-800-normal-v1.woff2", "/fontes/figtree-400-normal-v1.woff2",
  "/fontes/figtree-700-normal-v1.woff2", "/fontes/figtree-800-normal-v1.woff2", "/fontes/caveat-700-normal-v1.woff2",
  "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSAO);
    await c.addAll(BASE);
    // arquivos do app (com hash no nome) e ícones das fichas
    const html = await (await fetch("/jogar/")).text();
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
    const mapa = await (await fetch("/icones/_mapa.json")).json();
    const icones = [...new Set(Object.values(mapa))].map((f) => `/icones/${f}`);
    await c.addAll([...new Set([...assets, ...icones])]);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSAO) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // página do app: rede primeiro, cache se estiver sem internet
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(VERSAO).then((c) => c.put("/jogar/", cp)); return r; })
      .catch(() => caches.match("/jogar/")));
    return;
  }
  // demais arquivos: cache primeiro e atualiza por trás
  e.respondWith(caches.open(VERSAO).then(async (c) => {
    const salvo = await c.match(e.request, { ignoreSearch: true });
    const rede = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => salvo);
    return salvo || rede;
  }));
});
