import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import type { ProdutoApi, OpcaoVariacaoApi, VariacaoApi } from '../../../../shared/models/catalog-api.model';
import { MerchantCatalogService } from '../../services/merchant-catalog.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

interface CartItem {
  productId: string;
  opcaoId: string | null;
  titulo: string;
  quantidade: number;
  precoUnit: number;
}

interface ProductOption {
  produto: ProdutoApi;
  variacao?: VariacaoApi;
  opcao?: OpcaoVariacaoApi;
  /** Label exibido na busca, ex.: "Camiseta — Azul G" */
  label: string;
  precoUnit: number;
}

const FORMAS = [
  { value: 'DINHEIRO', label: '💵 Dinheiro' },
  { value: 'PIX',      label: '📱 Pix'      },
  { value: 'CREDITO',  label: '💳 Crédito'  },
  { value: 'DEBITO',   label: '💳 Débito'   },
];

@Component({
  selector: 'app-merchant-pdv-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, IconComponent],
  templateUrl: './merchant-pdv-page.component.html',
  styleUrl: './merchant-pdv-page.component.scss',
})
export class MerchantPdvPageComponent {
  private readonly catalog = inject(MerchantCatalogService);
  private readonly http    = inject(HttpClient);
  private readonly fb      = inject(FormBuilder);
  private readonly router  = inject(Router);

  protected readonly FORMAS = FORMAS;

  // ── Busca de produtos ─────────────────────────────────────────────────────
  protected readonly searchQuery  = signal('');
  protected readonly searchResults = signal<ProductOption[]>([]);
  protected readonly searching    = signal(false);
  protected readonly showDropdown = signal(false);

  private readonly search$ = new Subject<string>();

  // ── Carrinho ──────────────────────────────────────────────────────────────
  protected readonly cart   = signal<CartItem[]>([]);
  protected readonly total  = computed(() =>
    this.cart().reduce((s, i) => s + i.precoUnit * i.quantidade, 0),
  );
  protected readonly isEmpty = computed(() => this.cart().length === 0);

  // ── Pagamento ─────────────────────────────────────────────────────────────
  protected readonly forma        = signal('DINHEIRO');
  protected readonly trocoPara    = signal<number | null>(null);
  protected readonly parcelas     = signal<number>(1);
  protected readonly nomeCliente  = signal('');
  protected readonly telefone     = signal('');

  // ── Estado de envio ───────────────────────────────────────────────────────
  protected readonly saving = signal(false);
  protected readonly error  = signal<string | null>(null);
  protected readonly done   = signal(false);

