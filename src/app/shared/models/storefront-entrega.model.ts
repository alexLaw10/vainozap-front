/** Endereço de entrega na vitrine (CEP = 8 dígitos, sem máscara). */
export interface StorefrontEnderecoEntrega {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  uf: string;
  cidade: string;
  complemento: string;
}
