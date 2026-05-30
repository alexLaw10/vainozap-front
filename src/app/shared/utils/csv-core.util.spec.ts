import {
  buildCsvContent,
  buildCsvTemplate,
  csvToBool,
  csvToFloat,
  csvToInt,
  escapeCsvField,
  normalizeCsvHeader,
  parseCsv,
  parseCsvLine,
} from './csv-core.util';
import type { CsvSchema } from './csv-core.util';

// ── normalizeCsvHeader ─────────────────────────────────────────────────────────

describe('normalizeCsvHeader', () => {
  it('converte para minúsculas', () => {
    expect(normalizeCsvHeader('Nome')).toBe('nome');
  });

  it('remove acentos', () => {
    expect(normalizeCsvHeader('Código')).toBe('codigo');
    expect(normalizeCsvHeader('Descrição')).toBe('descricao');
    expect(normalizeCsvHeader('Preço')).toBe('preco');
  });

  it('substitui espaços por underscore', () => {
    expect(normalizeCsvHeader('Nome Completo')).toBe('nome_completo');
  });

  it('colapsa múltiplos espaços em único underscore', () => {
    // \s+ faz match em grupos, então dois espaços viram apenas um "_"
    expect(normalizeCsvHeader('múltiplos  espaços')).toBe('multiplos_espacos');
  });

  it('remove espaços nas extremidades', () => {
    expect(normalizeCsvHeader('  nome  ')).toBe('nome');
  });

  it('processa string já normalizada sem alterar', () => {
    expect(normalizeCsvHeader('preco_custo')).toBe('preco_custo');
  });
});

// ── parseCsvLine ───────────────────────────────────────────────────────────────

describe('parseCsvLine', () => {
  it('separa campos simples por vírgula', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('preserva campo entre aspas com vírgula interna', () => {
    expect(parseCsvLine('"a,b",c')).toEqual(['a,b', 'c']);
  });

  it('trata aspas duplas dentro de campo entre aspas como escape', () => {
    expect(parseCsvLine('"diz ""olá""",fim')).toEqual(['diz "olá"', 'fim']);
  });

  it('faz trim nos campos sem aspas', () => {
    expect(parseCsvLine('  a ,  b  , c  ')).toEqual(['a', 'b', 'c']);
  });

  it('retorna array com um elemento para linha sem vírgula', () => {
    expect(parseCsvLine('somente')).toEqual(['somente']);
  });

  it('trata campo vazio corretamente', () => {
    expect(parseCsvLine('a,,c')).toEqual(['a', '', 'c']);
  });

  it('preserva quebra de linha dentro de campo entre aspas', () => {
    const result = parseCsvLine('"linha1\nlinha2",fim');
    expect(result[0]).toBe('linha1\nlinha2');
    expect(result[1]).toBe('fim');
  });
});

// ── escapeCsvField ─────────────────────────────────────────────────────────────

describe('escapeCsvField', () => {
  it('devolve valor simples sem aspas', () => {
    expect(escapeCsvField('simples')).toBe('simples');
  });

  it('envolve com aspas quando contém vírgula', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
  });

  it('envolve com aspas e escapa aspas duplas internas', () => {
    expect(escapeCsvField('diz "olá"')).toBe('"diz ""olá"""');
  });

  it('envolve com aspas quando contém nova linha', () => {
    expect(escapeCsvField('linha1\nlinha2')).toBe('"linha1\nlinha2"');
  });

  it('não altera string vazia', () => {
    expect(escapeCsvField('')).toBe('');
  });
});

// ── csvToBool ──────────────────────────────────────────────────────────────────

describe('csvToBool', () => {
  it.each([['true'], ['1'], ['sim'], ['yes'], ['s']])(
    'retorna true para "%s"',
    (v) => expect(csvToBool(v)).toBe(true),
  );

  it.each([['TRUE'], ['SIM'], ['YES'], ['S'], ['True']])(
    'é case-insensitive: "%s" → true',
    (v) => expect(csvToBool(v)).toBe(true),
  );

  it.each([['false'], ['0'], ['nao'], ['no'], ['n'], ['qualquer']])(
    'retorna false para "%s"',
    (v) => expect(csvToBool(v)).toBe(false),
  );

  it('retorna fallback padrão (false) para string vazia', () => {
    expect(csvToBool('')).toBe(false);
  });

  it('retorna fallback customizado para string vazia', () => {
    expect(csvToBool('', true)).toBe(true);
  });
});

// ── csvToFloat ─────────────────────────────────────────────────────────────────

describe('csvToFloat', () => {
  it('converte inteiro', () => {
    expect(csvToFloat('42')).toBe(42);
  });

  it('converte decimal com ponto', () => {
    expect(csvToFloat('1.99')).toBe(1.99);
  });

  it('converte decimal com vírgula (padrão BR)', () => {
    expect(csvToFloat('1,99')).toBe(1.99);
  });

  it('converte string com vírgula decimal simples após strip de não-dígitos', () => {
    // csvToFloat faz replace de ',' por '.' e strip de não-dígitos/ponto/hífen.
    // "1,99" → "1.99" → 1.99
    expect(csvToFloat('1,99')).toBeCloseTo(1.99);
  });

  it('retorna null para string não numérica', () => {
    expect(csvToFloat('abc')).toBeNull();
  });

  it('retorna null para string vazia', () => {
    expect(csvToFloat('')).toBeNull();
  });

  it('converte número negativo', () => {
    expect(csvToFloat('-5.5')).toBe(-5.5);
  });
});

// ── csvToInt ───────────────────────────────────────────────────────────────────

