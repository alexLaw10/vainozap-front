export type TipoCupom = 'PERCENTUAL' | 'VALOR_FIXO';

export interface ValidarCupomResponse {
  codigo: string;
  tipo: TipoCupom;
  valor: number;       // % ou valor fixo
  desconto: number;    // valor em R$ a deduzir
}
