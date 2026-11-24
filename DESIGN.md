# DESIGN.md — Depois da Ceia

## Direction

- **Leitura do projeto:** kit digital de brincadeiras de Natal e Réveillon para quem organiza a festa da família (mulheres de 25 a 55, no celular, vindas de anúncio). Trabalho da página: levar ao checkout de R$ 14,90.
- **Nome da direção:** Almanaque de festa.
- **Macroestrutura:** coluna editorial longa, numerada como almanaque (nº 01 a nº 08), com páginas reais do kit giradas sobre o papel quebrando a grade. Topo dividido no desktop (texto à esquerda, leque de páginas à direita).
- **Personalidade tipográfica:** serifada editorial (Fraunces 800/900) nos títulos, sans humanista (Figtree 400/700/800) no texto, letra à mão (Caveat 700) só em notas curtas.
- **Família de paleta:** papel quente + quatro tintas. Tomate = ação (botões, preço). Pinho = segunda cor. Anil = só Réveillon. Mostarda = só sombra e fundo.
- **Movimento:** contido. Entrada curta do topo, carimbo do selo de preço, revelações por CSS. Nada se mexe sozinho depois disso.
- **Padrão rejeitado:** topo centralizado com pílula de "novidade", Inter, gradiente roxo ou azul, três cards brancos iguais com sombra difusa, vidro fosco, ícones de emoji ou 3D.
- **Elemento-assinatura:** o leque de páginas reais no topo e o selo de preço em estrela de 24 pontas.
- **Exceção registrada:** as skills de design desaconselham fundo creme. Aqui o papel creme é a marca aprovada pelo dono do produto e é a mesma do PDF entregue.

## Tokens (papéis, não valores)

```yaml
color:
  papel:        "#F3E9D6"   # fundo da página
  papel-claro:  "#FBF6EC"   # caixas, cartões, áreas de leitura
  tomate:       "#D23C26"   # ação: botões, preço, faixa listrada. Texto só ≥ 24 px ou ≥ 19 px negrito
  tomate-texto: "#B0301E"   # vermelho para texto pequeno (5,3:1 no papel)
  pinho:        "#1F5841"   # segunda cor, bloco "sem impressora", foco
  mostarda:     "#E5A52A"   # sombra de título e fundo de etiqueta. Nunca texto
  anil:         "#253B78"   # só Réveillon
  tinta:        "#26201B"   # texto principal (13,4:1)
  tinta-2:      "#5A4E44"   # texto secundário (6,7:1)
  linha:        "#BFAE95"   # divisórias decorativas. Nunca texto
font:
  display: Fraunces 800/900
  sans:    Figtree 400/700/800 (corpo ≥ 17 px no celular)
  mao:     Caveat 700 (só notas)
space: escala de 4 px; 64 px entre seções no celular, 112 px no desktop
radius: 0 a 6 px
shadow:
  pagina: "12px 16px 0 rgb(38 32 27 / .18)"   # sólida, nunca difusa
  titulo: "6px 6px 0 mostarda"                 # text-shadow
motion:
  rapido: 150ms   normal: 250ms   lento: 350ms   curva: cubic-bezier(.16,1,.3,1)
```

## Não faça
- Gradientes coloridos, vidro fosco, sombra difusa, cards brancos arredondados.
- Três colunas iguais de ícones; grade de cards iguais em "O que tem dentro" (é sequência alternada).
- Pílula de "novo" centralizada, emojis como ilustração, ícones 3D, foto de banco de imagem.
- Texto em mostarda ou linha. Texto tomate pequeno (use tomate-texto).
- Carrossel automático, pop-up de saída, chat flutuante, menu de navegação.
- Avaliações, estrelas, contadores, "de/por", cronômetro de oferta.
- Ângulos aleatórios a cada visita: cada imagem tem um ângulo fixo.