describe('csvToInt', () => {
  it('converte inteiro positivo', () => {
    expect(csvToInt('10')).toBe(10);
  });

  it('converte zero', () => {
    expect(csvToInt('0')).toBe(0);
  });

  it('converte inteiro negativo', () => {
    expect(csvToInt('-3')).toBe(-3);
  });

  it('trunca parte decimal', () => {
    expect(csvToInt('7.9')).toBe(7);
  });

  it('retorna null para string não numérica', () => {
    expect(csvToInt('abc')).toBeNull();
  });

  it('retorna null para string vazia', () => {
    expect(csvToInt('')).toBeNull();
  });
});

// ── parseCsv ───────────────────────────────────────────────────────────────────

interface SimpleRow {
  nome: string;
  qtd: number;
}

const simpleSchema: CsvSchema<SimpleRow, void> = {
  entityName: 'Item',
  fields: [
    { key: 'nome', required: true },
    { key: 'qtd',  required: true },
  ],
  parseRow: (raw) => {
    const errors: string[] = [];
    const qtd = csvToInt(raw['qtd'] ?? '');
    if (!raw['nome']) errors.push('nome obrigatório');
    if (qtd === null)  errors.push('qtd inválido');
    return errors.length ? { errors, warnings: [] } : { data: { nome: raw['nome'], qtd: qtd! }, errors: [], warnings: [] };
  },
  formatRow: (item) => ({ nome: item.nome, qtd: String(item.qtd) }),
};

describe('parseCsv', () => {
  it('retorna empty quando arquivo tem menos de 2 linhas', () => {
    const result = parseCsv('nome,qtd', simpleSchema, undefined);
    expect(result.rows).toHaveLength(0);
    expect(result.validCount).toBe(0);
  });

  it('parseia linhas válidas corretamente', () => {
    const csv = 'nome,qtd\nMaçã,5\nBanana,3';
    const result = parseCsv(csv, simpleSchema, undefined);
    expect(result.validCount).toBe(2);
    expect(result.errorCount).toBe(0);
    expect(result.rows[0].data).toEqual({ nome: 'Maçã', qtd: 5 });
  });

  it('normaliza cabeçalhos (case-insensitive, sem acentos)', () => {
    const csv = 'Nome,Qtd\nCopo,2';
    const result = parseCsv(csv, simpleSchema, undefined);
    expect(result.validCount).toBe(1);
  });

  it('retorna erro quando coluna obrigatória está ausente', () => {
    const csv = 'nome,preco\nitem,10';
    const result = parseCsv(csv, simpleSchema, undefined);
    expect(result.errorCount).toBe(1);
    expect(result.rows[0].errors[0]).toContain('qtd');
  });

  it('registra linha de erro quando parseRow retorna erros', () => {
    const csv = 'nome,qtd\n,abc';
    const result = parseCsv(csv, simpleSchema, undefined);
    expect(result.errorCount).toBe(1);
    expect(result.rows[0].errors).not.toHaveLength(0);
  });

  it('contabiliza warnCount corretamente', () => {
    const schemaComAviso: CsvSchema<SimpleRow, void> = {
      ...simpleSchema,
      parseRow: (raw) => ({
        data: { nome: raw['nome'], qtd: 1 },
        errors: [],
        warnings: raw['nome'] === 'aviso' ? ['tem aviso'] : [],
      }),
    };
    const csv = 'nome,qtd\naviso,1\nnormal,1';
    const result = parseCsv(csv, schemaComAviso, undefined);
    expect(result.warnCount).toBe(1);
    expect(result.validCount).toBe(2);
  });

  it('suporta quebra de linha \\r\\n', () => {
    const csv = 'nome,qtd\r\nFigo,7\r\n';
    const result = parseCsv(csv, simpleSchema, undefined);
    expect(result.validCount).toBe(1);
  });

  it('ignora linhas em branco', () => {
    const csv = 'nome,qtd\n\nManga,2\n\n';
    const result = parseCsv(csv, simpleSchema, undefined);
    expect(result.validCount).toBe(1);
  });

  it('atribui número de linha a partir de 2 (após cabeçalho)', () => {
    const csv = 'nome,qtd\n,x';
    const result = parseCsv(csv, simpleSchema, undefined);
    expect(result.rows[0].line).toBe(2);
  });
});

// ── buildCsvContent ────────────────────────────────────────────────────────────

describe('buildCsvContent', () => {
  it('gera cabeçalho + linhas de dados', () => {
    const items: SimpleRow[] = [{ nome: 'Uva', qtd: 4 }];
    const content = buildCsvContent(items, simpleSchema, undefined);
    const lines = content.split('\n');
    expect(lines[0]).toBe('nome,qtd');
    expect(lines[1]).toBe('Uva,4');
  });

  it('escapa campos com vírgula', () => {
    const items: SimpleRow[] = [{ nome: 'Nome, com vírgula', qtd: 1 }];
    const content = buildCsvContent(items, simpleSchema, undefined);
    expect(content).toContain('"Nome, com vírgula"');
  });

  it('retorna apenas cabeçalho para lista vazia', () => {
    const content = buildCsvContent([], simpleSchema, undefined);
    expect(content).toBe('nome,qtd');
  });
});

// ── buildCsvTemplate ───────────────────────────────────────────────────────────

describe('buildCsvTemplate', () => {
  it('gera template com cabeçalho e linhas de exemplo', () => {
    const schema: CsvSchema<SimpleRow, void> = {
      ...simpleSchema,
      templateRows: [['Exemplo', '10']],
    };
    const result = buildCsvTemplate(schema);
    expect(result).toBe('nome,qtd\nExemplo,10');
  });

  it('gera apenas cabeçalho quando não há templateRows', () => {
    const schema: CsvSchema<SimpleRow, void> = { ...simpleSchema, templateRows: undefined };
    expect(buildCsvTemplate(schema)).toBe('nome,qtd');
  });
});
