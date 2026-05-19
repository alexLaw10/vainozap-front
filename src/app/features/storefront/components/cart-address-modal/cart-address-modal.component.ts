import { Component, effect, input, output, signal } from '@angular/core';

import { UFS_BR, isUfBrasil } from '../../../../shared/constants/ufs-brasil';
import type { StorefrontEnderecoEntrega } from '../../../../shared/models/storefront-entrega.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { formatCepMask as formatCepParaExibir, normalizeCepDigits } from '../../../../shared/utils/cep.util';

@Component({
  selector: 'app-cart-address-modal',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './cart-address-modal.component.html',
  styleUrl: './cart-address-modal.component.scss',
})
export class CartAddressModalComponent {
  open = input(false);
  corPrimaria = input.required<string>();
  initialAddress = input<StorefrontEnderecoEntrega | null>(null);

  saved = output<StorefrontEnderecoEntrega>();
  back = output<void>();

  protected readonly enderecoSalvarErro = signal('');
  protected readonly addrCepDigits = signal('');
  protected readonly addrLogradouro = signal('');
  protected readonly addrNumero = signal('');
  protected readonly addrBairro = signal('');
  protected readonly addrUf = signal('');
  protected readonly addrCidade = signal('');
  protected readonly addrComplemento = signal('');

  protected readonly ufsBr = [...UFS_BR];
  protected readonly formatCepMask = formatCepParaExibir;

  constructor() {
    effect(() => {
      if (!this.open()) return;
      this.enderecoSalvarErro.set('');
      const s = this.initialAddress();
      if (s) {
        this.addrCepDigits.set(s.cep);
        this.addrLogradouro.set(s.logradouro);
        this.addrNumero.set(s.numero);
        this.addrBairro.set(s.bairro);
        this.addrUf.set(s.uf);
        this.addrCidade.set(s.cidade);
        this.addrComplemento.set(s.complemento);
      }
    });
  }

  protected onBackdropOrVoltar(): void {
    this.back.emit();
  }

  protected salvarEnderecoModal(): void {
    const err = this.validarEnderecoDraft();
    if (err) {
      this.enderecoSalvarErro.set(err);
      return;
    }
    this.enderecoSalvarErro.set('');
    this.saved.emit(this.montarEnderecoDoDraft());
  }

  protected abrirConsultaCep(): void {
    window.open('https://buscacepinter.correios.com.br/app/endereco/index.php', '_blank', 'noopener,noreferrer');
  }

  protected onAddrCep(ev: Event): void {
    this.addrCepDigits.set(normalizeCepDigits((ev.target as HTMLInputElement).value));
  }

  protected onAddrLogradouro(ev: Event): void {
    this.addrLogradouro.set((ev.target as HTMLInputElement).value.slice(0, 50));
  }

  protected onAddrNumero(ev: Event): void {
    this.addrNumero.set((ev.target as HTMLInputElement).value.slice(0, 6));
  }

  protected onAddrBairro(ev: Event): void {
    this.addrBairro.set((ev.target as HTMLInputElement).value.slice(0, 30));
  }

  protected onAddrUf(ev: Event): void {
    this.addrUf.set((ev.target as HTMLSelectElement).value.slice(0, 2).toUpperCase());
  }

  protected onAddrCidade(ev: Event): void {
    this.addrCidade.set((ev.target as HTMLInputElement).value.slice(0, 60));
  }

  protected onAddrComplemento(ev: Event): void {
    this.addrComplemento.set((ev.target as HTMLInputElement).value.slice(0, 20));
  }

  private montarEnderecoDoDraft(): StorefrontEnderecoEntrega {
    return {
      cep: this.addrCepDigits(),
      logradouro: this.addrLogradouro().trim(),
      numero: this.addrNumero().trim(),
      bairro: this.addrBairro().trim(),
      uf: this.addrUf().trim().toUpperCase(),
      cidade: this.addrCidade().trim(),
      complemento: this.addrComplemento().trim(),
    };
  }

  private validarEnderecoDraft(): string | null {
    const cep = this.addrCepDigits().replace(/\D/g, '');
    if (cep.length !== 8) return 'Informe um CEP válido (8 dígitos).';
    const rua = this.addrLogradouro().trim();
    if (rua.length < 2 || rua.length > 50) return 'Preencha a rua/avenida (2 a 50 caracteres).';
    const num = this.addrNumero().trim();
    if (num.length < 1 || num.length > 6) return 'Preencha o número (até 6 caracteres).';
    const bairro = this.addrBairro().trim();
    if (bairro.length < 1 || bairro.length > 30) return 'Preencha o bairro (até 30 caracteres).';
    const uf = this.addrUf().trim().toUpperCase();
    if (!uf || !isUfBrasil(uf)) return 'Selecione a UF.';
    const cidade = this.addrCidade().trim();
    if (cidade.length < 2) return 'Preencha a cidade.';
    return null;
  }
}