  constructor() {
    // Debounce na busca
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => {
        this.searching.set(true);
        return this.catalog.listProducts(0, 30, q);
      }),
    ).subscribe({
      next: (page) => {
        this.searching.set(false);
        this.searchResults.set(this.expandOptions(page.content));
        this.showDropdown.set(true);
      },
      error: () => this.searching.set(false),
    });
  }

  protected onSearchInput(ev: Event): void {
    const q = (ev.target as HTMLInputElement).value;
    this.searchQuery.set(q);
    if (q.trim().length >= 2) {
      this.search$.next(q.trim());
    } else {
      this.searchResults.set([]);
      this.showDropdown.set(false);
    }
  }

  protected selectOption(opt: ProductOption, inputEl: HTMLInputElement): void {
    this.addToCart(opt);
    inputEl.value = '';
    this.searchQuery.set('');
    this.showDropdown.set(false);
    this.searchResults.set([]);
  }

  protected closeDropdown(): void {
    // Delay para permitir o click no item antes de fechar
    setTimeout(() => this.showDropdown.set(false), 150);
  }

  // ── Carrinho ──────────────────────────────────────────────────────────────

  private addToCart(opt: ProductOption): void {
    const existingIdx = this.cart().findIndex(
      (i) => i.productId === opt.produto.id && i.opcaoId === (opt.opcao?.id ?? null),
    );
    if (existingIdx >= 0) {
      this.cart.update((items) =>
        items.map((item, idx) =>
          idx === existingIdx ? { ...item, quantidade: item.quantidade + 1 } : item,
        ),
      );
    } else {
      this.cart.update((items) => [
        ...items,
        {
          productId: opt.produto.id!,
          opcaoId:   opt.opcao?.id ?? null,
          titulo:    opt.label,
          quantidade: 1,
          precoUnit: opt.precoUnit,
        },
      ]);
    }
  }

  protected incQty(idx: number): void {
    this.cart.update((items) =>
      items.map((item, i) => i === idx ? { ...item, quantidade: item.quantidade + 1 } : item),
    );
  }

  protected decQty(idx: number): void {
    this.cart.update((items) => {
      const next = items.map((item, i) =>
        i === idx ? { ...item, quantidade: item.quantidade - 1 } : item,
      );
      return next.filter((item) => item.quantidade > 0);
    });
  }

  protected removeItem(idx: number): void {
    this.cart.update((items) => items.filter((_, i) => i !== idx));
  }

  // ── Pagamento ─────────────────────────────────────────────────────────────

  protected setForma(f: string): void { this.forma.set(f); }

  protected onTrocoInput(ev: Event): void {
    const v = parseFloat((ev.target as HTMLInputElement).value);
    this.trocoPara.set(isNaN(v) ? null : v);
  }

  protected onParcelasInput(ev: Event): void {
    const v = parseInt((ev.target as HTMLInputElement).value, 10);
    this.parcelas.set(isNaN(v) || v < 1 ? 1 : v);
  }

  protected get troco(): number | null {
    if (this.forma() !== 'DINHEIRO' || !this.trocoPara()) return null;
    const t = (this.trocoPara() ?? 0) - this.total();
    return t >= 0 ? t : null;
  }

  // ── Confirmar venda ───────────────────────────────────────────────────────

  protected confirmar(): void {
    if (this.isEmpty() || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);

    const payload = {
      nomeCliente:     this.nomeCliente() || null,
      telefoneCliente: this.telefone()    || null,
      formaPagamento:  this.forma(),
      bandeira:        null,
      parcelas:        this.forma() === 'CREDITO' ? this.parcelas() : null,
      trocoPara:       this.forma() === 'DINHEIRO' ? this.trocoPara() : null,
      observacoes:     null,
      itens: this.cart().map((i) => ({
        productId: i.productId,
        opcaoId:   i.opcaoId,
        titulo:    i.titulo,
        quantidade: i.quantidade,
        precoUnit: i.precoUnit,
      })),
    };

    this.http
      .post<unknown>(`${environment.apiUrl}/api/v1/merchant/orders/presencial`, payload)
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.done.set(true);
        },
        error: (e: { error?: { error?: string }; message?: string }) => {
          this.saving.set(false);
          this.error.set(e?.error?.error ?? e?.message ?? 'Erro ao registrar venda.');
        },
      });
  }

  protected novaVenda(): void {
    this.cart.set([]);
    this.nomeCliente.set('');
    this.telefone.set('');
    this.forma.set('DINHEIRO');
    this.trocoPara.set(null);
    this.parcelas.set(1);
    this.error.set(null);
    this.done.set(false);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private expandOptions(products: ProdutoApi[]): ProductOption[] {
    const result: ProductOption[] = [];
    for (const p of products) {
      if (!p.variacoes?.length) {
        // Produto simples
        result.push({ produto: p, label: p.nome, precoUnit: p.preco });
      } else {
        // Expande por opção de cada variação
        for (const v of p.variacoes) {
          for (const op of v.opcoes) {
            if (op.estoque > 0) {
              const extra = op.precoExtra ?? 0;
              result.push({
                produto:   p,
                variacao:  v,
                opcao:     op,
                label:     `${p.nome} — ${op.valor}`,
                precoUnit: p.preco + extra,
              });
            }
          }
        }
      }
    }
    return result;
  }
}
