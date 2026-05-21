/** Plano de subscrição da loja (valor vindo do back por tenant). */
export type TenantPlanoTipo = 'essencial' | 'profissional' | 'empresarial' | 'beta';

/**
 * Metadados de apresentação por tipo de plano (rótulos, cor de destaque e cópia de exemplo).
 * Preços reais devem vir do back quando existir billing; estes valores servem de fallback/UI.
 */
export const TENANT_PLANO_UI: Record<
  TenantPlanoTipo,
  { labelCurto: string; tituloCard: string; corDestaque: string; descricaoResumo: string; precoMensalExemplo: number }
> = {
  beta: {
    labelCurto: 'Beta',
    tituloCard: 'Acesso Beta',
    corDestaque: '#22c55e',
    descricaoResumo:
      'Acesso antecipado exclusivo para testadores e parceiros selecionados. Todos os recursos disponíveis sem custo.',
    precoMensalExemplo: 0,
  },
  essencial: {
    labelCurto: 'Essencial',
    tituloCard: 'Plano Essencial',
    corDestaque: '#ec4899',
    descricaoResumo:
      'A opção perfeita para quem precisa criar um catálogo virtual simples e receber pedidos pelo WhatsApp.',
    precoMensalExemplo: 79.8,
  },
  profissional: {
    labelCurto: 'Profissional',
    tituloCard: 'Plano Profissional',
    corDestaque: '#06b6d4',
    descricaoResumo:
      'A melhor escolha para quem precisa de um e-commerce profissional, com recursos extras para profissionalizar a operação.',
    precoMensalExemplo: 115.05,
  },
  empresarial: {
    labelCurto: 'Empresarial',
    tituloCard: 'Plano Empresarial',
    corDestaque: '#a855f7',
    descricaoResumo:
      'Ideal para empresas que possuem grandes demandas e precisam de recursos avançados de gestão.',
    precoMensalExemplo: 195.8,
  },
};

export function metaPlanoTenant(tipo: TenantPlanoTipo): (typeof TENANT_PLANO_UI)[TenantPlanoTipo] {
  return TENANT_PLANO_UI[tipo];
}

/** Rede social exibida no rodapé (rótulo + URL). O título da seção é fixo no template. */
export interface TenantRedeSocial {
  rotulo: string;
  url: string;
}

/** Conteúdo do rodapé da vitrine: valores dinâmicos por loja; rótulos ficam no template. */
export interface TenantRodape {
  /** Texto do link para WhatsApp. */
  textoLinkWhatsapp: string;
  seloTitulo: string;
  seloSubtitulo: string;
  /** Texto da linha de reclamações (ex.: telefone ou “Consumidor.gov”). */
  reclamacoesTexto?: string | null;
  reclamacoesUrl?: string | null;
  formasPagamento: string[];
  redesSociais: TenantRedeSocial[];
  /** Texto quando não há redes cadastradas. */
  redesPlaceholder: string;
  faixaInferior: string;
}

export interface Tenant {
  id: string;
  slug: string;
  nomeLoja: string;
  /**
   * Texto da aba do browser (`<title>`). Se omitido, usa-se `nomeLoja`.
   */
  tituloDocumento?: string;
  /** URL da imagem da logo no header. Se null, exibe só o nome da loja. */
  logoUrl: string | null;
  /** URL do favicon (PNG/SVG/ICO). Se null, usa o favicon padrão do app. */
  faviconUrl: string | null;
  /** URL do banner hero exibido acima das categorias. Opcional. */
  bannerUrl?: string | null;
  corPrimaria: string;
  /**
   * Cor secundária da marca (ex.: painel azul do modal do carrinho — resumo do pedido).
   */
  corSecundaria: string;
  /**
   * Cor do botão “Comprar” e da barra de quantidade nos cartões do catálogo.
   * Se omitida, usa-se `corPrimaria`.
   */
  corDestaqueCatalogo?: string;
  whatsapp: string;
  /** Plano contratado da loja (define tier e limites no produto). */
  planoTipo: TenantPlanoTipo;
  ativo: boolean;
  /** Subtítulo abaixo da marca (ex.: slogan da loja). */
  slogan?: string;
  emailContato?: string;
  /** Telefone de contacto (ex.: rodapé). Se omitido, formata-se o `whatsapp`. */
  telefoneContato?: string;
  /** Uma linha de horário (ex.: Segunda 08:00 às 18:00). */
  horarioAtendimentoLinha?: string;
  /** Texto extra ao expandir “Ver todos os horários” no rodapé. */
  horarioAtendimentoDetalhes?: string;
  /** CNPJ formatado para exibição no rodapé. */
  cnpj?: string;
  nomeProprietario?: string;
  enderecoLinha?: string;
  /** Valores exibidos no rodapé (selo, WhatsApp, pagamentos, redes, faixa inferior, etc.). */
  rodape: TenantRodape;
}
