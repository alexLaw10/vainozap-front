/**
 * csv-core.util.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Primitivos genéricos de CSV reutilizáveis em qualquer domínio.
 *
 * Uso típico por domínio:
 *   1. Defina um CsvSchema<T, TCtx> com campos, validação e formatação.
 *   2. Chame parseCsv(text, schema, context) para importação.
 *   3. Chame exportToCsv(items, schema, context, filename) para exportação.
 *   4. Chame downloadCsvTemplate(schema) para gerar o modelo vazio.
 */

// ── Tipos públicos ─────────────────────────────────────────────────────────────

/** Definição de um campo para exibição na UI (chips de colunas, cabeçalho do template). */
export interface CsvFieldDef {
  /** Nome da coluna no CSV (case-insensitive no parse). */
  key: string;
  /** Rótulo amigável para exibição. */
  label?: string;
  required?: boolean;
  /** Dica extra exibida na UI (ex.: "true/false"). */
  hint?: string;
}

/** Uma linha lida + validada. */
export interface CsvRowResult<T> {
  /** Número da linha no arquivo original (1-based, começa em 2 = após cabeçalho). */
  line: number;
  /** Valores brutos da linha (chave = header normalizado). */
  raw: Record<string, string>;
  /** Erros bloqueantes — linha NÃO será importada. */
  errors: string[];
  /** Avisos não-bloqueantes — linha será importada com ajustes. */
  warnings: string[];
  /** Dado tipado já validado. Presente apenas quando errors.length === 0. */
  data?: T;
}

/** Resultado completo do parse de um arquivo CSV. */
export interface CsvParseResult<T> {
  rows: CsvRowResult<T>[];
  validCount: number;
  errorCount: number;
  /** Linhas válidas que possuem pelo menos um aviso. */
  warnCount: number;
}

/**
 * Schema que descreve como um tipo T se mapeia para/de CSV.
 *
 * TCtx = contexto externo necessário para parse/format (ex.: mapa de categorias).
 * Use `void` se não precisar de contexto.
 */
export interface CsvSchema<T, TCtx = void> {
  /** Nome do domínio — usado em mensagens e no nome do arquivo. */
  entityName: string;

  /** Definições de campos para a UI (chips, cabeçalho do template). */
  fields: CsvFieldDef[];

  /**
   * Converte uma linha raw (já normalizada) em { data, errors, warnings }.
   * Deve retornar `data` apenas quando não houver erros bloqueantes.
   */
  parseRow: (raw: Record<string, string>, ctx: TCtx) => {
    data?: T;
    errors: string[];
    warnings: string[];
  };

  /**
   * Serializa um item T para um Record<coluna, valor_string>.
   * As colunas devem corresponder a `fields[].key`.
   */
  formatRow: (item: T, ctx: TCtx) => Record<string, string>;

  /** Linhas de exemplo para o template (sem o cabeçalho). */
  templateRows?: string[][];
}

// ── Helpers internos ───────────────────────────────────────────────────────────

/** Normaliza um cabeçalho: minúsculas, sem acentos, espaços → _. */
export function normalizeCsvHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_');
}

/** Parser de linha CSV respeitando campos entre aspas. */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/** Escapa um valor para uso em CSV (adiciona aspas se necessário). */
export function escapeCsvField(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

// ── API pública ────────────────────────────────────────────────────────────────

/**
 * Parseia um texto CSV usando o schema fornecido.
 *
 * @param text    Conteúdo bruto do arquivo .csv
 * @param schema  Schema do domínio
 * @param ctx     Contexto externo (mapas de lookup, etc.)
 */
export function parseCsv<T, TCtx = void>(
  text: string,
  schema: CsvSchema<T, TCtx>,
  ctx: TCtx,
): CsvParseResult<T> {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter(l => l.trim().length > 0);

  const empty: CsvParseResult<T> = { rows: [], validCount: 0, errorCount: 0, warnCount: 0 };
  if (lines.length < 2) return empty;

  const rawHeaders = parseCsvLine(lines[0]).map(normalizeCsvHeader);
  const requiredKeys = schema.fields.filter(f => f.required).map(f => f.key);
  const missing = requiredKeys.filter(k => !rawHeaders.includes(k));

  if (missing.length > 0) {
    return {
      rows: [{
        line: 1,
        raw: {},
        errors: [`Cabeçalho inválido — colunas obrigatórias ausentes: ${missing.join(', ')}`],
        warnings: [],
      }],
      validCount: 0,
      errorCount: 1,
      warnCount: 0,
    };
  }

  const rows: CsvRowResult<T>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const raw: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => { raw[h] = cols[idx] ?? ''; });

    const { data, errors, warnings } = schema.parseRow(raw, ctx);
    rows.push({ line: i + 1, raw, errors, warnings, data });
  }

  const validCount = rows.filter(r => r.errors.length === 0).length;
  const warnCount  = rows.filter(r => r.errors.length === 0 && r.warnings.length > 0).length;
  return { rows, validCount, errorCount: rows.length - validCount, warnCount };
}

/**
 * Serializa uma lista de itens para string CSV.
 *
 * @param items   Lista de dados tipados
 * @param schema  Schema do domínio
 * @param ctx     Contexto externo
 */
export function buildCsvContent<T, TCtx = void>(
  items: T[],
  schema: CsvSchema<T, TCtx>,
  ctx: TCtx,
): string {
  const headers = schema.fields.map(f => f.key);
  const headerLine = headers.join(',');

  const dataLines = items.map(item => {
    const row = schema.formatRow(item, ctx);
    return headers.map(h => escapeCsvField(row[h] ?? '')).join(',');
  });

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Gera o conteúdo do template (cabeçalho + linhas de exemplo) como string CSV.
 */
export function buildCsvTemplate<T, TCtx = void>(
  schema: CsvSchema<T, TCtx>,
): string {
  const headerLine = schema.fields.map(f => f.key).join(',');
  const rows = schema.templateRows ?? [];
  return [headerLine, ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Dispara o download de um arquivo CSV no browser.
 *
 * @param filename  Nome do arquivo (sem extensão ou com .csv)
 * @param content   Conteúdo CSV puro
 */
export function downloadCsv(filename: string, content: string): void {
  const name  = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const bom   = '﻿'; // BOM UTF-8 para Excel reconhecer acentos
  const blob  = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = name;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Conversores utilitários (usados pelos schemas de domínio) ─────────────────

export function csvToBool(v: string, fallback = false): boolean {
  if (!v) return fallback;
  return ['true', '1', 'sim', 'yes', 's'].includes(v.toLowerCase().trim());
}

export function csvToFloat(v: string): number | null {
  const n = parseFloat(v.replace(',', '.').replace(/[^\d.-]/g, ''));
  return isNaN(n) ? null : n;
}

export function csvToInt(v: string): number | null {
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}
