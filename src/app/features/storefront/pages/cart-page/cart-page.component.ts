import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CartAddressModalComponent } from '../../components/cart-address-modal/cart-address-modal.component';
import { CartCheckoutFormComponent } from '../../components/cart-checkout-form/cart-checkout-form.component';
import { CartLineMenuComponent } from '../../components/cart-line-menu/cart-line-menu.component';
import { CartOrderConfirmModalComponent } from '../../components/cart-order-confirm-modal/cart-order-confirm-modal.component';
import { CartOrderSummaryComponent } from '../../components/cart-order-summary/cart-order-summary.component';
import { CartShareModalComponent } from '../../components/cart-share-modal/cart-share-modal.component';
import { CART_BANDEIRA_OPCOES, CART_MODO_CARTAO_OPCOES, CART_PAGAMENTO_OPCOES } from '../../constants/cart-payment-options';
import type { EntregaModo } from '../../models/entrega-checkout.model';
import type { OrderConfirmSnapshot } from '../../models/order-confirm-snapshot.model';
import { StorefrontCartService, type CartLine } from '../../services/storefront-cart.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import {
  StorefrontOrderService,
  type StorefrontCreateOrderPayload,
} from '../../services/storefront-order.service';
import type { StorefrontEnderecoEntrega } from '../../../../shared/models/storefront-entrega.model';
import { parseBrlInputToNumber } from '../../../../shared/utils/brl-parse.util';
import { formatStorefrontEnderecoResumo } from '../../../../shared/utils/storefront-endereco-text.util';
import { environment } from '../../../../../environments/environment';

