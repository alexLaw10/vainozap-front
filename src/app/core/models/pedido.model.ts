import { ItemCarrinho, DadosFinalizacao } from './carrinho.model';

export type StatusPedido = 'novo' | 'em_preparo' | 'enviado' | 'entregue' | 'cancelado';

export interface Pedido {
  id: string;
  tenantId: string;
  itens: ItemCarrinho[];
  dados: DadosFinalizacao;
  total: number;
  status: StatusPedido;
  criadoEm: Date;
}
