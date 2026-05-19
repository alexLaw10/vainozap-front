export const CART_PAGAMENTO_OPCOES = [
  { value: '', label: 'Selecione' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'boleto', label: 'Boleto' },
] as const;

export const CART_MODO_CARTAO_OPCOES = [
  { value: 'presencial', label: 'Presencial (Máquina de cartão)' },
  { value: 'online', label: 'Online' },
] as const;

export const CART_BANDEIRA_OPCOES = [
  { value: '', label: 'Selecione a bandeira' },
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'elo', label: 'Elo' },
  { value: 'hipercard', label: 'Hipercard' },
  { value: 'amex', label: 'American Express' },
];
