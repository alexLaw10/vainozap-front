import { NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { AjusteEstoqueApi, OpcaoVariacaoApi, ProdutoApi, VariacaoApi } from '../../../../../core/models/catalog-api.model';
import { ButtonComponent, IconComponent, ModalComponent, SkeletonComponent, TableComponent } from '@app/shared/ui';
import { ToastService } from '@app/shared/ui/feedback/toast/toast.service';
import { MerchantCatalogService } from '../../../services/merchant-catalog.service';
import { exportCurrentStockToCsv } from '../../../utils/stock-csv.util';

type Filtro = 'todos' | 'baixo' | 'zero';

interface AjusteModal {
  produto: ProdutoApi;
  /** null = produto simples | objeto = opção de variação */
  opcao: (OpcaoVariacaoApi & { variacaoNome: string }) | null;
  operacao: AjusteEstoqueApi['operacao'];
  quantidade: number;
}

@Component({
  selector: 'app-merchant-estoque-page',
  standalone: true,
  imports: [TableComponent, NgClass, ButtonComponent, IconComponent, ModalComponent, SkeletonComponent, RouterLink],
  templateUrl: './merchant-estoque-page.component.html',
  styleUrl:    './merchant-estoque-page.component.scss',
})
export class MerchantEstoquePageComponent implements OnInit {
  private readonly catalog  = inject(MerchantCatalogService);
  private readonly toast    = inject(ToastService);

  protected readonly products = signal<ProdutoApi[]>([]);
  protected readonly loading  = signal(false);
  protected readonly saving   = signal(false);
  protected readonly error    = signal<string | null>(null);
  protected readonly filtro   = signal<Filtro>('todos');
  protected readonly modal    = signal<AjusteModal | null>(null);
  protected readonly exporting = signal(false);

  // Campos do modal como signals independentes
  protected readonly modalOperacao = signal<string>('ENTRADA');
  protected readonly modalQty      = signal('0');


  protected readonly filtered = computed(() => {
    const f = this.filtro();
    return this.products().filter((p) => {
      const total = this.estoqueTotal(p);
      if (f === 'zero')  return total === 0;
      if (f === 'baixo') return total !== null && total > 0 && total <= 10;
      return true;
    });
  });

  ngOnInit(): void { this.load(); }

  protected exportarCsv(): void {
    const prods = this.products();
    if (!prods.length) {
      this.toast.show({ message: 'Nenhum produto para exportar.', duration: 3000 });
      return;
    }
    exportCurrentStockToCsv(prods);
    const total = prods.reduce((acc, p) =>
      acc + (p.variacoes?.length
        ? p.variacoes.reduce((a, v) => a + v.opcoes.length, 0)
        : 1), 0);
    this.toast.show({
      message: `${total} linha${total !== 1 ? 's' : ''} exportada${total !== 1 ? 's' : ''} com sucesso.`,
      duration: 4000,
    });
  }

  private load(): void {
    this.loading.set(true);
    this.catalog.listProducts(0, 200).subscribe({
      next:  (page) => { this.products.set(page.content); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }

  // ── Helpers de estoque ────────────────────────────────────────────────────

  protected estoqueTotal(p: ProdutoApi): number {
    if (p.variacoes?.length) {
      return p.variacoes.reduce((acc, v) =>
        acc + v.opcoes.reduce((a, o) => a + o.estoque, 0), 0);
    }
    return p.estoque ?? 0;
  }

  protected badgeClass(total: number): string {
    if (total === 0)  return 'est-badge--zero';
    if (total <= 10)  return 'est-badge--baixo';
    return 'est-badge--ok';
  }

  protected opcoesList(p: ProdutoApi): (OpcaoVariacaoApi & { variacaoNome: string })[] {
    return (p.variacoes ?? []).flatMap((v: VariacaoApi) =>
      v.opcoes.map((o) => ({ ...o, variacaoNome: v.nome }))
    );
  }

  // ── Modal de ajuste ───────────────────────────────────────────────────────

  protected openAjuste(produto: ProdutoApi, opcao: (OpcaoVariacaoApi & { variacaoNome: string }) | null): void {
    this.modal.set({ produto, opcao, operacao: 'ENTRADA', quantidade: 0 });
    this.modalOperacao.set('ENTRADA');
    this.modalQty.set('0');
    this.error.set(null);
  }

  protected closeModal(): void { this.modal.set(null); }

  protected incrementQty(): void {
    this.modalQty.set(String((parseInt(this.modalQty(), 10) || 0) + 1));
  }

  protected decrementQty(): void {
    const v = (parseInt(this.modalQty(), 10) || 0) - 1;
    this.modalQty.set(String(Math.max(0, v)));
  }

  protected onQtyInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.modalQty.set(v === '' ? '0' : String(Math.max(0, parseInt(v, 10) || 0)));
  }

  protected confirmarAjuste(): void {
    const m = this.modal();
    if (!m || this.saving()) return;

    const qty = parseInt(this.modalQty(), 10) || 0;
    const req: AjusteEstoqueApi = { operacao: this.modalOperacao() as AjusteEstoqueApi['operacao'], quantidade: qty };
    this.saving.set(true);

    if (m.opcao) {
      this.catalog.ajustarEstoqueOpcao(m.produto.id!, m.opcao.id!, req).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.load();
        },
        error: (e: { error?: { detail?: string }; message?: string }) => {
          this.saving.set(false);
          this.error.set(e?.error?.detail ?? e?.message ?? 'Erro ao ajustar estoque.');
        },
      });
      return;
    }

    this.catalog.ajustarEstoqueProduto(m.produto.id!, req).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
      },
      error: (e: { error?: { detail?: string }; message?: string }) => {
        this.saving.set(false);
        this.error.set(e?.error?.detail ?? e?.message ?? 'Erro ao ajustar estoque.');
      },
    });
  }

  protected estoqueAtualModal(): number {
    const m = this.modal();
    if (!m) return 0;
    return m.opcao ? m.opcao.estoque : (m.produto.estoque ?? 0);
  }

  protected modalResultado(): number {
    const base = this.estoqueAtualModal();
    const qty  = parseInt(this.modalQty(), 10) || 0;
    const op   = this.modalOperacao();
    if (op === 'ENTRADA') return base + qty;
    if (op === 'SAIDA')   return base - qty;
    return qty; // AJUSTE absoluto
  }
}
