import type { StorefrontEnderecoEntrega } from '../models/storefront-entrega.model';
import { formatCepMask } from './cep.util';

/** Texto multilinha para WhatsApp / resumo de pedido. */
export function formatStorefrontEnderecoResumo(e: StorefrontEnderecoEntrega): string {
  const cepFmt = formatCepMask(e.cep);
  const linhas = [
    `${e.logradouro}, ${e.numero} — ${e.bairro}`,
    `${e.cidade}/${e.uf}`,
    `CEP ${cepFmt}`,
  ];
  if (e.complemento) {
    linhas.splice(1, 0, `Complemento: ${e.complemento}`);
  }
  return linhas.join('\n');
}
