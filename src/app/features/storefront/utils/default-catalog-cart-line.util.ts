import type { Produto } from '../../../shared/models/produto.model';
import type { CartLine } from '../services/storefront-cart.service';
import { sortVariacoesParaFicha } from './variacao-ui.util';

export type CatalogCartLinePayload = Omit<CartLine, 'id'>;

/**
 * Linha de carrinho com a primeira combinação em stock por variação (igual ao default da ficha).
 * `null` se não for possível adicionar (sem stock na combinação default).
 */
export function buildDefaultCatalogCartLine(p: Produto): CatalogCartLinePayload | null {
  if (!p.ativo) return null;
  const variacoes = sortVariacoesParaFicha(p);
  if (variacoes.length === 0) {
    return {
      productId: p.id,
      titulo: p.nome,
      quantidade: 1,
      precoUnit: p.preco,
      thumbUrl: p.fotos[0],
    };
  }
  const sel: Record<string, string> = {};
  for (const v of variacoes) {
    const firstInStock = v.opcoes.find((o) => o.estoque > 0);
    const pick = firstInStock ?? v.opcoes[0];
    if (!pick) return null;
    sel[v.id] = pick.id;
  }
  for (const v of variacoes) {
    const op = v.opcoes.find((o) => o.id === sel[v.id]);
    if (!op || op.estoque <= 0) return null;
  }
  let extra = 0;
  const partes: string[] = [];
  for (const v of variacoes) {
    const op = v.opcoes.find((o) => o.id === sel[v.id])!;
    extra += op.precoExtra ?? 0;
    partes.push(op.valor);
  }
  const titulo = `${p.nome} — ${partes.join(' · ')}`;
  return {
    productId: p.id,
    titulo,
    quantidade: 1,
    precoUnit: p.preco + extra,
    thumbUrl: p.fotos[0],
  };
}
