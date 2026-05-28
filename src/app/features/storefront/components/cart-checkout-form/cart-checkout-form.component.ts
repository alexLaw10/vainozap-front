import { Component, computed, input, output, signal } from '@angular/core';

import {
  CART_BANDEIRA_OPCOES,
  CART_MODO_CARTAO_OPCOES,
  CART_PAGAMENTO_OPCOES,
} from '../../constants/cart-payment-options';
import { SelectComponent } from '@app/shared/ui';
import { validarCpfCnpj, validarTelefone } from '@app/shared/utils/cpf-cnpj-validate.util';

@Component({
  selector: 'app-cart-checkout-form',
  standalone: true,
  imports: [SelectComponent],
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

  /** Sinalizado pelo pai quando o usuário clica "Finalizar" sem form válido */
  formTouched = input<boolean>(false);

  nomeChange = output<string>();
  cpfChange = output<string>();
  telChange = output<string>();
  pagamentoChange = output<string>();
  trocoChange = output<string>();
  modoCartaoChange = output<string>();
  parcelasChange = output<string>();
  bandeiraChange = output<string>();

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

  // ── Touched state ────────────────────────────────────────────────────────

  protected readonly nomeTouched  = signal(false);
  protected readonly cpfTouched   = signal(false);
  protected readonly telTouched   = signal(false);

  onNomeBlur(): void  { this.nomeTouched.set(true); }
  onCpfBlur(): void   { this.cpfTouched.set(true); }
  onTelBlur(): void   { this.telTouched.set(true); }

  // ── Validation errors (computed) ─────────────────────────────────────────

  protected readonly erroNome = computed((): string | null => {
    if (!this.nomeTouched() && !this.formTouched()) return null;
    if (this.nome().trim().length < 3) return 'Informe ao menos 3 caracteres.';
    return null;
  });

  protected readonly erroCpf = computed((): string | null => {
    if (!this.cpfTouched() && !this.formTouched()) return null;
    const digits = this.cpfCnpj().replace(/\D/g, '');
    if (digits.length < 11) return 'CPF/CNPJ incompleto.';
    if (!validarCpfCnpj(this.cpfCnpj())) return 'CPF/CNPJ inválido.';
    return null;
  });

  protected readonly erroTel = computed((): string | null => {
    if (!this.telTouched() && !this.formTouched()) return null;
    const digits = this.telefone().replace(/\D/g, '');
    if (digits.length < 10) return 'Telefone incompleto.';
    if (!validarTelefone(this.telefone())) return 'DDD inválido.';
    return null;
  });

  // ── Masks ────────────────────────────────────────────────────────────────

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = CartCheckoutFormComponent.maskCpfCnpj(input.value);
    input.value = masked;
    this.cpfChange.emit(masked);
  }

  onTelInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = CartCheckoutFormComponent.maskTelefone(input.value);
    input.value = masked;
    this.telChange.emit(masked);
  }

  static maskCpfCnpj(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      // CPF: 000.000.000-00
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    // CNPJ: 00.000.000/0000-00
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  static maskTelefone(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      // (00) 0000-0000
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    }
    // (00) 00000-0000
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }
}
