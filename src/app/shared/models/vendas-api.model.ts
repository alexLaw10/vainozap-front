export type Granularidade = 'DIA' | 'MES';
export type Periodo = '7d' | '30d' | '90d' | '12m';

export interface VendasPeriodoApi { inicio: string; fim: string; }
export interface VendasPorPeriodoApi { data: string; receita: number; pedidos: number; }
export interface TopProdutoApi { titulo: string; quantidade: number; receita: number; }
export interface PorFormaPagamentoApi { forma: string; total: number; quantidade: number; }

export interface VendasResumoApi {
  periodo: VendasPeriodoApi;
  totalReceita: number;
  totalPedidos: number;
  ticketMedio: number;
  receitaPendente: number;
  pedidosPendentes: number;
  granularidade: Granularidade;
  porPeriodo: VendasPorPeriodoApi[];
  topProdutos: TopProdutoApi[];
  porFormaPagamento: PorFormaPagamentoApi[];
}
