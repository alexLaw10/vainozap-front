import { NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { AjusteEstoqueApi, OpcaoVariacaoApi, ProdutoApi, VariacaoApi } from '../../../../shared/models/catalog-api.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { MerchantCatalogService } from '../../services/merchant-catalog.service';

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
  imports: [NgClass, FormsModule, IconComponent],
  templateUrl: './merchant-estoque-page.component.html',
  styleUrl:    './merchant-estoque-page.component.scss',
})
export class MerchantEstoquePageComponent implements OnInit {
  private readonly catalog = inject(MerchantCatalogService);

  protected readonly products = signal<ProdutoApi[]>([]);
  protected readonly loading  = signal(false);
  protected readonly saving   = signal(false);
  protected readonly error    = signal<string | null>(null);
  protected readonly filtro   = signal<Filtro>('todos');
  protected readonly modal    = signal<AjusteModal | null>(null);

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
    this.error.set(null);
  }

  protected closeModal(): void { this.modal.set(null); }

  protected confirmarAjuste(): void {
    const m = this.modal();
    if (!m || this.saving()) return;

    const req: AjusteEstoqueApi = { operacao: m.operacao, quantidade: m.quantidade };
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
    if (m.opcao) return m.opcao.estoque;
    return m.produto.estoque ?? 0;
  }
}
