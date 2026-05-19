import { CurrencyPipe, NgClass } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ProdutoApi } from '../../../../shared/models/catalog-api.model';
import type { PageResult } from '../../../../shared/models/page-result.model';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { StatusBadgeComponent, UiStatusBadgeVariant } from '../../../../shared/ui/status-badge/status-badge.component';
import { MerchantCatalogService } from '../../services/merchant-catalog.service';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';

@Component({
  selector: 'app-merchant-products-page',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    NgClass,
    PaginatorComponent,
    ButtonComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
    IconComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './merchant-products-page.component.html',
  styleUrl: './merchant-products-page.component.scss',
})
export class MerchantProductsPageComponent implements OnInit {
  private readonly catalog = inject(MerchantCatalogService);

  protected readonly pageResult  = signal<PageResult<ProdutoApi> | null>(null);
  protected readonly loading     = signal(false);
  protected readonly error       = signal<string | null>(null);
  protected readonly confirmDeleteId = signal<string | null>(null);

  protected readonly searchQ  = signal('');
  protected readonly curPage  = signal(0);
  protected readonly pageSize = 20;

  /** Atalhos para o template. */
  protected products()      { return this.pageResult()?.content ?? []; }
  protected totalElements() { return this.pageResult()?.totalElements ?? 0; }
  protected totalPages()    { return this.pageResult()?.totalPages ?? 0; }

  /** Estoque total do produto: direto (simples) ou soma das opções (variações). */
  protected estoqueTotal(p: ProdutoApi): number | null {
    if (p.variacoes && p.variacoes.length > 0) {
      return p.variacoes.reduce((acc, v) =>
        acc + v.opcoes.reduce((a, o) => a + o.estoque, 0), 0);
    }
    return p.estoque;
  }

  /** Classe CSS do badge de estoque. */
  protected estoqueBadgeClass(p: ProdutoApi): string {
    const total = this.estoqueTotal(p);
    if (total === null) return 'mp-estoque--info';
    if (total === 0)    return 'mp-estoque--zero';
    if (total <= 10)    return 'mp-estoque--baixo';
    return 'mp-estoque--ok';
  }

  protected estoqueBadgeVariant(p: ProdutoApi): UiStatusBadgeVariant {
    const total = this.estoqueTotal(p);
    if (total === null) return 'info';
    if (total === 0) return 'danger';
    if (total <= 10) return 'warning';
    return 'success';
  }

  protected estoqueBadgeLabel(p: ProdutoApi): string {
    const total = this.estoqueTotal(p);
    if (p.variacoes.length > 0) return `${total} (vars)`;
    if (total === 0) return 'Sem estoque';
    return `${total} un.`;
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalog.listProducts(this.curPage(), this.pageSize, this.searchQ()).subscribe({
      next:  (res) => { this.pageResult.set(res); this.loading.set(false); },
      error: (e)   => { this.error.set(e.message ?? 'Erro ao carregar'); this.loading.set(false); },
    });
  }

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected onSearch(ev: Event): void {
    const q = (ev.target as HTMLInputElement).value;
    this.searchQ.set(q);
    // debounce 350 ms — evita requisição a cada tecla
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.curPage.set(0);
      this.load();
    }, 350);
  }

  protected onPageChange(page: number): void {
    this.curPage.set(page);
    this.load();
  }

  protected askDelete(id: string | null): void {
    this.confirmDeleteId.set(id);
  }

  protected cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  protected confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.catalog.deleteProduct(id).subscribe({
      next: () => { this.confirmDeleteId.set(null); this.load(); },
      error: (e) => { this.error.set(e.message ?? 'Erro ao remover'); this.confirmDeleteId.set(null); },
    });
  }
}
