/** Separa título composto do carrinho (`Produto — Variante`). */
export function cartLineTituloPrincipal(titulo: string): string {
  const i = titulo.indexOf(' — ');
  return i >= 0 ? titulo.slice(0, i).trim() : titulo;
}

export function cartLineTituloVariante(titulo: string): string | null {
  const i = titulo.indexOf(' — ');
  return i >= 0 ? titulo.slice(i + 3).trim() || null : null;
}
