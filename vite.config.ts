import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { foto, fotoGrande, heroi, esc, ALT, SITE } from "./src/compartilhado.ts";
import { FAQ, DESCRICAO_PRODUTO } from "./src/conteudo.ts";

type Brinc = { numero: number; festa: string; secao: string; nome: string; idade: string; tempo: string };

function lista72(): string {
  const dados: Brinc[] = JSON.parse(readFileSync("public/dados/brincadeiras.json", "utf8"));
  const grupos = new Map<string, Brinc[]>();
  for (const b of dados) {
    const k = `${b.festa}|${b.secao}`;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(b);
  }
  let html = `<details class="lista72" data-medir="lista_brincadeiras"><summary>Ver a lista das 72 brincadeiras</summary><div class="conteudo">`;
  for (const [k, itens] of grupos) {
    const [festa, secao] = k.split("|");
    html += `<div class="${festa === "reveillon" ? "rev" : "natal"}"><h3>${festa === "reveillon" ? "Réveillon" : "Natal"} · ${esc(secao)}</h3><ul>`;
    html += itens.map((b) => `<li>${esc(b.nome)} <span>${esc(b.idade)} · ${esc(b.tempo)}</span></li>`).join("");
    html += `</ul></div>`;
  }
  return html + `</div></details>`;
}

function faq(): string {
  return FAQ.map(([q, r], i) => `<details data-faq="${i + 1}"><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join("");
}

function jsonld(): string {
  const imgs = ["mimica", "bingo-cartelas", "jogos-minuto"].map((n) => `${SITE}${fotoGrande(n)}`);
  const grafo = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${SITE}/#org`, name: "Depois da Ceia", url: `${SITE}/`, email: "contato@depoisdaceia.com.br", logo: `${SITE}/apple-touch-icon.png` },
      { "@type": "WebSite", "@id": `${SITE}/#site`, url: `${SITE}/`, name: "Depois da Ceia", inLanguage: "pt-BR", publisher: { "@id": `${SITE}/#org` } },
      {
        "@type": "Product", "@id": `${SITE}/#kit`, name: "Depois da Ceia — Kit de Brincadeiras de Natal e Réveillon",
        description: DESCRICAO_PRODUTO, image: imgs, brand: { "@type": "Brand", name: "Depois da Ceia" }, sku: "ddc-kit",
        offers: {
          "@type": "Offer", url: `${SITE}/`, price: "14.90", priceCurrency: "BRL", availability: "https://schema.org/InStock", priceValidUntil: "2027-01-31",
          seller: { "@id": `${SITE}/#org` },
          hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: "BR", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 7, refundType: "https://schema.org/FullRefund", returnFees: "https://schema.org/FreeReturn" },
        },
      },
      { "@type": "FAQPage", mainEntity: FAQ.map(([q, r]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: r } })) },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(grafo).replace(/</g, "\\u003c")}</script>`;
}

function partes(): Plugin {
  return {
    name: "ddc-partes",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const h = heroi("padrao");
        return html
          .replace("<!--@preload-->", h.preload)
          .replace("<!--@heroi-->", h.html)
          .replace("<!--@jsonld-->", jsonld())
          .replace("<!--@lista72-->", lista72())
          .replace("<!--@faq-->", faq())
          .replace("<!--@cel-->", foto("app-bingo", { alt: "Tela do app do kit com o sorteador do bingo de Natal", sizes: "260px" }))
          .replace(/<!--@pag:([a-z0-9-]+):(-?\d+)-->/g, (_, n, g) =>
            `<button type="button" class="pagina" style="--giro:${g}deg" data-zoom="${n}" aria-label="Ampliar: ${esc(ALT[n])}">${foto(n, { alt: ALT[n] })}</button>`)
          .replace(/<!--@mini:([a-z0-9-]+):([^>]+?)-->/g, (_, n, leg) =>
            `<figure><button type="button" class="pagina" style="--giro:${n.length % 2 ? 2 : -2}deg" data-zoom="${n}" aria-label="Ampliar: ${esc(ALT[n])}">${foto(n, { alt: ALT[n], sizes: "120px" })}</button><figcaption>${esc(leg)}</figcaption></figure>`);
      },
    },
  };
}

/** Coloca o CSS da página de vendas dentro do HTML: tira uma requisição que bloqueia o primeiro desenho. */
function cssInline(): Plugin {
  return {
    name: "ddc-css-inline",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle || !/(^|\/)index\.html$/.test(ctx.filename) || /(jogar|privacidade|obrigado)/.test(ctx.filename)) return html;
        return html.replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g, (tag, arq) => {
          const a = ctx.bundle![arq] as { source?: string | Uint8Array } | undefined;
          if (!a || typeof a.source !== "string") return tag;
          return `<style>${a.source}</style>`;
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [partes(), tailwindcss(), cloudflare(), cssInline()],
  build: { target: "es2022" },
  environments: {
    client: {
      build: {
        rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        jogar: resolve(import.meta.dirname, "jogar/index.html"),
        privacidade: resolve(import.meta.dirname, "privacidade/index.html"),
        obrigado: resolve(import.meta.dirname, "obrigado/index.html"),
          },
        },
      },
    },
  },
});
