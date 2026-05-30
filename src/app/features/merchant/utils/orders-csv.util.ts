/**
 * orders-csv.util.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Dois exports para o domínio de Pedidos:
 *
 *  exportOrdersToCsv(orders)        → pedidos-YYYY-MM-DD.csv   (bruto, 1 linha/pedido)
 *  exportOrdersReportToCsv(orders)  → relatorio-vendas-YYYY-MM-DD.csv (agregado, multi-seção)
 */

import {
  ALL_STATUSES,
  type PedidoApi,
  STATUS_CONFIG,
} from '../models/order-api.model';
import {
  type CsvFieldDef,
  type CsvSchema,
  buildCsvContent,
  downloadCsv,
  escapeCsvField,
} from '../../../shared/utils/csv-core.util';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });
}

function formatItens(order: PedidoApi): string {
  return order.linhas.map(l => `${l.titulo} x${l.quantidade}`).join(' | ');
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. EXPORTAR PEDIDOS (dados brutos — 1 linha por pedido)
// ══════════════════════════════════════════════════════════════════════════════

const ORDERS_RAW_FIELDS: CsvFieldDef[] = [
  { key: 'id'        },
  { key: 'data'      },
  { key: 'hora'      },
  { key: 'cliente'   },
  { key: 'telefone'  },
  { key: 'status'    },
  { key: 'entrega'   },
  { key: 'pagamento' },
  { key: 'total'     },
  { key: 'itens'     },
];

const ORDERS_RAW_SCHEMA: CsvSchema<PedidoApi, void> = {
  entityName: 'pedidos',
  fields: ORDERS_RAW_FIELDS,
  parseRow: () => ({ errors: [], warnings: [] }),

  formatRow(o) {
    const endereco = o.entrega.logradouro
      ? `${o.entrega.logradouro}, ${o.entrega.numero ?? ''} – ${o.entrega.cidade}/${o.entrega.uf}`
      : o.entrega.modo ?? '';

    return {
      id:        o.id,
      data:      formatDate(o.criadoEm),
      hora:      formatTime(o.criadoEm),
      cliente:   o.cliente.nome,
      telefone:  o.cliente.telefone,
      status:    STATUS_CONFIG[o.status]?.label ?? o.status,
      entrega:   endereco,
      pagamento: o.pagamento.forma ?? '',
      total:     o.subtotal.toFixed(2).replace('.', ','),
      itens:     formatItens(o),
    };
  },
};

export function exportOrdersToCsv(orders: PedidoApi[]): void {
  const date    = new Date().toISOString().slice(0, 10);
  const content = buildCsvContent(orders, ORDERS_RAW_SCHEMA, undefined as void);
  downloadCsv(`pedidos-${date}`, content);
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. RELATÓRIO DE VENDAS (agregado, multi-seção)
// ══════════════════════════════════════════════════════════════════════════════

export function exportOrdersReportToCsv(orders: PedidoApi[]): void {
  const lines: string[] = [];
  const bom = '﻿'; // BOM UTF-8 para Excel

  const naoCancel = orders.filter(o => o.status !== 'CANCELADO');
  const entregues = orders.filter(o => o.status === 'ENTREGUE');
  const cancelados = orders.filter(o => o.status === 'CANCELADO');
  const faturamento = naoCancel.reduce((acc, o) => acc + o.subtotal, 0);
  const ticketMedio = entregues.length > 0 ? faturamento / entregues.length : 0;

  // ── Seção 1: Resumo geral ──────────────────────────────────────────────────
  lines.push('RESUMO GERAL');
  lines.push(`Total de pedidos,${orders.length}`);
  lines.push(`Pedidos entregues,${entregues.length}`);
  lines.push(`Pedidos cancelados,${cancelados.length}`);
  lines.push(`Faturamento (excl. cancelados),${escapeCsvField(formatBRL(faturamento))}`);
  lines.push(`Ticket médio (entregues),${escapeCsvField(formatBRL(ticketMedio))}`);
  lines.push('');

  // ── Seção 2: Por status ────────────────────────────────────────────────────
  lines.push('PEDIDOS POR STATUS');
  lines.push('Status,Quantidade,Faturamento');
  for (const status of ALL_STATUSES) {
    const grupo = orders.filter(o => o.status === status);
    const fat   = grupo.reduce((acc, o) => acc + o.subtotal, 0);
    lines.push([
      escapeCsvField(STATUS_CONFIG[status].label),
      String(grupo.length),
      escapeCsvField(formatBRL(fat)),
    ].join(','));
  }
  lines.push('');

  // ── Seção 3: Top produtos ──────────────────────────────────────────────────
  const prodMap = new Map<string, { nome: string; qtd: number; fat: number }>();
  for (const order of naoCancel) {
    for (const linha of order.linhas) {
      const prev = prodMap.get(linha.titulo) ?? { nome: linha.titulo, qtd: 0, fat: 0 };
      prodMap.set(linha.titulo, {
        nome: linha.titulo,
        qtd:  prev.qtd + linha.quantidade,
        fat:  prev.fat + linha.quantidade * linha.precoUnit,
      });
    }
  }
  const topProd = [...prodMap.values()].sort((a, b) => b.qtd - a.qtd).slice(0, 20);

  lines.push('TOP PRODUTOS (excl. cancelados)');
  lines.push('Produto,Qtd vendida,Faturamento');
  for (const p of topProd) {
    lines.push([
      escapeCsvField(p.nome),
      String(p.qtd),
      escapeCsvField(formatBRL(p.fat)),
    ].join(','));
  }
  lines.push('');

  // ── Seção 4: Vendas por dia ────────────────────────────────────────────────
  const dayMap = new Map<string, { qtd: number; fat: number }>();
  for (const order of naoCancel) {
    const day  = formatDate(order.criadoEm);
    const prev = dayMap.get(day) ?? { qtd: 0, fat: 0 };
    dayMap.set(day, { qtd: prev.qtd + 1, fat: prev.fat + order.subtotal });
  }

  lines.push('VENDAS POR DIA (excl. cancelados)');
  lines.push('Data,Pedidos,Faturamento');
  for (const [day, { qtd, fat }] of dayMap.entries()) {
    lines.push([day, String(qtd), escapeCsvField(formatBRL(fat))].join(','));
  }

  const content = bom + lines.join('\n');
  const date    = new Date().toISOString().slice(0, 10);
  const blob    = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `relatorio-vendas-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
