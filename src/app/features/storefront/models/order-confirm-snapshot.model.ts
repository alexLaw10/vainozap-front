import type { CartLine } from '../services/storefront-cart.service';

export interface OrderConfirmSnapshot {
  orderId: string;
  createdAt: Date;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  /** Texto completo da forma de pagamento (inclui parcelas, bandeira, troco, etc.). */
  formaPagamentoLabel: string;
  entregaLabel: string;
  /** Bloco de texto do endereço (entrega no endereço); null se retirada na loja. */
  enderecoEntrega: string | null;
  observacoes: string;
  lines: CartLine[];
  subtotal: number;
}
