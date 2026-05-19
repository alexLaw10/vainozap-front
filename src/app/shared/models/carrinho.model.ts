export interface ItemCarrinho {
  produtoId: string;
  nomeProduto: string;
  foto: string;
  preco: number;
  quantidade: number;
  variacoesSelecionadas: Record<string, string>;
}

export interface DadosFinalizacao {
  nomeCliente: string;
  telefone: string;
  endereco: string;
  formaPagamento: string;
  observacao?: string;
}
