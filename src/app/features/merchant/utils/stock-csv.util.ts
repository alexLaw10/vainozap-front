/**
 * stock-csv.util.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Schema CSV para o domínio de Estoque (ajuste em lote).
 *
 * Colunas do CSV de importação:
 *   id_produto | nome_produto | operacao (ENTRADA|SAIDA|AJUSTE) | quantidade | observacao
 *
 * Uso futuro:
 *   import { parseCsvStock, exportStockToCsv } from '../utils/stock-csv.util';
 */

import type { AjusteEstoqueApi, ProdutoApi } from '../../../core/models/catalog-api.model';
import {
  type CsvFieldDef,
  type CsvParseResult,
  type CsvSchema,
  buildCsvContent,
  buildCsvTemplate,
  csvToInt,
  downloadCsv,
  parseCsv,
} from '../../../shared/utils/csv-core.util';

// ── Tipos do domínio ──────────────────────────────────────────────────────────

export interface StockAdjustRow {
  productId: string;
  productName: string;
  ajuste: AjusteEstoqueApi;
  observacao?: string;
}

/** Mapa productId → nome (para exportação). */
export type StockCsvCtx = Map<string, string>;

// ── Campos ────────────────────────────────────────────────────────────────────

export const STOCK_CSV_FIELDS: CsvFieldDef[] = [
  { key: 'id_produto',    label: 'ID do produto',  required: true  },
  { key: 'nome_produto',  label: 'Nome do produto'                  },
  { key: 'operacao',      label: 'Operação',        required: true, hint: 'ENTRADA | SAIDA | AJUSTE' },
  { key: 'quantidade',    label: 'Quantidade',      required: true  },
  { key: 'observacao',    label: 'Observação'                       },
];

const OPERACOES_VALIDAS = ['ENTRADA', 'SAIDA', 'AJUSTE'] as const;

// ── Schema ────────────────────────────────────────────────────────────────────

const STOCK_SCHEMA: CsvSchema<StockAdjustRow, StockCsvCtx> = {
  entityName: 'estoque',
  fields: STOCK_CSV_FIELDS,

  templateRows: [
    ['abc-123', 'Camiseta Básica', 'ENTRADA', '50',  'Reposição de lote'],
    ['def-456', 'Tênis Casual',    'SAIDA',   '5',   'Venda offline'    ],
    ['ghi-789', 'Caneca Porcelana','AJUSTE',  '100', 'Inventário'       ],
  ],

  parseRow(raw) {
    const errors: string[] = [];

    const productId = raw['id_produto']?.trim() ?? '';
    if (!productId) errors.push('ID do produto obrigatório');

    const op = raw['operacao']?.trim().toUpperCase() ?? '';
    if (!OPERACOES_VALIDAS.includes(op as typeof OPERACOES_VALIDAS[number])) {
      errors.push(`Operação inválida: "${raw['operacao']}" — use ENTRADA, SAIDA ou AJUSTE`);
    }

    const qtdRaw  = raw['quantidade'] ?? '';
    const qtd     = csvToInt(qtdRaw);
    if (qtd === null)    errors.push(`Quantidade inválida: "${qtdRaw}"`);
    if (qtd !== null && qtd < 0) errors.push('Quantidade não pode ser negativa');

    if (errors.length > 0) return { errors, warnings: [] };

    return {
      errors: [],
      warnings: [],
      data: {
        productId,
        productName: raw['nome_produto']?.trim() ?? '',
        ajuste: {
          operacao:   op as AjusteEstoqueApi['operacao'],
          quantidade: qtd!,
        },
        observacao: raw['observacao']?.trim() || undefined,
      },
    };
  },

  formatRow(row, productNameMap) {
    return {
      id_produto:   row.productId,
      nome_produto: productNameMap.get(row.productId) ?? row.productName,
      operacao:     row.ajuste.operacao,
      quantidade:   String(row.ajuste.quantidade),
      observacao:   row.observacao ?? '',
    };
  },
};

// ── API pública ───────────────────────────────────────────────────────────────

export function parseCsvStock(
  text: string,
): CsvParseResult<StockAdjustRow> {
  return parseCsv(text, STOCK_SCHEMA, new Map());
}

export function exportStockToCsv(
  rows: StockAdjustRow[],
  productNameMap: StockCsvCtx,
): void {
  const date    = new Date().toISOString().slice(0, 10);
  const content = buildCsvContent(rows, STOCK_SCHEMA, productNameMap);
  downloadCsv(`estoque-${date}`, content);
}

export function downloadStockCsvTemplate(): void {
  const content = buildCsvTemplate(STOCK_SCHEMA);
  downloadCsv('modelo-ajuste-estoque', content);
}

// ── Snapshot de estoque atual ─────────────────────────────────────────────────

export interface StockSnapshotRow {
  id: string;
  nome: string;
  variacao: string;
  opcao: string;
  estoque: number;
  status: 'ok' | 'baixo' | 'zero';
}

const SNAPSHOT_FIELDS: CsvFieldDef[] = [
  { key: 'id'       },
  { key: 'nome'     },
  { key: 'variacao' },
  { key: 'opcao'    },
  { key: 'estoque'  },
  { key: 'status'   },
];

const SNAPSHOT_SCHEMA: CsvSchema<StockSnapshotRow, void> = {
  entityName: 'estoque',
  fields: SNAPSHOT_FIELDS,
  parseRow: () => ({ errors: [], warnings: [] }),
  formatRow: (r) => ({
    id:       r.id,
    nome:     r.nome,
    variacao: r.variacao,
    opcao:    r.opcao,
    estoque:  String(r.estoque),
    status:   r.status,
  }),
};

function stockStatus(qty: number): StockSnapshotRow['status'] {
  if (qty === 0)  return 'zero';
  if (qty <= 10)  return 'baixo';
  return 'ok';
}

/** Achata ProdutoApi[] em linhas de snapshot e dispara o download. */
export function exportCurrentStockToCsv(products: ProdutoApi[]): void {
  const rows: StockSnapshotRow[] = [];

  for (const p of products) {
    if (!p.variacoes || p.variacoes.length === 0) {
      const qty = p.estoque ?? 0;
      rows.push({
        id:       p.id ?? '',
        nome:     p.nome,
        variacao: '',
        opcao:    '',
        estoque:  qty,
        status:   stockStatus(qty),
      });
    } else {
      for (const v of p.variacoes) {
        for (const o of v.opcoes) {
          rows.push({
            id:       p.id ?? '',
            nome:     p.nome,
            variacao: v.nome,
            opcao:    o.valor,
            estoque:  o.estoque,
            status:   stockStatus(o.estoque),
          });
        }
      }
    }
  }

  const date    = new Date().toISOString().slice(0, 10);
  const content = buildCsvContent(rows, SNAPSHOT_SCHEMA, undefined as void);
  downloadCsv(`estoque-${date}`, content);
}
