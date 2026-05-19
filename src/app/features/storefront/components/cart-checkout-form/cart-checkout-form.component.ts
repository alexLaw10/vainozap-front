import { Component, computed, input, output } from '@angular/core';

import {
  CART_BANDEIRA_OPCOES,
  CART_MODO_CARTAO_OPCOES,
  CART_PAGAMENTO_OPCOES,
} from '../../constants/cart-payment-options';

@Component({
  selector: 'app-cart-checkout-form',
  standalone: true,
  templateUrl: './cart-checkout-form.component.html',
  styleUrl: './cart-checkout-form.component.scss',
})
export class CartCheckoutFormComponent {
  corSecundaria = input.required<string>();

  nome = input.required<string>();
  cpfCnpj = input.required<string>();
  telefone = input.required<string>();
  formaPagamento = input.required<string>();
  cartTrocoPara = input.required<string>();
  cartModoCartao = input.required<'presencial' | 'online'>();
  cartParcelas = input.required<string>();
  cartBandeira = input.required<string>();

  nomeChange = output<string>();
  cpfChange = output<string>();
  telChange = output<string>();
  pagamentoChange = output<Event>();
  trocoChange = output<string>();
  modoCartaoChange = output<Event>();
  parcelasChange = output<Event>();
  bandeiraChange = output<Event>();

  readonly pagamentoOpcoes = CART_PAGAMENTO_OPCOES;

  readonly cartModoOpcoes = CART_MODO_CARTAO_OPCOES;

  readonly parcelasOpcoes: { value: string; label: string }[] = [
    { value: '', label: 'Selecione o parcelamento' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1}x sem juros`,
    })),
  ];

  readonly bandeiraOpcoes = CART_BANDEIRA_OPCOES;

  readonly isCartaoForma = computed(
    () =>
      this.formaPagamento() === 'cartao_credito' || this.formaPagamento() === 'cartao_debito',
  );
}
