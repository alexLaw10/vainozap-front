import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CATEGORIAS_MOCK, PRODUTOS_MOCK } from '../../../mock/produtos.mock';
import type { CategoriaApi, OpcaoVariacaoApi, ProdutoApi, VariacaoApi } from '../../../shared/models/catalog-api.model';
import type { Categoria, OpcaoVariacao, Produto, Variacao } from '../../../shared/models/produto.model';

@Injectable()
export class StorefrontCatalogService {
  private readonly http = inject(HttpClient);

  private readonly _categories = signal<Categoria[]>(environment.useMock ? CATEGORIAS_MOCK : []);
  private readonly _products = signal<Produto[]>(environment.useMock ? PRODUTOS_MOCK : []);

  readonly loading = signal(false);

  load(): void {
    if (environment.useMock) return;

    this.loading.set(true);

    this.http
      .get<CategoriaApi[]>(`${environment.apiUrl}/api/v1/storefront/categories`)
      .subscribe({
        next: (list) => this._categories.set(list.map((c) => this.toCategoria(c))),
        error: (e) => console.warn('[Catalog] Erro ao carregar categorias', e),
      });

    this.http
      .get<ProdutoApi[]>(`${environment.apiUrl}/api/v1/storefront/products`)
      .subscribe({
        next: (list) => {
          this._products.set(list.map((p) => this.toProduto(p)));
          this.loading.set(false);
        },
        error: (e) => {
          console.warn('[Catalog] Erro ao carregar produtos', e);
          this.loading.set(false);
        },
      });
  }

  listCategories(): Categoria[] {
    return this._categories();
  }

  listProducts(): Produto[] {
    return this._products();
  }

  getProduct(id: string): Observable<Produto | null> {
    const cached = this._products().find((p) => p.id === id && p.ativo);
    if (cached) return of(cached);

    return this.http
      .get<ProdutoApi>(`${environment.apiUrl}/api/v1/storefront/products/${id}`)
      .pipe(
        map((p) => this.toProduto(p)),
        catchError(() => of(null)),
      );
  }

  isProductSoldOut(p: Produto): boolean {
    if (!p.ativo) return true;
    if (p.semEstoque) return false;   // serviços nunca ficam esgotados
    if (!p.variacoes.length) return false;
    const total = p.variacoes.flatMap((v) => v.opcoes).reduce((n, o) => n + o.estoque, 0);
    return total <= 0;
  }

  // ── Mapeamento API → modelo UI ───────────────────────────────────────────────

  private toCategoria(c: CategoriaApi): Categoria {
    return {
      id: c.id ?? '',
      nome: c.nome,
      slug: c.slug,
      imagemUrl: c.imagemUrl ?? null,
    };
  }

  private toProduto(p: ProdutoApi): Produto {
    return {
      id: p.id ?? '',
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      fotos: p.fotos ?? [],
      videos: p.videos ?? [],
      categoriaId: p.categoryId ?? '',
      ativo: p.ativo,
      semEstoque: p.semEstoque ?? false,
      variacoes: (p.variacoes ?? []).map((v) => this.toVariacao(v)),
    };
  }

  private toVariacao(v: VariacaoApi): Variacao {
    return {
      id: v.id ?? '',
      nome: v.nome,
      tipo: v.tipo as Variacao['tipo'],
      ordem: v.ordem,
      opcoes: (v.opcoes ?? []).map((o) => this.toOpcao(o)),
    };
  }

  private toOpcao(o: OpcaoVariacaoApi): OpcaoVariacao {
    return {
      id: o.id ?? '',
      valor: o.valor,
      swatch: o.swatch ?? undefined,
      estoque: o.estoque,
      precoExtra: o.precoExtra ?? undefined,
    };
  }
}
