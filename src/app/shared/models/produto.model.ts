export type VariacaoTipoUi = 'cor' | 'tamanho' | 'opcao';

export interface OpcaoVariacao {
  id: string;
  valor: string;
  estoque: number;
  precoExtra?: number;
  /** Cor do quadradinho na ficha (ex.: `#6b21a8`). Só para variações de cor. */
  swatch?: string;
}

export interface Variacao {
  id: string;
  nome: string;
  opcoes: OpcaoVariacao[];
  /**
   * Como renderizar na ficha do produto (swatch, estilo tamanho, lista simples).
   * Se omitido, a loja infere por id/nome e por existência de `swatch` nas opções.
   */
  tipo?: VariacaoTipoUi;
  /** Ordem na ficha (menor primeiro). Se omitido, mantém-se a ordem relativa do array. */
  ordem?: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  fotos: string[];
  videos?: string[];
  categoriaId: string;
  variacoes: Variacao[];
  ativo: boolean;
  /** Quando true, o produto é um serviço/consultoria sem controle de estoque.
   *  O botão "Adicionar ao carrinho" é substituído por um link direto para o WhatsApp. */
  semEstoque?: boolean;
  /** Bullets da secção "Informações" na página de detalhe (opcional). */
  informacoesFicha?: string[];
  /** Bullets "Características principais" (opcional). */
  caracteristicasFicha?: string[];
  /** Texto da secção "Recomendação de lavagem" na página de detalhe (opcional). */
  recomendacaoLavagem?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  /** Miniatura opcional (ex.: vitrine em círculo). */
  imagemUrl?: string | null;
}
