/** Siglas oficiais das UFs (ordem alfabética por sigla). */
export const UFS_BR = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export type UfBrasil = (typeof UFS_BR)[number];

export function isUfBrasil(sigla: string): sigla is UfBrasil {
  return (UFS_BR as readonly string[]).includes(sigla);
}
