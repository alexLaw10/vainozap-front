/** Plano de subscrição da loja (valor vindo do back por tenant). */
export type TenantPlanoTipo = 'basico' | 'profissional' | 'business';

/** Status da assinatura do tenant. */
export type AssinaturaStatus = 'trial' | 'ativa' | 'inadimplente' | 'cancelada';

/**
 * Metadados de apresentação por tipo de plano (rótulos, cor de destaque e descrição).
 * Preços e features reais vêm do endpoint /api/v1/merchant/planos.
 */
export const TENANT_PLANO_UI: Record<
  TenantPlanoTipo,
  { labelCurto: string; tituloCard: string; corDestaque: string; descricaoResumo: string; precoMensal: number }
> = {
  basico: {
    labelCurto: 'Básico',
    tituloCard: 'Plano Básico',
    corDestaque: '#22c55e',
    descricaoResumo:
      'Perfeito para quem está começando. Catálogo ilimitado, controle de estoque e cupons de desconto.',
    precoMensal: 59.9,
  },
  profissional: {
    labelCurto: 'Profissional',
    tituloCard: 'Plano Profissional',
    corDestaque: '#06b6d4',
    descricaoResumo:
      'Para quem quer crescer. Pixel, vídeos, frete automático, domínio próprio e muito mais.',
    precoMensal: 99.9,
  },
  business: {
    labelCurto: 'Business',
    tituloCard: 'Plano Business',
    corDestaque: '#a855f7',
    descricaoResumo:
      'Para operações completas. Múltiplas lojas, recuperação de carrinho, login de cliente e API.',
    precoMensal: 169.9,
  },
};

export function metaPlanoTenant(tipo: TenantPlanoTipo): (typeof TENANT_PLANO_UI)[TenantPlanoTipo] {
  return TENANT_PLANO_UI[tipo] ?? TENANT_PLANO_UI['basico'];
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
  /** Status da assinatura: trial | ativa | inadimplente | cancelada. */
  assinaturaStatus: AssinaturaStatus;
  ativo: boolean;
  /** Subtítulo abaixo da marca (ex.: slogan da loja). */
  slogan?: string;
  /**
   * Texto exibido na barra de aviso no topo da vitrine (announcement bar).
   * Se nulo/vazio, a barra não é exibida.
   */
  mensagemTopo?: string | null;
  /**
   * Cor de fundo da barra de aviso (hex ou qualquer valor CSS válido).
   * Se omitida, usa `corPrimaria`.
   */
  corFundoTopo?: string | null;
  /**
   * Linha de política de entrega exibida na página do produto
   * (ex.: "Entrega em 2-5 dias úteis para todo o Brasil 🚚").
   * Se nulo/vazio, a seção não é exibida.
   */
  politicaEntregaLinha?: string | null;
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
