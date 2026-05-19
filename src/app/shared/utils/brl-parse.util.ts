/**
 * Converte texto tipo "1.234,56" ou "R$ 0,00" em número.
 * Vazio ⇒ `0`. Inválido ⇒ `null`.
 */
export function parseBrlInputToNumber(raw: string): number | null {
  const s = raw.trim();
  if (s === '') return 0;
  const only = s.replace(/[^\d,.-]/g, '');
  if (!only) return null;
  const lastComma = only.lastIndexOf(',');
  const lastDot = only.lastIndexOf('.');
  let norm = only;
  if (lastComma > lastDot) {
    norm = only.replace(/\./g, '').replace(',', '.');
  } else {
    norm = only.replace(/,/g, '');
  }
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}
