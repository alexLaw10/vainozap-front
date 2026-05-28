/**
 * Valida CPF com algoritmo de dígito verificador completo.
 * Aceita apenas a string de 11 dígitos (sem máscara).
 */
export function validarCpf(raw: string): boolean {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // ex.: 111.111.111-11

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += +d[i] * (10 - i);
  let r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  if (r !== +d[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += +d[i] * (11 - i);
  r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  return r === +d[10];
}

/**
 * Valida CNPJ com algoritmo de dígito verificador completo.
 * Aceita apenas a string de 14 dígitos (sem máscara).
 */
export function validarCnpj(raw: string): boolean {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const calcDigit = (s: string, len: number): number => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += +s[len - i] * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  return calcDigit(d, 12) === +d[12] && calcDigit(d, 13) === +d[13];
}

/**
 * Valida CPF (11 dígitos) ou CNPJ (14 dígitos).
 * Retorna `false` se o campo não tiver ainda 11 dígitos.
 */
export function validarCpfCnpj(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11) return validarCpf(digits);
  if (digits.length === 14) return validarCnpj(digits);
  return false;
}

/** DDDs válidos no Brasil (Anatel). */
const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/**
 * Verifica se o DDD dos dois primeiros dígitos do telefone é válido.
 * Exige ao menos 10 dígitos (fixo) ou 11 (celular).
 */
export function validarTelefone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return false;
  const ddd = parseInt(digits.substring(0, 2), 10);
  return DDDS_VALIDOS.has(ddd);
}
