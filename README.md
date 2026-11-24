# Depois da Ceia — site de vendas e app de jogo

Página de vendas (`/`), app para jogar no celular (`/jogar/`), política de privacidade (`/privacidade/`) e página de obrigado (`/obrigado/`).
Vite 8 + Tailwind CSS 4 + TypeScript sem framework, publicado como **Cloudflare Worker com arquivos estáticos**.

```
npm install
npm run dev        # desenvolvimento (http://localhost:5173)
npm run build      # gera as imagens e a pasta dist/
npm run preview    # roda o site pronto com o Worker (http://localhost:4173)
npm run typecheck
```

Para testar localmente com valores falsos: `cp .dev.vars.example .dev.vars`. Com `PERMITIR_TESTE=1`, dá para simular datas: `/?agora=2026-12-25T12:00`.

## Como funciona

- Todo o texto está no HTML gerado no build (Google e robôs de IA leem sem JavaScript).
- O Worker (`worker/index.ts`) roda só em `/`, `/privacidade/` e `/api/*`:
  - troca o título do topo conforme o `utm_content` do anúncio e a data (tabela em `src/compartilhado.ts`);
  - escreve os links de compra com o checkout e os UTMs da visita;
  - mostra "Em breve" nos botões enquanto `CHECKOUT_URL` estiver vazio;
  - recebe o webhook da Cakto em `POST /api/cakto` e manda a compra e o reembolso para o GA4.
- Google Analytics e Pixel da Meta só carregam depois de "Aceitar" no aviso de cookies.

## Publicar (passo a passo, nada disso foi executado)

1. **Registro.br:** registre `depoisdaceia.com.br`.
2. **Cloudflare** (conta do mundopingo.com): Adicionar domínio → `depoisdaceia.com.br` → plano Free. Copie os 2 nameservers.
3. **Registro.br:** em DNS → Alterar servidores DNS, cole os 2 da Cloudflare.
4. No computador, dentro desta pasta: `npm install`, depois `npx wrangler login` (abre o navegador para você entrar na Cloudflare) e `npm run deploy`.
5. Cloudflare → Workers e Pages → `depoisdaceia` → Configurações → Domínios e rotas → **Adicionar → Domínio personalizado**: `depoisdaceia.com.br`. Repita para `www.depoisdaceia.com.br` (o Worker manda o www para o domínio sem www).
6. Segredos (no terminal):
   ```
   npx wrangler secret put GA4_API_SECRET
   npx wrangler secret put CAKTO_WEBHOOK_SECRET
   ```
7. Cloudflare → o Worker → Configurações → **Variáveis e segredos**: preencha `CHECKOUT_URL` (link do checkout da Cakto do kit principal), `GA4_MEASUREMENT_ID` (G-XXXXXXXXXX), `META_PIXEL_ID`, `RESPONSAVEL_NOME` e `RESPONSAVEL_DOCUMENTO`. Salvar e implantar. Para trocar o link do checkout depois, é só editar `CHECKOUT_URL` aqui, sem novo build.
8. Cloudflare → Email → **Roteamento de e-mail**: crie `contato@depoisdaceia.com.br` encaminhando para o seu e-mail.
9. **Cakto** → Integrações → Webhooks → Criar novo webhook: URL `https://depoisdaceia.com.br/api/cakto`, os 3 produtos, eventos `purchase_approved` e `refund`, chave secreta igual à do passo 6. Salve e use "Enviar evento de teste". No GA4 → Administrador → **DebugView**, confira o `purchase` (só aparece se o teste trouxer um `callback`; uma compra de teste de verdade traz).
10. **GA4** → Administrador → Eventos: marque `begin_checkout` e `purchase` como **eventos-chave**.
11. **Google Search Console:** adicione a propriedade de domínio, verifique pelo registro TXT na Cloudflare, envie `https://depoisdaceia.com.br/sitemap.xml` e peça a indexação da página principal.
12. Cloudflare → **AI Crawl Control**: confira que a categoria "Search" está liberada.

Opcional, para não contar a mesma compra duas vezes se a Cakto reenviar o webhook: `npx wrangler kv namespace create DC_KV`, cole o id em `wrangler.jsonc` (bloco `kv_namespaces`, já comentado) e publique de novo.

## Parâmetros dos anúncios

`utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content=VALOR`

| VALOR | Título do topo |
|---|---|
| `a-dor`, `v1-folheando` | Acabou a ceia e todo mundo foi pro celular? |
| `b-oferta` | 72 brincadeiras de Natal e Réveillon por R$ 14,90. |
| `c-bingo` | 200 cartelas de bingo. Nenhuma se repete. |
| `v3-passos` | Comprou hoje, joga hoje. |
| `empresa` | Brincadeiras prontas para a confraternização da equipe. |
| `professora` | A festa de fim de ano da turma, pronta. |
| `d-reveillon` (e todo mundo de 25/12 12h a 01/01 6h) | A virada mais animada da família. |
| qualquer outro | Acabou a ceia? Agora começa a brincadeira. |

## Arquivos importantes

- `index.html` — a página de vendas (os trechos `<!--@...-->` são preenchidos no build por `vite.config.ts`).
- `src/compartilhado.ts` — imagens, variantes por anúncio e datas (usado pelo build e pelo Worker).
- `src/conteudo.ts` — perguntas frequentes (mesmo texto no HTML e no JSON-LD).
- `src/styles/main.css` — tokens da marca e componentes. `DESIGN.md` explica a direção de arte.
- `src/lp/main.ts` — botão fixo, ampliar páginas, consentimento, GA4 e Pixel.
- `src/jogar/` — o app, uma aba por arquivo. `public/jogar/sw.js` — modo sem internet.
- `fonte-img/` — imagens originais; `npm run imagens` gera AVIF e WebP em `public/img/`.
- `public/_headers` — segurança e cache. Se mudar o script inline do `<head>`, atualize o hash na CSP.
