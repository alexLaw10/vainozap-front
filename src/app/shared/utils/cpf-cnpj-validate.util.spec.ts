import {
  validarCnpj,
  validarCpf,
  validarCpfCnpj,
  validarTelefone,
} from './cpf-cnpj-validate.util';

// ── validarCpf ─────────────────────────────────────────────────────────────────

describe('validarCpf', () => {
  it('aceita CPF válido sem máscara', () => {
    expect(validarCpf('52998224725')).toBe(true);
  });

  it('aceita CPF válido com máscara (remove não-dígitos)', () => {
    expect(validarCpf('529.982.247-25')).toBe(true);
  });

  it('rejeita CPF com dígitos iguais (sequência)', () => {
    expect(validarCpf('11111111111')).toBe(false);
    expect(validarCpf('00000000000')).toBe(false);
  });

  it('rejeita CPF com comprimento errado', () => {
    expect(validarCpf('1234567890')).toBe(false);   // 10 dígitos
    expect(validarCpf('123456789012')).toBe(false); // 12 dígitos
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(validarCpf('52998224726')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(validarCpf('')).toBe(false);
  });

  it('rejeita CPF com letras substituindo dígitos', () => {
    expect(validarCpf('5299822472A')).toBe(false);
  });
});

// ── validarCnpj ────────────────────────────────────────────────────────────────

describe('validarCnpj', () => {
  it('aceita CNPJ válido sem máscara', () => {
    expect(validarCnpj('11222333000181')).toBe(true);
  });

  it('aceita CNPJ válido com máscara', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
  });

  it('rejeita CNPJ com dígitos iguais (sequência)', () => {
    expect(validarCnpj('00000000000000')).toBe(false);
    expect(validarCnpj('11111111111111')).toBe(false);
  });

  it('rejeita CNPJ com comprimento errado', () => {
    expect(validarCnpj('1122233300018')).toBe(false);   // 13 dígitos
    expect(validarCnpj('112223330001810')).toBe(false); // 15 dígitos
  });

  it('rejeita CNPJ com dígito verificador errado', () => {
    expect(validarCnpj('11222333000182')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(validarCnpj('')).toBe(false);
  });
});

// ── validarCpfCnpj ─────────────────────────────────────────────────────────────

describe('validarCpfCnpj', () => {
  it('delega para validarCpf quando tem 11 dígitos', () => {
    expect(validarCpfCnpj('52998224725')).toBe(true);
    expect(validarCpfCnpj('52998224726')).toBe(false);
  });

  it('delega para validarCnpj quando tem 14 dígitos', () => {
    expect(validarCpfCnpj('11222333000181')).toBe(true);
    expect(validarCpfCnpj('11222333000182')).toBe(false);
  });

  it('aceita entrada com máscara de CPF', () => {
    expect(validarCpfCnpj('529.982.247-25')).toBe(true);
  });

  it('aceita entrada com máscara de CNPJ', () => {
    expect(validarCpfCnpj('11.222.333/0001-81')).toBe(true);
  });

  it('retorna false para quantidade incorreta de dígitos', () => {
    expect(validarCpfCnpj('1234')).toBe(false);
    expect(validarCpfCnpj('123456789012')).toBe(false); // 12 dígitos
  });

  it('retorna false para string vazia', () => {
    expect(validarCpfCnpj('')).toBe(false);
  });
});

// ── validarTelefone ────────────────────────────────────────────────────────────

describe('validarTelefone', () => {
  it('aceita celular com 11 dígitos e DDD válido', () => {
    expect(validarTelefone('11987654321')).toBe(true);
  });

  it('aceita fixo com 10 dígitos e DDD válido', () => {
    expect(validarTelefone('1132451234')).toBe(true);
  });

  it('aceita número com máscara', () => {
    expect(validarTelefone('(11) 9 8765-4321')).toBe(true);
    expect(validarTelefone('(83) 3245-1234')).toBe(true);
  });

  it('rejeita DDD inválido (ex.: 01)', () => {
    expect(validarTelefone('01987654321')).toBe(false);
  });

  it('rejeita número muito curto (< 10 dígitos)', () => {
    expect(validarTelefone('119876543')).toBe(false);
  });

  it('rejeita número muito longo (> 11 dígitos)', () => {
    expect(validarTelefone('119876543210')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(validarTelefone('')).toBe(false);
  });

  it('aceita DDD dos diferentes estados brasileiros', () => {
    expect(validarTelefone('83912345678')).toBe(true);  // PB
    expect(validarTelefone('51912345678')).toBe(true);  // RS
    expect(validarTelefone('61912345678')).toBe(true);  // DF
    expect(validarTelefone('91912345678')).toBe(true);  // PA
  });
});
