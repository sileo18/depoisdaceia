// Gera AVIF e WebP em 480, 768 e 1000 px a partir de fonte-img/ para public/img/.
// Também grava public/img/_tamanhos.json (largura e altura de cada imagem), usado pelo build do HTML.
import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync, statSync, writeFileSync } from "node:fs";
import { join, parse } from "node:path";

const SRC = "fonte-img";
const OUT = "public/img";
const LARGURAS = [480, 768, 1000];
mkdirSync(OUT, { recursive: true });

const tamanhos = {};
for (const arq of readdirSync(SRC).filter((f) => /\.(webp|png|jpe?g)$/.test(f))) {
  const nome = parse(arq).name;
  const origem = join(SRC, arq);
  const meta = await sharp(origem).metadata();
  tamanhos[nome] = { w: meta.width, h: meta.height, larguras: [] };
  for (const w of LARGURAS) {
    const larg = Math.min(w, meta.width);
    tamanhos[nome].larguras.push(larg);
    for (const [ext, opts] of [["avif", { quality: 52, effort: 4 }], ["webp", { quality: 74 }]]) {
      const destino = join(OUT, `${nome}-${larg}.${ext}`);
      if (existsSync(destino) && statSync(destino).mtimeMs > statSync(origem).mtimeMs) continue;
      await sharp(origem).resize({ width: larg })[ext](opts).toFile(destino);
    }
  }
  tamanhos[nome].larguras = [...new Set(tamanhos[nome].larguras)];
}
writeFileSync(join(OUT, "_tamanhos.json"), JSON.stringify(tamanhos, null, 1));
console.log(`imagens: ${Object.keys(tamanhos).length} originais processadas`);
