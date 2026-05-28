import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import type { ProdutoApi, OpcaoVariacaoApi, VariacaoApi } from '../../../../../core/models/catalog-api.model';
import { ButtonComponent, InputComponent, InputPhoneComponent, InputSearchComponent, SelectComponent, type SelectOption, IconComponent } from '@app/shared/ui';
import { MerchantCatalogService } from '../../../services/merchant-catalog.service';

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
  imports: [RouterLink, CurrencyPipe, ButtonComponent, IconComponent, InputComponent, InputPhoneComponent, InputSearchComponent, SelectComponent],
  templateUrl: './merchant-pdv-page.component.html',
  styleUrl: './merchant-pdv-page.component.scss',
})
export class MerchantPdvPageComponent {
  private readonly catalog = inject(MerchantCatalogService);
  private readonly http    = inject(HttpClient);
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
  protected readonly forma       = signal('DINHEIRO');
  protected readonly trocoStr    = signal('');
  protected readonly parcelasStr = signal('1');
  protected readonly nomeCliente = signal('');
  protected readonly telefone    = signal('');

  /** Valor numérico do troco derivado do campo de texto. */
  protected readonly trocoPara = computed<number | null>(() => {
    const v = parseFloat(this.trocoStr());
    return isNaN(v) ? null : v;
  });

  /** Número de parcelas derivado do campo de texto. */
  protected readonly parcelas = computed<number>(() => {
    const n = parseInt(this.parcelasStr(), 10);
    return isNaN(n) || n < 1 ? 1 : n;
  });

  private readonly _brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  /** Opções do select de parcelas, com valor por parcela calculado dinamicamente. */
  protected readonly parcelasOptions = computed<SelectOption[]>(() =>
    Array.from({ length: 12 }, (_, i) => {
      const n = i + 1;
      return { value: String(n), label: `${n}x de ${this._brl.format(this.total() / n)}` };
    })
  );

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

  protected onSearchInput(q: string): void {
    if (q.trim().length >= 2) {
      this.search$.next(q.trim());
    } else {
      this.searchResults.set([]);
      this.showDropdown.set(false);
    }
  }

  protected selectOption(opt: ProductOption): void {
    this.addToCart(opt);
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
    this.trocoStr.set('');
    this.parcelasStr.set('1');
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
