import type { Produto, Variacao, VariacaoTipoUi } from '../../../shared/models/produto.model';

const COLOR_IDS = new Set([
  'cor',
  'cores',
  'color',
  'colors',
  'colour',
  'colours',
  'couleur',
  'couleurs',
]);

const SIZE_IDS = new Set([
  'tamanho',
  'tamanhos',
  'size',
  'sizes',
  'tam',
  'talla',
  'tallas',
  'medida',
  'medidas',
]);

/** Valores típicos de tamanho (letras, numeração calçado/roupa curta). */
const SIZE_VAL = /^(pp|p|m|g|gg|xg|xxg|xxxg|xs|s|xl|xxl|xxxl|\d{1,3})$/i;

function idKey(id: string): string {
  return id.trim().toLowerCase();
}

/**
 * Classifica a variação para UI. Use `Variacao.tipo` quando a API/loja já souber
 * (ex.: atributo customizado); caso contrário infere-se por id e dados das opções.
 */
export function resolveVariacaoTipo(v: Variacao): VariacaoTipoUi {
  if (v.tipo) return v.tipo;
  const id = idKey(v.id);
  const nome = idKey(v.nome);
  if (SIZE_IDS.has(id) || SIZE_IDS.has(nome)) return 'tamanho';
  if (COLOR_IDS.has(id) || COLOR_IDS.has(nome)) return 'cor';
  if (v.opcoes.some((o) => Boolean(o.swatch?.trim()))) return 'cor';
  if (
    v.opcoes.length > 0 &&
    v.opcoes.every((o) => SIZE_VAL.test(String(o.valor).trim()))
  ) {
    return 'tamanho';
  }
  return 'opcao';
}

function rankTipo(t: VariacaoTipoUi): number {
  if (t === 'cor') return 0;
  if (t === 'tamanho') return 1;
  return 2;
}

/**
 * Ordem de exibição: cores → tamanhos → restantes; dentro de cada grupo,
 * `ordem` (se definido) e depois a posição original no array do produto.
 */
export function sortVariacoesParaFicha(p: Produto): Variacao[] {
  const indexed = p.variacoes.map((v, idx) => ({ v, idx }));
  indexed.sort((a, b) => {
    const ta = resolveVariacaoTipo(a.v);
    const tb = resolveVariacaoTipo(b.v);
    const dr = rankTipo(ta) - rankTipo(tb);
    if (dr !== 0) return dr;
    const oa = a.v.ordem ?? a.idx;
    const ob = b.v.ordem ?? b.idx;
    if (oa !== ob) return oa - ob;
    return a.idx - b.idx;
  });
  return indexed.map((x) => x.v);
}
