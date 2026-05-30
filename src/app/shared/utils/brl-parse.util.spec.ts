import { parseBrlInputToNumber } from './brl-parse.util';

describe('parseBrlInputToNumber', () => {
  // ── string vazia ─────────────────────────────────────────────────────────────
  it('retorna 0 para string vazia', () => {
    expect(parseBrlInputToNumber('')).toBe(0);
  });

  it('retorna 0 para string só com espaços', () => {
    expect(parseBrlInputToNumber('   ')).toBe(0);
  });

  // ── formato brasileiro (vírgula decimal) ─────────────────────────────────────
  it('converte "1,99" (vírgula decimal)', () => {
    expect(parseBrlInputToNumber('1,99')).toBe(1.99);
  });

  it('converte "1.234,56" (ponto milhar, vírgula decimal)', () => {
    expect(parseBrlInputToNumber('1.234,56')).toBeCloseTo(1234.56);
  });

  it('converte "R$ 1.234,56" (com prefixo monetário)', () => {
    expect(parseBrlInputToNumber('R$ 1.234,56')).toBeCloseTo(1234.56);
  });

  it('converte "0,00"', () => {
    expect(parseBrlInputToNumber('0,00')).toBe(0);
  });

  // ── formato padrão (ponto decimal) ───────────────────────────────────────────
  it('converte "1.99" (ponto decimal)', () => {
    expect(parseBrlInputToNumber('1.99')).toBe(1.99);
  });

  it('converte "1234.56" (sem separador de milhar)', () => {
    expect(parseBrlInputToNumber('1234.56')).toBeCloseTo(1234.56);
  });

  // ── inteiros ──────────────────────────────────────────────────────────────────
  it('converte inteiro puro "42"', () => {
    expect(parseBrlInputToNumber('42')).toBe(42);
  });

  it('interpreta "1.000" como 1 (ponto como decimal, sem vírgula posterior)', () => {
    // sem vírgula, lastComma < lastDot → caminho "remove vírgulas" → Number('1.000') = 1
    expect(parseBrlInputToNumber('1.000')).toBe(1);
  });

  it('converte "1.000,00" como 1000 (ponto milhar, vírgula decimal)', () => {
    expect(parseBrlInputToNumber('1.000,00')).toBeCloseTo(1000);
  });

  // ── entradas inválidas ────────────────────────────────────────────────────────
  it('retorna null para texto sem dígitos', () => {
    expect(parseBrlInputToNumber('abc')).toBeNull();
  });

  it('retorna null para apenas símbolos especiais', () => {
    expect(parseBrlInputToNumber('R$')).toBeNull();
  });

  // ── negativos ─────────────────────────────────────────────────────────────────
  it('converte valor negativo "-5,50"', () => {
    expect(parseBrlInputToNumber('-5,50')).toBe(-5.5);
  });

  it('converte valor negativo "-1.000,00"', () => {
    expect(parseBrlInputToNumber('-1.000,00')).toBeCloseTo(-1000);
  });
});