export type { EntregaModo } from '../../models/entrega-checkout.model';
export type { OrderConfirmSnapshot } from '../../models/order-confirm-snapshot.model';
export type { StorefrontEnderecoEntrega as CartEnderecoEntrega } from '../../../../shared/models/storefront-entrega.model';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CartCheckoutFormComponent,
    CartOrderSummaryComponent,
    CartAddressModalComponent,
    CartLineMenuComponent,
    CartShareModalComponent,
    CartOrderConfirmModalComponent,
  ],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
})
export class CartPageComponent {
  private readonly router = inject(Router);
  protected readonly cart = inject(StorefrontCartService);
  protected readonly context = inject(StorefrontContextService);
  private readonly orderService = inject(StorefrontOrderService);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.enderecoModalOpen()) {
      this.onEnderecoVoltar();
      return;
    }
    if (this.itemMenuLine()) {
      this.fecharItemMenu();
      return;
    }
    if (this.shareCartOpen()) {
      this.fecharCompartilharCarrinho();
      return;
    }
    if (this.confirmOpen()) {
      this.fecharConfirmacao();
      return;
    }
    this.fechar();
  }

  protected readonly nome = signal('');
  protected readonly cpfCnpj = signal('');
  protected readonly telefone = signal('');
  protected readonly formaPagamento = signal('');
  protected readonly cartTrocoPara = signal('');
  protected readonly cartModoCartao = signal<'presencial' | 'online'>('presencial');
  protected readonly cartParcelas = signal('');
  protected readonly cartBandeira = signal('');
  protected readonly entrega = signal<EntregaModo>('loja');
  protected readonly observacoes = signal('');

  protected readonly enderecoModalOpen = signal(false);
  protected readonly enderecoConfirmado = signal<StorefrontEnderecoEntrega | null>(null);

  protected readonly confirmOpen = signal(false);
  protected readonly orderSnapshot = signal<OrderConfirmSnapshot | null>(null);
  protected readonly itemMenuLine = signal<CartLine | null>(null);
  protected readonly shareCartOpen = signal(false);
  protected readonly submittingOrder = signal(false);
  protected readonly submitError = signal('');

  protected readonly formularioValido = computed(() => {
    const nomeOk = this.nome().trim().length >= 3;
    const docOk = this.cpfCnpj().replace(/\D/g, '').length >= 11;
    const telOk = this.telefone().replace(/\D/g, '').length >= 10;
    const pay = this.formaPagamento();
    if (!pay) return false;
    if (pay === 'dinheiro') {
      const troco = parseBrlInputToNumber(this.cartTrocoPara());
      if (troco === null || troco < 0) return false;
    }
    if (pay === 'cartao_credito' || pay === 'cartao_debito') {
      if (!this.cartBandeira()) return false;
      if (pay === 'cartao_credito' && !this.cartParcelas()) return false;
    }
    const entregaOk =
      this.entrega() === 'loja' ||
      (this.entrega() === 'endereco' && this.enderecoConfirmado() !== null);
    if (!entregaOk) return false;
    return nomeOk && docOk && telOk;
  });

  protected readonly podeFinalizar = computed(
    () => this.cart.lines().length > 0 && this.formularioValido(),
  );

  protected onPagamento(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    const prev = this.formaPagamento();
    this.formaPagamento.set(v);
    if (v === prev) return;
    if (v !== 'dinheiro') this.cartTrocoPara.set('');
    if (v !== 'cartao_credito' && v !== 'cartao_debito') {
      this.cartModoCartao.set('presencial');
      this.cartParcelas.set('');
      this.cartBandeira.set('');
    }
    if (v !== 'cartao_credito') this.cartParcelas.set('');
  }

  protected onModoCartao(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value as 'presencial' | 'online';
    this.cartModoCartao.set(v === 'online' ? 'online' : 'presencial');
  }

  protected onParcelas(ev: Event): void {
    this.cartParcelas.set((ev.target as HTMLSelectElement).value);
  }

  protected onBandeira(ev: Event): void {
    this.cartBandeira.set((ev.target as HTMLSelectElement).value);
  }

  protected onEscolherEntrega(m: EntregaModo): void {
    if (m === 'loja') {
      this.entrega.set('loja');
      this.enderecoModalOpen.set(false);
      return;
    }
    this.entrega.set('endereco');
    this.enderecoModalOpen.set(true);
  }

  protected onEnderecoSalvo(addr: StorefrontEnderecoEntrega): void {
    this.enderecoConfirmado.set(addr);
    this.enderecoModalOpen.set(false);
  }

  protected onEnderecoVoltar(): void {
    this.enderecoModalOpen.set(false);
    this.entrega.set('loja');
  }

  protected onItemMenuOpen(ev: { line: CartLine; event: Event }): void {
    this.abrirMenuItem(ev.line, ev.event);
  }

  protected fechar(): void {
    if (this.itemMenuLine()) {
      this.fecharItemMenu();
      return;
    }
    if (this.shareCartOpen()) {
      this.fecharCompartilharCarrinho();
      return;
    }
    if (this.confirmOpen()) {
      this.fecharConfirmacao();
      return;
    }
    void this.router.navigate(['/']);
  }

  protected fecharConfirmacao(): void {
    this.confirmOpen.set(false);
    this.orderSnapshot.set(null);
  }

  protected abrirMenuItem(l: CartLine, ev: Event): void {
    ev.stopPropagation();
    this.fecharCompartilharCarrinho();
    this.itemMenuLine.set(l);
  }

  protected fecharItemMenu(): void {
    this.itemMenuLine.set(null);
  }

  protected alterarItem(l: CartLine): void {
    this.fecharItemMenu();
    this.cart.removeLine(l.id);
    void this.router.navigate(['/products', l.productId]);
  }

  protected removerItemMenu(l: CartLine): void {
    this.cart.removeLine(l.id);
    this.fecharItemMenu();
  }

  protected abrirCompartilharCarrinho(): void {
    this.fecharItemMenu();
    this.shareCartOpen.set(true);
  }

  protected fecharCompartilharCarrinho(): void {
    this.shareCartOpen.set(false);
  }

  protected textoCompartilharCarrinho(): string {
    const lines = this.cart
      .lines()
      .map((l) => `• ${l.quantidade}x ${l.titulo} — ${this.formatMoney(l.precoUnit * l.quantidade)}`)
      .join('\n');
    const n = this.cart.lines().length;
    return `Confira meu carrinho (${n} ${n === 1 ? 'item' : 'itens'}):\n${lines}\n\nTotal: ${this.formatMoney(this.cart.subtotal())}`;
  }

  protected urlCarrinho(): string {
    if (typeof location === 'undefined') return '/cart';
    return `${location.origin}/cart`;
  }

  protected compartilharCarrinhoWhatsApp(): void {
    const url = `https://wa.me/?text=${encodeURIComponent(this.textoCompartilharCarrinho())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected compartilharCarrinhoFacebook(): void {
    const u = encodeURIComponent(this.urlCarrinho());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '_blank', 'noopener,noreferrer');
  }

  protected compartilharCarrinhoTelegram(): void {
    const u = encodeURIComponent(this.urlCarrinho());
    const text = encodeURIComponent(this.textoCompartilharCarrinho());
    window.open(`https://t.me/share/url?url=${u}&text=${text}`, '_blank', 'noopener,noreferrer');
  }

  protected async copiarLinkCarrinho(): Promise<void> {
    const url = this.urlCarrinho();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* indisponível ou negado */
    }
  }

  protected falarVendedor(): void {
    const subject = encodeURIComponent('Dúvida sobre o pedido');
    window.location.href = `mailto:?subject=${subject}`;
  }

  protected async finalizar(): Promise<void> {
    if (!this.podeFinalizar() || this.submittingOrder()) return;
    this.submitError.set('');
    this.submittingOrder.set(true);
    this.fecharItemMenu();
    this.fecharCompartilharCarrinho();
    this.enderecoModalOpen.set(false);
    const payload = this.buildCreateOrderPayload();
    let createdOrderId = '';
    if (environment.useMock) {
      createdOrderId = String(Math.floor(1000 + Math.random() * 9000));
    } else {
      try {
        const created = await firstValueFrom(this.orderService.create(payload));
        createdOrderId = created.id;
      } catch (error) {
        console.warn('[Order] Erro ao criar pedido', error);
        this.submitError.set('Nao foi possivel finalizar o pedido agora. Tente novamente.');
        this.submittingOrder.set(false);
        return;
      }
    }
    const payLabel = this.resumoFormaPagamento();
    const end = this.entrega() === 'endereco' ? this.enderecoConfirmado() : null;
    const snap: OrderConfirmSnapshot = {
      orderId: createdOrderId,
      createdAt: new Date(),
      nome: this.nome().trim(),
      cpfCnpj: this.cpfCnpj().trim(),
      telefone: this.telefone().trim(),
      formaPagamentoLabel: payLabel,
      entregaLabel: this.entrega() === 'loja' ? 'Retirar na loja' : 'Entregar no meu endereço',
      enderecoEntrega: end ? formatStorefrontEnderecoResumo(end) : null,
      observacoes: this.observacoes().trim(),
      lines: this.cart.lines().map((l) => ({ ...l })),
      subtotal: this.cart.subtotal(),
    };
    this.orderSnapshot.set(snap);
    this.confirmOpen.set(true);
    this.submittingOrder.set(false);
  }

  protected enviarWhatsApp(): void {
    const snap = this.orderSnapshot();
    if (!snap) return;
    const phone = this.context.tenant().whatsapp.replace(/\D/g, '');
    if (!phone) return;
    const text = this.buildWhatsAppMessage(snap);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    this.confirmOpen.set(false);
    this.orderSnapshot.set(null);
    this.cart.clear();
    this.nome.set('');
    this.cpfCnpj.set('');
    this.telefone.set('');
    this.formaPagamento.set('');
    this.cartTrocoPara.set('');
    this.cartModoCartao.set('presencial');
    this.cartParcelas.set('');
    this.cartBandeira.set('');
    this.observacoes.set('');
    this.entrega.set('loja');
    this.enderecoConfirmado.set(null);
    void this.router.navigate(['/']);
  }

  private buildWhatsAppMessage(s: OrderConfirmSnapshot): string {
    const lines = s.lines
      .map((l) => `• ${l.quantidade}x ${l.titulo} — ${this.formatMoney(l.precoUnit * l.quantidade)}`)
      .join('\n');
    const obs = s.observacoes ? `\nObservações: ${s.observacoes}` : '';
    return (
      `*Pedido #${s.orderId}*\n` +
      `${this.formatResumoData(s.createdAt)}\n\n` +
      `Cliente: ${s.nome}\n` +
      `CPF/CNPJ: ${s.cpfCnpj}\n` +
      `Telefone: ${s.telefone}\n` +
      `Entrega: ${s.entregaLabel}\n` +
      (s.enderecoEntrega ? `${s.enderecoEntrega}\n` : '') +
      `Pagamento: ${s.formaPagamentoLabel}\n\n` +
      `${lines}\n\n` +
      `Total dos itens (${s.lines.length}): ${this.formatMoney(s.subtotal)}\n` +
      `*Total pedido: ${this.formatMoney(s.subtotal)}*${obs}`
    );
  }

  private formatMoney(n: number): string {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private formatResumoData(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} - ${h}:${m}`;
  }

  protected resumoFormaPagamento(): string {
    const pay = this.formaPagamento();
    const base = CART_PAGAMENTO_OPCOES.find((o) => o.value === pay)?.label ?? pay;
    if (pay === 'dinheiro') {
      const troco = parseBrlInputToNumber(this.cartTrocoPara());
      const fmt = troco != null ? this.formatMoney(troco) : '—';
      return `${base} — Troco para ${fmt}`;
    }
    if (pay === 'cartao_credito') {
      const modo = CART_MODO_CARTAO_OPCOES.find((o) => o.value === this.cartModoCartao())?.label ?? '';
      const px = this.cartParcelas();
      const parc = px ? `${px}x` : '';
      const band = CART_BANDEIRA_OPCOES.find((o) => o.value === this.cartBandeira())?.label ?? '';
      return [base, modo, parc, band].filter(Boolean).join(' — ');
    }
    if (pay === 'cartao_debito') {
      const modo = CART_MODO_CARTAO_OPCOES.find((o) => o.value === this.cartModoCartao())?.label ?? '';
      const band = CART_BANDEIRA_OPCOES.find((o) => o.value === this.cartBandeira())?.label ?? '';
      return [base, modo, band].filter(Boolean).join(' — ');
    }
    return base;
  }

  private buildCreateOrderPayload(): StorefrontCreateOrderPayload {
    const endereco = this.enderecoConfirmado();
    const troco = parseBrlInputToNumber(this.cartTrocoPara());
    const parcelasNum = this.cartParcelas() ? Number(this.cartParcelas()) : null;
    return {
      id: null,
      tenantId: null,
      status: null,
      subtotal: this.cart.subtotal(),
      cliente: {
        nome: this.nome().trim(),
        cpfCnpj: this.cpfCnpj().trim(),
        telefone: this.telefone().trim(),
        observacoes: this.observacoes().trim(),
      },
      pagamento: {
        forma: this.formaPagamento(),
        bandeira: this.cartBandeira() || null,
        parcelas: Number.isFinite(parcelasNum) ? parcelasNum : null,
        modoCartao: this.formaPagamento().includes('cartao') ? this.cartModoCartao() : null,
        trocoPara: this.formaPagamento() === 'dinheiro' ? troco : null,
      },
      entrega: {
        modo: this.entrega(),
        cep: this.entrega() === 'endereco' ? endereco?.cep ?? null : null,
        logradouro: this.entrega() === 'endereco' ? endereco?.logradouro ?? null : null,
        numero: this.entrega() === 'endereco' ? endereco?.numero ?? null : null,
        bairro: this.entrega() === 'endereco' ? endereco?.bairro ?? null : null,
        uf: this.entrega() === 'endereco' ? endereco?.uf ?? null : null,
        cidade: this.entrega() === 'endereco' ? endereco?.cidade ?? null : null,
        complemento: this.entrega() === 'endereco' ? endereco?.complemento ?? null : null,
      },
      linhas: this.cart.lines().map((l) => ({
        id: null,
        productId: l.productId,
        titulo: l.titulo,
        quantidade: l.quantidade,
        precoUnit: l.precoUnit,
      })),
      criadoEm: null,
    };
  }
}
