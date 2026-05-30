import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { ProdutoApi } from '../../../../../core/models/catalog-api.model';
import type { PageResult } from '../../../models/page-result.model';
import { ButtonComponent, ConfirmDialogComponent, IconComponent, InputSearchComponent, PageHeaderComponent, StatusBadgeComponent, UiStatusBadgeVariant, TableComponent, type TableColumn } from '@app/shared/ui';
import { ToastService } from '@app/shared/ui/feedback/toast/toast.service';
import { MerchantCatalogService } from '../../../services/merchant-catalog.service';
import { CsvImportModalComponent } from './csv-import/csv-import-modal.component';
import { downloadCsvTemplate, exportProductsToCsv } from '../../../utils/csv-product-parser.util';

@Component({
  selector: 'app-merchant-products-page',
  standalone: true,
  imports: [TableComponent, RouterLink,
    ButtonComponent,
    ConfirmDialogComponent,
    CsvImportModalComponent,
    IconComponent,
    InputSearchComponent,
    PageHeaderComponent,
    StatusBadgeComponent,],
  templateUrl: './merchant-products-page.component.html',
  styleUrl: './merchant-products-page.component.scss',
})
export class MerchantProductsPageComponent implements OnInit {
  private readonly catalog = inject(MerchantCatalogService);
  private readonly toast   = inject(ToastService);

  protected readonly columns: TableColumn[] = [
    { key: 'foto',    header: '',         width: 'img',     custom: true },
    { key: 'nome',    header: 'Nome' },
    { key: 'preco',   header: 'Preço',    type: 'currency', hideOnMobile: true },
    { key: 'fotos',   header: 'Fotos',    custom: true,     hideOnMobile: true },
    { key: 'estoque', header: 'Estoque',  custom: true,     hideOnMobile: true },
    { key: 'ativo',   header: 'Status',   custom: true },
    { key: 'acoes',   header: 'Ações',    width: 'actions', custom: true },
  ];

  protected readonly pageResult  = signal<PageResult<ProdutoApi> | null>(null);
  protected readonly loading     = signal(false);
  protected readonly error       = signal<string | null>(null);
  protected readonly confirmDeleteId  = signal<string | null>(null);
  protected readonly csvModalOpen     = signal(false);
  protected readonly exporting        = signal(false);

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

  protected onSearch(q: string): void {
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

  protected openCsvModal(): void     { this.csvModalOpen.set(true); }
  protected closeCsvModal(): void    { this.csvModalOpen.set(false); }
  protected onCsvImported(): void    { this.csvModalOpen.set(false); this.load(); }
  protected downloadCsvTemplate = downloadCsvTemplate;

  protected exportarCsv(): void {
    if (this.exporting()) return;
    this.exporting.set(true);

    forkJoin({
      products:   this.catalog.listAllProducts(),
      categories: this.catalog.listCategories(),
    }).subscribe({
      next: ({ products, categories }) => {
        const catMap = new Map<string, string>(
          categories
            .filter(c => c.id != null)
            .map(c => [c.id as string, c.nome]),
        );
        exportProductsToCsv(products, catMap);
        this.toast.show({
          message: `${products.length} produto${products.length !== 1 ? 's' : ''} exportado${products.length !== 1 ? 's' : ''} com sucesso.`,
          duration: 4000,
        });
        this.exporting.set(false);
      },
      error: () => {
        this.toast.show({ message: 'Erro ao exportar produtos. Tente novamente.', duration: 4000 });
        this.exporting.set(false);
      },
    });
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
