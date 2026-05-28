export interface OpcaoFormBase {
  id: string | null;
  valor: string;
  swatch: string;
}

export interface OpcaoForm extends OpcaoFormBase {
  estoque: string;
  precoExtra: string;
}

export interface VariacaoForm {
  id: string | null;
  nome: string;
  tipo: string;
  opcoes: OpcaoFormBase[];
}

export interface RedeForm {
  rotulo: string;
  url: string;
}
