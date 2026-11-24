import { chromium } from "playwright-core";
import { AxeBuilder } from "@axe-core/playwright";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const out = [];
for (const [url, w] of [["/", 390], ["/", 1440], ["/jogar/#bingo", 390], ["/jogar/#cartela", 390], ["/jogar/#placar", 390], ["/jogar/#cartas", 390], ["/jogar/#quiz", 390], ["/privacidade/", 390], ["/obrigado/", 390]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, reducedMotion: "reduce" });
  const pg = await ctx.newPage();
  await pg.goto("http://localhost:4173" + url, { waitUntil: "networkidle" });
  await pg.waitForTimeout(700);
  if (url === "/") { await pg.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true))); }
  const r = await new AxeBuilder({ page: pg }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  out.push(`${url} @${w}px: ${r.violations.length} violações, ${r.passes.length} regras ok` + r.violations.map((v) => `\n  - ${v.id} (${v.impact}): ${v.nodes.length} nós — ${v.nodes[0].target}`).join(""));
  await ctx.close();
}
console.log(out.join("\n"));
await b.close();
