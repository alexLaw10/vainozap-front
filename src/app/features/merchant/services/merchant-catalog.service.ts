import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import type { AjusteEstoqueApi, CategoriaApi, ProdutoApi, VariacaoTemplateApi } from '../../../core/models/catalog-api.model';
import type { PageResult } from '../models/page-result.model';
import { SelectOption } from '@app/shared/ui';

@Injectable()
export class MerchantCatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/merchant`;

  // ─── Categorias ──────────────────────────────────────────────────────────────

  listCategories(): Observable<CategoriaApi[]> {
    return this.http.get<CategoriaApi[]>(`${this.base}/categories`);
  }

  listCategoryOptions(): Observable<SelectOption[]> {
    return this.http.get<SelectOption[]>(`${this.base}/categories/options`);
  }

  createCategory(cat: Omit<CategoriaApi, 'id' | 'tenantId'>, file?: File): Observable<CategoriaApi> {
    return this.http.post<CategoriaApi>(`${this.base}/categories`, this.buildCategoryForm(cat, file));
  }

  updateCategory(id: string, cat: Omit<CategoriaApi, 'id' | 'tenantId'>, file?: File): Observable<CategoriaApi> {
    return this.http.put<CategoriaApi>(`${this.base}/categories/${id}`, this.buildCategoryForm(cat, file));
  }

  private buildCategoryForm(cat: Omit<CategoriaApi, 'id' | 'tenantId'>, file?: File): FormData {
    const form = new FormData();
    form.append('category', new Blob([JSON.stringify(cat)], { type: 'application/json' }));
    if (file) form.append('file', file);
    return form;
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories/${id}`);
  }

  // ─── Produtos ────────────────────────────────────────────────────────────────

  listProducts(page = 0, size = 20, search = ''): Observable<PageResult<ProdutoApi>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('search', search);
    return this.http.get<PageResult<ProdutoApi>>(`${this.base}/products`, { params });
  }

  /** Busca todos os produtos sem paginação — usar apenas para exportação. */
  listAllProducts(): Observable<ProdutoApi[]> {
    return this.http.get<PageResult<ProdutoApi>>(
      `${this.base}/products`,
      { params: new HttpParams().set('page', 0).set('size', 10000) },
    ).pipe(map(page => page.content));
  }

  createProduct(p: Omit<ProdutoApi, 'id' | 'tenantId'>, files: File[] = [], videoFiles: File[] = []): Observable<ProdutoApi> {
    return this.http.post<ProdutoApi>(`${this.base}/products`, this.buildForm(p, files, videoFiles));
  }

  getProduct(id: string): Observable<ProdutoApi> {
    return this.http.get<ProdutoApi>(`${this.base}/products/${id}`);
  }

  updateProduct(id: string, p: Omit<ProdutoApi, 'id' | 'tenantId'>, files: File[] = [], videoFiles: File[] = []): Observable<ProdutoApi> {
    return this.http.put<ProdutoApi>(`${this.base}/products/${id}`, this.buildForm(p, files, videoFiles));
  }

  private buildForm(p: Omit<ProdutoApi, 'id' | 'tenantId'>, files: File[], videoFiles: File[] = []): FormData {
    const form = new FormData();
    form.append('product', new Blob([JSON.stringify(p)], { type: 'application/json' }));
    files.forEach((f) => form.append('files', f));
    videoFiles.forEach((f) => form.append('videoFiles', f));
    return form;
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }

  // ─── Estoque ─────────────────────────────────────────────────────────────────

  ajustarEstoqueProduto(id: string, req: AjusteEstoqueApi): Observable<ProdutoApi> {
    return this.http.patch<ProdutoApi>(`${this.base}/products/${id}/estoque`, req);
  }

  ajustarEstoqueOpcao(productId: string, opcaoId: string, req: AjusteEstoqueApi): Observable<void> {
    return this.http.patch<void>(`${this.base}/products/${productId}/opcoes/${opcaoId}/estoque`, req);
  }

  // ─── Modelos de Variação ──────────────────────────────────────────────────

  listVariacaoTemplates(): Observable<VariacaoTemplateApi[]> {
    return this.http.get<VariacaoTemplateApi[]>(`${this.base}/variacao-templates`);
  }

  createVariacaoTemplate(t: Omit<VariacaoTemplateApi, 'id' | 'tenantId'>): Observable<VariacaoTemplateApi> {
    return this.http.post<VariacaoTemplateApi>(`${this.base}/variacao-templates`, t);
  }

  updateVariacaoTemplate(id: string, t: Omit<VariacaoTemplateApi, 'id' | 'tenantId'>): Observable<VariacaoTemplateApi> {
    return this.http.put<VariacaoTemplateApi>(`${this.base}/variacao-templates/${id}`, t);
  }

  deleteVariacaoTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/variacao-templates/${id}`);
  }
}
