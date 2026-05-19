/** Modelos que espelham os records Java do domínio de pedidos. */

export type StatusPedido =
  | 'AGUARDANDO_PAGAMENTO'
  | 'PAGAMENTO_NAO_EFETUADO'
  | 'NOVO'
  | 'EM_PREPARO'
  | 'ENVIADO'
  | 'ENTREGUE'
  | 'CANCELADO';

export interface ClienteApi {
  nome: string;
  cpfCnpj: string | null;
  telefone: string;
  observacoes: string | null;
}

export interface PagamentoApi {
  forma: string;
  bandeira: string | null;
  parcelas: number | null;
  modoCartao: string | null;
  trocoPara: number | null;
}

export interface EntregaApi {
  modo: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  uf: string | null;
  cidade: string | null;
  complemento: string | null;
}

export interface LinhaPedidoApi {
  id: string;
  productId: string;
  titulo: string;
  quantidade: number;
  precoUnit: number;
}

export interface PedidoApi {
  id: string;
  tenantId: string;
  status: StatusPedido;
  subtotal: number;
  cliente: ClienteApi;
  pagamento: PagamentoApi;
  entrega: EntregaApi;
  linhas: LinhaPedidoApi[];
  criadoEm: string; // ISO instant
}

export interface AtualizarStatusApi {
  status: StatusPedido;
}

// ── Configuração de status ────────────────────────────────────────────────────

export interface StatusConfig {
  label: string;
  colorClass: string;
  next: StatusPedido[];
}

export const STATUS_CONFIG: Record<StatusPedido, StatusConfig> = {
  AGUARDANDO_PAGAMENTO: {
    label: 'Aguardando pagamento',
    colorClass: 'ord-badge--waiting',
    next: ['NOVO', 'PAGAMENTO_NAO_EFETUADO', 'CANCELADO'],
  },
  PAGAMENTO_NAO_EFETUADO: {
    label: 'Pagamento não efetuado',
    colorClass: 'ord-badge--not-paid',
    next: ['AGUARDANDO_PAGAMENTO', 'CANCELADO'],
  },
  NOVO: {
    label: 'Novo',
    colorClass: 'ord-badge--new',
    next: ['EM_PREPARO', 'CANCELADO'],
  },
  EM_PREPARO: {
    label: 'Em preparo',
    colorClass: 'ord-badge--preparing',
    next: ['ENVIADO', 'ENTREGUE', 'CANCELADO'],
  },
  ENVIADO: {
    label: 'Enviado',
    colorClass: 'ord-badge--sent',
    next: ['ENTREGUE'],
  },
  ENTREGUE: {
    label: 'Entregue',
    colorClass: 'ord-badge--delivered',
    next: [],
  },
  CANCELADO: {
    label: 'Cancelado',
    colorClass: 'ord-badge--cancelled',
    next: [],
  },
};

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as StatusPedido[];
