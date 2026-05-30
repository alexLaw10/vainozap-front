/**
 * vendas-csv.util.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Exportação do relatório de vendas a partir do VendasResumoApi já carregado.
 * Gera um CSV multi-seção compatível com Excel (BOM UTF-8).
 *
 * Seções:
 *   1. Resumo geral   (KPIs)
 *   2. Receita por período
 *   3. Top produtos
 *   4. Por forma de pagamento
 */

import type { Periodo, VendasResumoApi } from '../models/vendas-api.model';
import { downloadCsv, escapeCsvField } from '../../../shared/utils/csv-core.util';

// ── Helpers ───────────────────────────────────────────────────────────────────

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatData(data: string, granularidade: string): string {
  const d = new Date(data + 'T00:00:00Z');
  if (granularidade === 'MES') {
    return d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

const PERIODO_LABEL: Record<Periodo, string> = {
  '7d':  'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  '12m': 'Últimos 12 meses',
};

// ── Export principal ──────────────────────────────────────────────────────────

export function exportVendasReportToCsv(
  resumo: VendasResumoApi,
  periodo: Periodo,
): void {
  const lines: string[] = [];

  // ── Seção 1: Resumo geral ──────────────────────────────────────────────────
  lines.push('RESUMO GERAL');
  lines.push(`Período,${escapeCsvField(PERIODO_LABEL[periodo])}`);
  lines.push(`De,${formatData(resumo.periodo.inicio, 'DIA')}`);
  lines.push(`Até,${formatData(resumo.periodo.fim, 'DIA')}`);
  lines.push('');
  lines.push(`Receita total,${escapeCsvField(brl(resumo.totalReceita))}`);
  lines.push(`Pedidos entregues,${resumo.totalPedidos}`);
  lines.push(`Ticket médio,${escapeCsvField(brl(resumo.ticketMedio))}`);
  lines.push(`Receita pendente,${escapeCsvField(brl(resumo.receitaPendente))}`);
  lines.push(`Pedidos em aberto,${resumo.pedidosPendentes}`);
  lines.push('');

  // ── Seção 2: Receita por período ───────────────────────────────────────────
  const granLabel = resumo.granularidade === 'MES' ? 'Mês' : 'Data';
  lines.push(`RECEITA POR ${resumo.granularidade === 'MES' ? 'MÊS' : 'DIA'}`);
  lines.push(`${granLabel},Pedidos,Receita`);
  for (const item of resumo.porPeriodo) {
    lines.push([
      formatData(item.data, resumo.granularidade),
      String(item.pedidos),
      escapeCsvField(brl(item.receita)),
    ].join(','));
  }
  lines.push('');

  // ── Seção 3: Top produtos ──────────────────────────────────────────────────
  lines.push('TOP PRODUTOS');
  lines.push('Produto,Qtd vendida,Receita');
  for (const p of resumo.topProdutos) {
    lines.push([
      escapeCsvField(p.titulo),
      String(p.quantidade),
      escapeCsvField(brl(p.receita)),
    ].join(','));
  }
  lines.push('');

  // ── Seção 4: Por forma de pagamento ───────────────────────────────────────
  lines.push('POR FORMA DE PAGAMENTO');
  lines.push('Forma,Pedidos,Total');
  for (const fp of resumo.porFormaPagamento) {
    lines.push([
      escapeCsvField(fp.forma),
      String(fp.quantidade),
      escapeCsvField(brl(fp.total)),
    ].join(','));
  }

  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`relatorio-vendas-${date}`, lines.join('\n'));
}
