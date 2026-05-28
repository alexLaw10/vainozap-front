export type StorefrontFilterGroupKind = 'choice' | 'range';

export interface StorefrontFilterOption {
  id: string;
  label: string;
}

export interface StorefrontFilterGroup {
  id: string;
  /** Rótulo exibido no acordeão (dinâmico). */
  label: string;
  kind: StorefrontFilterGroupKind;
  /** Opções para `kind === 'choice'` (ids alinhados às opções de variação do produto quando aplicável). */
  options?: StorefrontFilterOption[];
  /** Id da variação no modelo `Produto.variacoes[].id` (ex.: `cor`, `tamanho`). */
  variavelProdutoId?: string;
  /** Se definido, o filtro só considera produtos desta categoria. */
  categoriaId?: string;
  /** Para `kind === 'range'` (ex.: preço). */
  range?: {
    min: number;
    max: number;
    step: number;
    /** Rótulos opcionais nos extremos do intervalo. */
    minLabel?: string;
    maxLabel?: string;
  };
}

export interface StorefrontFilterPanelConfig {
  /** Título do modal (ex.: "Filtros"). */
  title: string;
  groups: StorefrontFilterGroup[];
}
