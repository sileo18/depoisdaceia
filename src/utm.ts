// Parâmetros que seguem da visita para o checkout (sem duplicar o que já estiver no link).
export const PARAMS_REPASSE = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "src", "sck"];

export function linkCheckout(base: string, entrada: URLSearchParams): string {
  const u = new URL(base);
  for (const p of PARAMS_REPASSE) {
    const v = entrada.get(p);
    if (v && !u.searchParams.has(p)) u.searchParams.set(p, v.slice(0, 200));
  }
  return u.toString();
}
