import { Tenant } from '../shared/models/tenant.model';
import { TENANT_BRAND_MEDIA } from './tenant-brand.mock';

export const TENANT_MOCK: Tenant = {
  ...TENANT_BRAND_MEDIA,
  id: '1',
  slug: 'PaceFit',
  nomeLoja: 'PaceFit',
  corPrimaria: '#0a0a0a',
  /** Resumo do carrinho (gradiente) e acentos do formulário no modal */
  corSecundaria: '#47b8e8',
  /** Botão Comprar / seletor de quantidade na grelha do catálogo */
  corDestaqueCatalogo: '#e8b923',
  whatsapp: '5511999999999',
  planoTipo: 'profissional',
  telefoneContato: '(11) 99999-9999',
  horarioAtendimentoLinha: 'Segunda a sexta 08:00 às 18:00',
  horarioAtendimentoDetalhes:
    'Segunda a sexta: 08:00–18:00\nSábado: 09:00–13:00\nDomingo: encerrado',
  cnpj: '12.345.678/0001-90',
  ativo: true,
  slogan: 'DE QUEM CORRE PARA QUEM CORRE',
  emailContato: 'mypacefitnesss@gmail.com',
  nomeProprietario: 'Law',
  enderecoLinha: 'Rua das Flores, 123, Centro, São Paulo, SP',
  rodape: {
    textoLinkWhatsapp: 'MYPACE',
    seloTitulo: 'SITE 100% SEGURO',
    seloSubtitulo: 'CERTIFICADO SSL',
    reclamacoesTexto: 'Consumidor.gov.br',
    reclamacoesUrl: 'https://www.gov.br/consumidor/pt-br',
    formasPagamento: ['Pix', 'Visa', 'Mastercard', 'Elo', 'Boleto'],
    redesSociais: [{ rotulo: 'Instagram', url: 'https://instagram.com/exemplo' }],
    redesPlaceholder: 'Em breve',
    faixaInferior: 'Loja online · vitrine digital',
  },
};
