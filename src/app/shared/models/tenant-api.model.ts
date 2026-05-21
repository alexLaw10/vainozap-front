export interface TenantRodapeApi {
  textoLinkWhatsapp: string | null;
  seloTitulo: string | null;
  seloSubtitulo: string | null;
  reclamacoesTexto: string | null;
  reclamacoesUrl: string | null;
  formasPagamento: string[];
  redesSociais: TenantRedeSocialApi[];
  redesPlaceholder: string | null;
  faixaInferior: string | null;
}

export interface TenantRedeSocialApi {
  rotulo: string;
  url: string;
}

export interface TenantApi {
  id: string;
  slug: string;
  nomeLoja: string;
  tituloDocumento: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  bannerUrl: string | null;
  corPrimaria: string | null;
  corSecundaria: string | null;
  corDestaqueCatalogo: string | null;
  whatsapp: string | null;
  planoTipo: string;
  ativo: boolean;
  slogan: string | null;
  emailContato: string | null;
  telefoneContato: string | null;
  horarioAtendimentoLinha: string | null;
  horarioAtendimentoDetalhes: string | null;
  cnpj: string | null;
  nomeProprietario: string | null;
  enderecoLinha: string | null;
  rodape: TenantRodapeApi | null;
  trialEndsAt: string | null;
}
