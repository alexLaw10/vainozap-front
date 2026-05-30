/** Modelos que espelham os records Java retornados pela API do merchant. */

export interface VariacaoTemplateOpcaoApi {
  id: string | null;
  valor: string;
  swatch: string | null;
  ordem: number;
}

export interface VariacaoTemplateItemApi {
  id: string | null;
  nome: string;
  tipo: string;
  ordem: number;
  opcoes: VariacaoTemplateOpcaoApi[];
}

export interface VariacaoTemplateApi {
  id: string;
  tenantId: string;
  nome: string;
  variacoes: VariacaoTemplateItemApi[];
}

export interface CategoriaApi {
  id: string | null;
  tenantId: string | null;
  nome: string;
  slug: string;
  imagemUrl: string | null;
  ordem: number;
}

export interface OpcaoVariacaoApi {
  id: string | null;
  valor: string;
  swatch: string | null;
  estoque: number;
  precoExtra: number | null;
}

export interface VariacaoApi {
  id: string | null;
  nome: string;
  tipo: string;
  ordem: number;
  opcoes: OpcaoVariacaoApi[];
}

export interface ProdutoApi {
  id: string | null;
  tenantId: string | null;
  categoryId: string | null;
  nome: string;
  descricao: string;
  preco: number;
  ativo: boolean;
  estoque: number | null;   // null = usa variações; número = produto simples
  semEstoque: boolean;      // true = serviço/consultoria — sem carrinho, botão WhatsApp
  fotos: string[];
  videos: string[];          // URLs de vídeos (MP4/WebM/MOV)
  variacoes: VariacaoApi[];
  destaque?: boolean;        // Exibe badge "Destaque" e aparece na seção de destaques
  novo?: boolean;            // Exibe badge "Novo" no card
}

export interface AjusteEstoqueApi {
  operacao: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantidade: number;
}
