/**
 * csv-product-parser.util.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Schema CSV para o domínio de Produtos.
 * Toda a lógica genérica (parse de linha, download, build) vive em csv-core.util.ts.
 *
 * Para criar um schema de outro domínio (estoque, pedidos, vendas):
 *   1. Crie um novo arquivo  <dominio>-csv.util.ts
 *   2. Defina um CsvSchema<T, TCtx> com parseRow + formatRow + fields
 *   3. Use parseCsv / buildCsvContent / downloadCsv do csv-core
 */

import type { ProdutoApi } from '../../../core/models/catalog-api.model';
import {
  type CsvFieldDef,
  type CsvParseResult,
  type CsvRowResult,
  type CsvSchema,
  buildCsvContent,
  buildCsvTemplate,
  csvToBool,
  csvToFloat,
  csvToInt,
  downloadCsv,
  parseCsv,
} from '../../../shared/utils/csv-core.util';

// ── Re-exports para manter compatibilidade com os imports existentes ───────────

export type CsvRow    = CsvRowResult<ProdutoApi>;
export type ParsedCsv = CsvParseResult<ProdutoApi>;
export type { CsvFieldDef };

// ── Contexto necessário para parse e formatação ───────────────────────────────

/** `categoryMap`: nome/slug → categoryId (para import) */
export type ProductCsvImportCtx = Map<string, string | null>;

/** `categoryNameMap`: categoryId → nome (para export) */
export type ProductCsvExportCtx = Map<string, string>;

// ── Definição dos campos (usada pela UI nos chips de colunas) ─────────────────

export const PRODUCT_CSV_FIELDS: CsvFieldDef[] = [
  { key: 'nome',      required: true  },
  { key: 'preco',     required: true  },
  { key: 'descricao'                  },
  { key: 'categoria'                  },
  { key: 'estoque'                    },
  { key: 'ativo',     hint: 'true/false' },
  { key: 'destaque',  hint: 'true/false' },
  { key: 'novo',      hint: 'true/false' },
];

export const PRODUCT_EXPORT_FIELDS: CsvFieldDef[] = [
  { key: 'id'         },
  { key: 'nome'       },
  { key: 'descricao'  },
  { key: 'preco'      },
  { key: 'categoria'  },
  { key: 'estoque'    },
  { key: 'ativo'      },
  { key: 'destaque'   },
  { key: 'novo'       },
  { key: 'semEstoque' },
  { key: 'fotos'      },
];

// ── Schema de importação ──────────────────────────────────────────────────────

const PRODUCT_IMPORT_SCHEMA: CsvSchema<ProdutoApi, ProductCsvImportCtx> = {
  entityName: 'produtos',
  fields: PRODUCT_CSV_FIELDS,

  templateRows: [
    ['Camiseta Básica', 'Camiseta 100% algodão manga curta', '49.90', 'Roupas',  '100', 'true',  'false', 'false'],
    ['Tênis Casual',    'Solado emborrachado e confortável',  '189.90', 'Calçados', '30', 'true',  'true',  'true' ],
    ['Caneca Porcelana','Caneca 300ml com estampa exclusiva', '32.50',  'Casa',     '50', 'true',  'false', 'false'],
  ],

  parseRow(raw, categoryMap) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // nome
    const nome = raw['nome']?.trim() ?? '';
    if (!nome || nome.length < 2) errors.push('Nome obrigatório (mín. 2 caracteres)');
    if (nome.length > 200)        errors.push('Nome muito longo (máx. 200 caracteres)');

    // preco
    const precoRaw = raw['preco'] ?? '';
    const preco = csvToFloat(precoRaw);
    if (preco === null)           errors.push(`Preço inválido: "${precoRaw}"`);
    if (preco !== null && preco < 0) errors.push('Preço não pode ser negativo');

    // estoque
    const estoqueRaw = raw['estoque'] ?? '';
    const estoque = estoqueRaw ? csvToInt(estoqueRaw) : 0;
    if (estoque === null)         errors.push(`Estoque inválido: "${estoqueRaw}"`);

    // categoria — não encontrada vira aviso, não erro
    let categoryId: string | null = null;
    const catInput = raw['categoria']?.trim() ?? '';
    if (catInput) {
      const normalized = catInput.toLowerCase();
      let found = false;
      for (const [key, id] of categoryMap.entries()) {
        if (key.toLowerCase() === normalized) { categoryId = id; found = true; break; }
      }
      if (!found) {
        warnings.push(`Categoria "${catInput}" não encontrada — produto será importado sem categoria`);
      }
    }

    if (errors.length > 0) return { errors, warnings };

    return {
      errors,
      warnings,
      data: {
        id:         null,
        tenantId:   null,
        nome,
        descricao:  raw['descricao']  ?? '',
        preco:      preco!,
        categoryId,
        estoque:    estoque ?? 0,
        ativo:      csvToBool(raw['ativo'], true),
        semEstoque: false,
        destaque:   csvToBool(raw['destaque'], false),
        novo:       csvToBool(raw['novo'], false),
        fotos:      [],
        videos:     [],
        variacoes:  [],
      },
    };
  },

  formatRow: () => ({}), // não usado no schema de importação
};

// ── Schema de exportação ──────────────────────────────────────────────────────

const PRODUCT_EXPORT_SCHEMA: CsvSchema<ProdutoApi, ProductCsvExportCtx> = {
  entityName: 'produtos',
  fields: PRODUCT_EXPORT_FIELDS,

  parseRow: () => ({ errors: [], warnings: [] }), // não usado no schema de exportação

  formatRow(p, categoryNameMap) {
    return {
      id:         p.id ?? '',
      nome:       p.nome,
      descricao:  p.descricao ?? '',
      preco:      String(p.preco),
      categoria:  p.categoryId ? (categoryNameMap.get(p.categoryId) ?? '') : '',
      estoque:    p.estoque !== null && p.estoque !== undefined ? String(p.estoque) : '',
      ativo:      String(p.ativo),
      destaque:   String(p.destaque ?? false),
      novo:       String(p.novo ?? false),
      semEstoque: String(p.semEstoque ?? false),
      fotos:      String(p.fotos?.length ?? 0),
    };
  },
};

// ── API pública (mesmos nomes de antes — sem breaking changes) ────────────────

/** Parseia CSV de produtos e retorna linhas válidas/inválidas. */
export function parseCsvProducts(
  text: string,
  categoryMap: ProductCsvImportCtx,
): ParsedCsv {
  return parseCsv(text, PRODUCT_IMPORT_SCHEMA, categoryMap) as ParsedCsv;
}

/** Gera e faz download do CSV com todos os produtos. */
export function exportProductsToCsv(
  products: ProdutoApi[],
  categoryNameMap: ProductCsvExportCtx,
): void {
  const date    = new Date().toISOString().slice(0, 10);
  const content = buildCsvContent(products, PRODUCT_EXPORT_SCHEMA, categoryNameMap);
  downloadCsv(`produtos-${date}`, content);
}

/** Faz download do modelo CSV para importação de produtos. */
export function downloadCsvTemplate(): void {
  const content = buildCsvTemplate(PRODUCT_IMPORT_SCHEMA);
  downloadCsv('modelo-importacao-produtos', content);
}
