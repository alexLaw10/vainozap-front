import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formata CPF ou CNPJ automaticamente com base no número de dígitos.
 *
 * Exemplos:
 *   12345678909    → 123.456.789-09   (CPF  — 11 dígitos)
 *   12345678000195 → 12.345.678/0001-95  (CNPJ — 14 dígitos)
 */
@Pipe({ name: 'doc', standalone: true })
export class DocPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';

    const digits = value.replace(/\D/g, '');

    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    return value;
  }
}
