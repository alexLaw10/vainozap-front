import type { VendasResumoApi } from '../shared/models/vendas-api.model';
import type { PageResult } from '../shared/models/page-result.model';
import type { PedidoApi, StatusPedido } from '../shared/models/order-api.model';
import type { TenantApi } from '../shared/models/tenant-api.model';

export function stubTenantApi(over: Partial<TenantApi> = {}): TenantApi {
  return {
    id: 'tenant-test',
    slug: 'loja-test',
    nomeLoja: 'Loja Teste',
    tituloDocumento: null,
    logoUrl: null,
    faviconUrl: null,
    corPrimaria: '#111111',
    corSecundaria: '#222222',
    corDestaqueCatalogo: '#333333',
    whatsapp: null,
    planoTipo: 'FREE',
    ativo: true,
    slogan: null,
    emailContato: null,
    telefoneContato: null,
    horarioAtendimentoLinha: null,
    horarioAtendimentoDetalhes: null,
    cnpj: null,
    nomeProprietario: null,
    enderecoLinha: null,
    rodape: null,
    trialEndsAt: null,
    ...over,
  };
}

export function stubEmptyPage<T>(): PageResult<T> {
  return {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    last: true,
  };
}

export function stubVendasResumo(): VendasResumoApi {
  return {
    periodo: { inicio: '2026-01-01', fim: '2026-01-07' },
    totalReceita: 0,
    totalPedidos: 0,
    ticketMedio: 0,
    receitaPendente: 0,
    pedidosPendentes: 0,
    granularidade: 'DIA',
    porPeriodo: [],
    topProdutos: [],
    porFormaPagamento: [],
  };
}

export function stubPedidoApi(over: Partial<PedidoApi> = {}): PedidoApi {
  const status: StatusPedido = 'NOVO';
  return {
    id: 'ped-1',
    tenantId: 'tenant-test',
    status,
    subtotal: 10,
    cliente: {
      nome: 'Cliente',
      cpfCnpj: null,
      telefone: '11999999999',
      observacoes: null,
    },
    pagamento: {
      forma: 'PIX',
      bandeira: null,
      parcelas: null,
      modoCartao: null,
      trocoPara: null,
    },
    entrega: {
      modo: 'loja',
      cep: null,
      logradouro: null,
      numero: null,
      bairro: null,
      uf: null,
      cidade: null,
      complemento: null,
    },
    linhas: [],
    criadoEm: new Date().toISOString(),
    ...over,
  };
}
