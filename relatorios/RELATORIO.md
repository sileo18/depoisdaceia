# Relatório de testes — site Depois da Ceia

Testado em 24/11/2026 no build de produção (`npm run build` + `npm run preview`, com o Worker rodando localmente no workerd da Cloudflare).

## Definição de pronto

| Item | Resultado |
|---|---|
| `npm run build` e `npx tsc --noEmit` | sem erro |
| Texto, título, descrição, canonical e JSON-LD no HTML do servidor | sim: `curl -A GPTBot` e `-A Googlebot` mostram a página inteira, com Organization, WebSite, Product (Offer + política de devolução, sem avaliações) e FAQPage |
| Lighthouse mobile `/` | Desempenho 99, Acessibilidade 100, Boas práticas 100, SEO 100. LCP 1,0 s, CLS 0,018, TBT 100 ms |
| Lighthouse desktop `/` | 100 em tudo. LCP 0,6 s |
| Lighthouse mobile `/jogar/` | Desempenho 98, Acessibilidade 100, Boas práticas 100, SEO 63 (é de propósito: a página tem `noindex`, porque é só para quem comprou) |
| axe-core | 0 violações em `/` (390 e 1440 px), nas 5 abas do app testadas, em `/privacidade/` e `/obrigado/` |
| Teclado | ordem lógica, foco visível em tudo, "Pular para a oferta" é o primeiro, a imagem ampliada abre com Enter e fecha com Esc devolvendo o foco (`teclado.txt`) |
| Consentimento | antes de aceitar: 0 requisições para Google e Meta. Depois: GA4 (`view_item`, `begin_checkout` com `cta_local`, `faq_open`, `web_vitals`) e Pixel (`PageView`, `ViewContent`, `CliqueComprar`). Recusar depois de aceitar apaga os cookies `_ga` e `_fb` |
| ux-guardrails | 0 críticos, 1 aviso documentado (as fontes "Reserva" são só métricas de fonte de reserva) |
| Sem estouro lateral | conferido em 320, 360, 375, 390, 414, 768, 1024, 1280 e 1440 px |
| Links e imagens locais | 106 conferidos, nenhum faltando |

## Variantes por anúncio e data (`variantes.txt`)

As 16 combinações deram o título, a linha de data e a imagem certos, com o canonical sempre `https://depoisdaceia.com.br/`. Inclui: véspera de Natal, Natal antes do meio-dia (mantém o título do anúncio), 25/12 às 12h00 (vira Réveillon para todos), 31/12 ("Hoje é a virada"), 01/01 às 5h59 (ainda Réveillon) e às 6h00 (volta ao padrão).

## Botões de compra

- Sem `CHECKOUT_URL`: todos mostram "Em breve", sem link, marcados como desativados.
- Com `CHECKOUT_URL`: link do checkout com `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` e `fbclid` repassados, sem duplicar e descartando parâmetros que não são de rastreio.
- Com consentimento, o clique acrescenta `callback=<client_id>~<session_id>` do GA4. Sem consentimento, não acrescenta.

## Webhook `/api/cakto`

| Caso | Resposta |
|---|---|
| Chave secreta errada | 401 |
| `purchase_approved` sem `callback` | 200, nada enviado ao GA4 |
| `purchase_approved` com `callback` | 200, `purchase` enviado; o validador do GA4 (`/debug/mp/collect`) respondeu sem nenhuma mensagem de erro |
| `refund` | 200, `refund` enviado |
| Outro evento (`pix_gerado`) | 200, ignorado |
| GET | 405 |

Nenhum dado do comprador (nome, e-mail, documento) é enviado ou registrado. **Falta testar com um webhook real da Cakto**: a documentação avisa que o evento de teste não traz todos os campos de uma compra real.

## App `/jogar/`

- Cartela nº 027 do Natal: primeira linha Pisca-pisca, Gorro, Coroa, Bola de Natal, Cartinha, igual à impressa.
- Sorteio sem repetir ficha, desfazer, recomeçar com confirmação, leitura em voz alta opcional.
- Sem internet: as 7 abas abrem depois da primeira visita, inclusive os 24 ícones da cartela.
- Com o armazenamento do navegador bloqueado: tudo funciona (guarda na memória da aba), sem erros.

## O que foi corrigido entre a primeira e a última rodada de capturas

1. O topo estourava para a direita no celular (a faixa de números fazia a coluna crescer). Corrigido com `min-width: 0`.
2. A etiqueta "Acesso imediato · Pix ou cartão · Garantia" saía cortada: agora quebra em duas linhas.
3. O botão da oferta quebrava "R$ / 14,90" em telas estreitas: o texto não quebra mais e o espaço interno diminui abaixo de 380 px.
4. O selo de preço passava da tela em 768 px: reposicionado.
5. O LCP era o aviso de cookies (3,3 s), porque o título entrava com animação. Tirei a animação do topo e coloquei o CSS da página dentro do HTML: LCP caiu para 1,0 s.
6. axe apontou três contrastes: o número "04" mostarda sobre o verde, o número da cartela no app e a faixa de números rolável sem foco. Os três corrigidos.
7. Imagens das páginas no meio da página reduzidas no celular (64% da largura) para a página ficar menos comprida.

## Auditoria de conversão (roteiro da skill `conversion-audit`)

- **Ordem:** problema → mecanismo → prova → objeção "sem impressora" → oferta → dúvidas → chamada final. Passa no teste de embaralhar: trocar "a oferta" com "a cena" quebra o argumento.
- **Texto:** sem palavras de IA da lista da skill. Títulos com número e resultado concreto. O mesmo botão em todos os pontos.
- **Visual:** uma cor de ação (tomate) só em botões e preço; sem gradiente, vidro, cards iguais ou emojis.
- **Conversão:** botão no topo, no meio, na oferta, no fim e fixo no celular. Prova colada à afirmação (página real ao lado de cada item; os 4 itens verificáveis antes do botão do meio). Garantia e "pagamento pela Cakto" junto do botão da oferta.
- **O que ainda falta e só vem com o tempo:** prova de clientes reais. Quando houver compras, vale pedir fotos e frases reais (com autorização) para pôr ao lado da oferta. Nada foi inventado.

## Limites desta rodada

- Não houve teste com leitor de tela de verdade (TalkBack ou VoiceOver): a árvore de acessibilidade foi conferida pelo axe e pelo Lighthouse, e a navegação por teclado foi feita. Vale uma passada de 5 minutos no seu celular depois de publicar.
- Os números de velocidade são de laboratório (no computador, sem compressão). Em produção a Cloudflare comprime o HTML e o CSS; os números de campo aparecem no Search Console depois de algumas semanas de visitas.
- Nada foi publicado, nenhuma conta foi criada e nenhum DNS foi alterado.
