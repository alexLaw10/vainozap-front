import { PhoneMaskPipe } from './phone-mask.pipe';

describe('PhoneMaskPipe', () => {
  let pipe: PhoneMaskPipe;

  beforeEach(() => {
    pipe = new PhoneMaskPipe();
  });

  // ── valores nulos / vazios ────────────────────────────────────────────────────
  it('retorna "—" para null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('retorna "—" para undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('retorna "—" para string vazia', () => {
    expect(pipe.transform('')).toBe('—');
  });

  // ── celular com código do país (+55) ─────────────────────────────────────────
  it('formata "+5583987665249" → "+55 (83) 9 8766-5249"', () => {
    expect(pipe.transform('+5583987665249')).toBe('+55 (83) 9 8766-5249');
  });

  it('formata "5583987665249" (sem sinal +) → "+55 (83) 9 8766-5249"', () => {
    expect(pipe.transform('5583987665249')).toBe('+55 (83) 9 8766-5249');
  });

  it('formata celular SP com código país → "+55 (11) 9 8765-4321"', () => {
    expect(pipe.transform('5511987654321')).toBe('+55 (11) 9 8765-4321');
  });

  // ── celular sem código do país (11 dígitos) ───────────────────────────────────
  it('formata "83987665249" → "(83) 9 8766-5249"', () => {
    expect(pipe.transform('83987665249')).toBe('(83) 9 8766-5249');
  });

  it('formata "83912345678" → "(83) 9 1234-5678"', () => {
    expect(pipe.transform('83912345678')).toBe('(83) 9 1234-5678');
  });

  // ── fixo sem código do país (10 dígitos) ─────────────────────────────────────
  it('formata "8332451234" → "(83) 3245-1234"', () => {
    expect(pipe.transform('8332451234')).toBe('(83) 3245-1234');
  });

  it('formata "1132451234" → "(11) 3245-1234"', () => {
    expect(pipe.transform('1132451234')).toBe('(11) 3245-1234');
  });

  // ── fixo com código do país (12 dígitos) ─────────────────────────────────────
  it('formata "558332451234" → "+55 (83) 3245-1234"', () => {
    expect(pipe.transform('558332451234')).toBe('+55 (83) 3245-1234');
  });

  // ── entrada com máscara já aplicada ──────────────────────────────────────────
  it('processa entrada com parênteses e hifens: "(83) 9 8766-5249"', () => {
    expect(pipe.transform('(83) 9 8766-5249')).toBe('(83) 9 8766-5249');
  });

  // ── formato desconhecido ──────────────────────────────────────────────────────
  it('devolve o valor original para formato não reconhecido', () => {
    expect(pipe.transform('123')).toBe('123');
  });

  it('devolve o valor original para número de 9 dígitos', () => {
    expect(pipe.transform('987654321')).toBe('987654321');
  });
});
