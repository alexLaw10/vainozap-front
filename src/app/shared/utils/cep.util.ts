/** Mantém só dígitos e limita a 8 (CEP Brasil). */
export function normalizeCepDigits(input: string): string {
  return input.replace(/\D/g, '').slice(0, 8);
}

/** Formata sequência de dígitos como `00000-000` para exibição. */
export function formatCepMask(digits: string): string {
  const d = normalizeCepDigits(digits);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
