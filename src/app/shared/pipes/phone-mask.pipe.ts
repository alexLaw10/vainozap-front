import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formata números de telefone brasileiros para exibição legível.
 *
 * Exemplos:
 *   +5583987665249  → +55 (83) 9 8766-5249
 *   5583987665249   → +55 (83) 9 8766-5249
 *   83987665249     → (83) 9 8766-5249
 *   83912345678     → (83) 9 1234-5678
 *   8332451234      → (83) 3245-1234
 */
@Pipe({ name: 'phoneMask', standalone: true })
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';

    // Remove tudo que não for dígito ou '+'
    const cleaned = value.replace(/[^\d+]/g, '');

    // Extrai apenas os dígitos
    const digits = cleaned.replace(/\D/g, '');

    // +55 (DDD) 9 XXXX-XXXX  →  13 dígitos com 55 na frente
    // +55 (DDD) XXXX-XXXX    →  12 dígitos com 55 na frente
    //    (DDD) 9 XXXX-XXXX   →  11 dígitos (celular)
    //    (DDD) XXXX-XXXX     →  10 dígitos (fixo)

    const hasCountry = digits.startsWith('55') && digits.length >= 12;

    const local = hasCountry ? digits.slice(2) : digits;
    const prefix = hasCountry ? '+55 ' : '';

    if (local.length === 11) {
      // celular: (DDD) 9 XXXX-XXXX
      const ddd   = local.slice(0, 2);
      const nono  = local.slice(2, 3);   // '9'
      const part1 = local.slice(3, 7);
      const part2 = local.slice(7, 11);
      return `${prefix}(${ddd}) ${nono} ${part1}-${part2}`;
    }

    if (local.length === 10) {
      // fixo: (DDD) XXXX-XXXX
      const ddd   = local.slice(0, 2);
      const part1 = local.slice(2, 6);
      const part2 = local.slice(6, 10);
      return `${prefix}(${ddd}) ${part1}-${part2}`;
    }

    // Formato desconhecido — devolve o original
    return value;
  }
}
