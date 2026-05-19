import type { StorefrontFilterPanelConfig } from '../shared/models/storefront-filters.model';

/** Configuração inicial do painel de filtros (substituir por API). */
export const STOREFRONT_FILTERS_PANEL_MOCK: StorefrontFilterPanelConfig = {
  title: 'Filtros',
  groups: [
    {
      id: 'cores',
      label: 'Cores',
      kind: 'choice',
      variavelProdutoId: 'cor',
      options: [
        { id: 'rosa', label: 'Rosa' },
        { id: 'azul', label: 'Azul' },
        { id: 'bege', label: 'Bege' },
        { id: 'preto', label: 'Preto' },
        { id: 'branco', label: 'Branco' },
      ],
    },
    {
      id: 'cores-macaquinho',
      label: 'Cores Macaquinho',
      kind: 'choice',
      variavelProdutoId: 'cor',
      categoriaId: '3',
      options: [
        { id: 'rosa', label: 'Rosa' },
        { id: 'azul', label: 'Azul' },
      ],
    },
    {
      id: 'tamanhos',
      label: 'Tamanhos',
      kind: 'choice',
      variavelProdutoId: 'tamanho',
      options: [
        { id: 'p', label: 'P' },
        { id: 'm', label: 'M' },
        { id: 'g', label: 'G' },
        { id: 'gg', label: 'GG' },
        { id: '36', label: '36' },
        { id: '38', label: '38' },
        { id: '40', label: '40' },
        { id: '42', label: '42' },
        { id: 'pp', label: 'PP' },
      ],
    },
    {
      id: 'preco',
      label: 'Preço',
      kind: 'range',
      range: { min: 0, max: 400, step: 10, minLabel: 'Mín.', maxLabel: 'Máx.' },
    },
  ],
};
