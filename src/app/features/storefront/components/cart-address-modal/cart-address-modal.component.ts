import { Component, effect, inject, input, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { UFS_BR, isUfBrasil } from '../../../../shared/constants/ufs-brasil';
import type { StorefrontEnderecoEntrega } from '../../models/storefront-entrega.model';
import { IconComponent, SelectComponent } from '@app/shared/ui';
import { formatCepMask as formatCepParaExibir, normalizeCepDigits } from '../../../../shared/utils/cep.util';

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

@Component({
  selector: 'app-cart-address-modal',
  standalone: true,
  imports: [IconComponent, SelectComponent],
  templateUrl: './cart-address-modal.component.html',
  styleUrl: './cart-address-modal.component.scss',
})
export class CartAddressModalComponent {
  private readonly http = inject(HttpClient);

  open = input(false);
  corPrimaria = input.required<string>();
  initialAddress = input<StorefrontEnderecoEntrega | null>(null);

  saved = output<StorefrontEnderecoEntrega>();
  back = output<void>();

  protected readonly enderecoSalvarErro = signal('');
  protected readonly addrCepDigits    = signal('');
  protected readonly addrLogradouro   = signal('');
  protected readonly addrNumero       = signal('');
  protected readonly addrBairro       = signal('');
  protected readonly addrUf           = signal('');
  protected readonly addrCidade       = signal('');
  protected readonly addrComplemento  = signal('');
  protected readonly cepLoading       = signal(false);
  protected readonly cepErro          = signal('');

  protected readonly ufOptions    = UFS_BR.map(uf => ({ value: uf, label: uf }));
  protected readonly formatCepMask = formatCepParaExibir;

  constructor() {
    effect(() => {
      if (!this.open()) return;
      this.enderecoSalvarErro.set('');
      this.cepErro.set('');
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
    const digits = normalizeCepDigits((ev.target as HTMLInputElement).value);
    this.addrCepDigits.set(digits);
    this.cepErro.set('');

    // Busca automática ao completar 8 dígitos
    if (digits.length === 8) {
      this.buscarCep(digits);
    }
  }

  private buscarCep(cep: string): void {
    this.cepLoading.set(true);
    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (res) => {
        this.cepLoading.set(false);
        if (res.erro) {
          this.cepErro.set('CEP não encontrado.');
          return;
        }
        // Preenche os campos automaticamente, sem sobrescrever o que o usuário já digitou
        if (res.logradouro) this.addrLogradouro.set(res.logradouro);
        if (res.bairro)     this.addrBairro.set(res.bairro);
        if (res.localidade) this.addrCidade.set(res.localidade);
        if (res.uf)         this.addrUf.set(res.uf);
      },
      error: () => {
        this.cepLoading.set(false);
        // Falha silenciosa — o cliente preenche manualmente
      },
    });
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

  protected onAddrUf(val: string): void {
    this.addrUf.set(val.slice(0, 2).toUpperCase());
  }

  protected onAddrCidade(ev: Event): void {
    this.addrCidade.set((ev.target as HTMLInputElement).value.slice(0, 60));
  }

  protected onAddrComplemento(ev: Event): void {
    this.addrComplemento.set((ev.target as HTMLInputElement).value.slice(0, 20));
  }

  private montarEnderecoDoDraft(): StorefrontEnderecoEntrega {
    return {
      cep:         this.addrCepDigits(),
      logradouro:  this.addrLogradouro().trim(),
      numero:      this.addrNumero().trim(),
      bairro:      this.addrBairro().trim(),
      uf:          this.addrUf().trim().toUpperCase(),
      cidade:      this.addrCidade().trim(),
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
