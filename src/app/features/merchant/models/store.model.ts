export interface MinhaLojaDto {
  tenantId: string;
  slug: string;
  nomeLoja: string;
  logoUrl: string | null;
  planoTipo: string;
  papel: string;
  isPrimary: boolean;
}

export interface NovaLojaRequest {
  nomeLoja: string;
  slug: string;
  whatsapp: string;
}
