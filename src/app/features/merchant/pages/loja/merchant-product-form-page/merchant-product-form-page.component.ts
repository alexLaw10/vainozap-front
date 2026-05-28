import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import type { OpcaoVariacaoApi, ProdutoApi, VariacaoApi, VariacaoTemplateApi } from '../../../../../core/models/catalog-api.model';
import { IconComponent, InputComponent, type MediaSlot, MediaSlotsComponent, SelectComponent, type SelectOption, TextareaComponent, ToastService, ToggleComponent } from '@app/shared/ui';
import { MerchantCatalogService } from '../../../services/merchant-catalog.service';
import type { OpcaoForm, VariacaoForm } from '../../../models/form-types';

export const MAX_FOTOS  = 10;
export const MAX_VIDEOS = 5;

/** VariacaoForm with full OpcaoForm (includes estoque and precoExtra). */
type VariacaoFormExt = Omit<VariacaoForm, 'opcoes'> & { opcoes: OpcaoForm[] };

@Component({
  selector: 'app-merchant-product-form-page',
  standalone: true,
  imports: [IconComponent, InputComponent, MediaSlotsComponent, RouterLink, SelectComponent, TextareaComponent, ToggleComponent],
  templateUrl: './merchant-product-form-page.component.html',
  styleUrl: './merchant-product-form-page.component.scss',
})
export class MerchantProductFormPageComponent implements OnInit {
  private readonly catalog = inject(MerchantCatalogService);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly toast   = inject(ToastService);

  protected readonly MAX_FOTOS  = MAX_FOTOS;
  protected readonly MAX_VIDEOS = MAX_VIDEOS;

  protected readonly editId    = signal<string | null>(null);
  protected readonly isEdit    = computed(() => !!this.editId());
  protected readonly categoryOptions   = signal<SelectOption[]>([]);
  protected readonly templates         = signal<VariacaoTemplateApi[]>([]);
  protected readonly templateDropdown  = signal(false);
  protected readonly loading  = signal(false);
  protected readonly saving   = signal(false);
  protected readonly error    = signal<string | null>(null);
  protected readonly submitted = signal(false);

  // ── Campos do formulário ───────────────────────────────────────────────────
  protected readonly nome       = signal('');
  protected readonly descricao  = signal('');
  protected readonly preco      = signal('0');
  protected readonly categoryId = signal('');
  protected readonly ativo      = signal(true);
  protected readonly semEstoque = signal(false);
  protected readonly estoque    = signal('0');
  protected readonly variacoes  = signal<VariacaoFormExt[]>([]);

  // ── Validação ──────────────────────────────────────────────────────────────
  protected readonly nomeError = computed(() => {
    if (!this.submitted()) return '';
    const v = this.nome().trim();
    if (!v || v.length < 2) return 'Obrigatório (mín. 2 caracteres)';
    return '';
  });

  protected readonly precoError = computed(() => {
    if (!this.submitted()) return '';
    const v = parseFloat(this.preco());
    if (isNaN(v) || v < 0) return 'Preço inválido';
    return '';
  });

  protected readonly formValid = computed(() => {
    if (this.nome().trim().length < 2) return false;
    const p = parseFloat(this.preco());
    if (isNaN(p) || p < 0) return false;
    return true;
  });

  // ── Computed helpers ───────────────────────────────────────────────────────
  protected readonly variacoesCount = computed(() => this.variacoes().length);
  protected readonly semVariacoes   = computed(
    () => this.variacoesCount() === 0 && !this.semEstoque(),
  );

  // ── Fotos e vídeos — gerenciados por app-media-slots via model ────────────
  protected readonly photos = signal<MediaSlot[]>([]);
  protected readonly videos = signal<MediaSlot[]>([]);

  readonly TIPOS = [
    { value: 'cor',     label: 'Cor' },
    { value: 'tamanho', label: 'Tamanho' },
    { value: 'outro',   label: 'Outro' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.editId.set(id);
    this.loadCategories();
    this.loadTemplates();
    if (id) this.loadProduct(id);
  }

  // ── Carregamento ───────────────────────────────────────────────────────────
  private loadCategories(): void {
    this.catalog.listCategoryOptions().subscribe({ next: (list) => this.categoryOptions.set(list) });
  }

  private loadTemplates(): void {
    this.catalog.listVariacaoTemplates().subscribe({ next: (list) => this.templates.set(list) });
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.catalog.getProduct(id).subscribe({
      next: (p) => {
        this.loading.set(false);
        this.nome.set(p.nome);
        this.descricao.set(p.descricao ?? '');
        this.preco.set(String(p.preco));
        this.categoryId.set(p.categoryId ?? '');
        this.ativo.set(p.ativo);
        this.semEstoque.set(p.semEstoque ?? false);
        this.estoque.set(String(p.estoque ?? 0));
        this.photos.set((p.fotos  ?? []).map((url) => ({ url, file: null, preview: url })));
        this.videos.set((p.videos ?? []).map((url) => ({ url, file: null, preview: url })));
        this.variacoes.set((p.variacoes ?? []).map((v) => ({
          id:     v.id ?? null,
          nome:   v.nome,
          tipo:   v.tipo,
          opcoes: (v.opcoes ?? []).map((o) => ({
            id:         o.id ?? null,
            valor:      o.valor,
            swatch:     o.swatch ?? '',
            estoque:    String(o.estoque),
            precoExtra: o.precoExtra != null ? String(o.precoExtra) : '',
          })),
        })));
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Variações ──────────────────────────────────────────────────────────────
  protected addVariacao(): void {
    this.variacoes.update((arr) => [...arr, { id: null, nome: '', tipo: 'outro', opcoes: [] }]);
  }

  protected removeVariacao(i: number): void {
    this.variacoes.update((arr) => arr.filter((_, idx) => idx !== i));
  }

  protected updateVariacaoNome(vi: number, val: string): void {
    this.variacoes.update((arr) => arr.map((v, i) => i === vi ? { ...v, nome: val } : v));
  }

  protected updateVariacaoTipo(vi: number, val: string): void {
    this.variacoes.update((arr) => arr.map((v, i) => i === vi ? { ...v, tipo: val } : v));
  }

  protected isCor(vi: number): boolean { return this.variacoes()[vi]?.tipo === 'cor'; }

  // ── Opções ─────────────────────────────────────────────────────────────────
  protected addOpcao(vi: number): void {
    this.variacoes.update((arr) => arr.map((v, i) =>
      i === vi ? { ...v, opcoes: [...v.opcoes, { id: null, valor: '', swatch: '', estoque: '0', precoExtra: '' }] } : v,
    ));
  }

  protected removeOpcao(vi: number, oi: number): void {
    this.variacoes.update((arr) => arr.map((v, i) =>
      i === vi ? { ...v, opcoes: v.opcoes.filter((_, idx) => idx !== oi) } : v,
    ));
  }

  protected updateOpcaoValor(vi: number, oi: number, val: string): void {
    this.variacoes.update((arr) => arr.map((v, i) =>
      i === vi ? { ...v, opcoes: v.opcoes.map((o, j) => j === oi ? { ...o, valor: val } : o) } : v,
    ));
  }

  protected updateOpcaoSwatch(vi: number, oi: number, ev: Event): void {
    const val = (ev.target as HTMLInputElement).value;
    this.variacoes.update((arr) => arr.map((v, i) =>
      i === vi ? { ...v, opcoes: v.opcoes.map((o, j) => j === oi ? { ...o, swatch: val } : o) } : v,
    ));
  }

  protected updateOpcaoEstoque(vi: number, oi: number, ev: Event): void {
    const val = (ev.target as HTMLInputElement).value;
    this.variacoes.update((arr) => arr.map((v, i) =>
      i === vi ? { ...v, opcoes: v.opcoes.map((o, j) => j === oi ? { ...o, estoque: val } : o) } : v,
    ));
  }

  protected updateOpcaoPrecoExtra(vi: number, oi: number, ev: Event): void {
    const val = (ev.target as HTMLInputElement).value;
    this.variacoes.update((arr) => arr.map((v, i) =>
      i === vi ? { ...v, opcoes: v.opcoes.map((o, j) => j === oi ? { ...o, precoExtra: val } : o) } : v,
    ));
  }

  // ── Templates de variação ──────────────────────────────────────────────────
  protected toggleTemplateDropdown(): void { this.templateDropdown.update((v) => !v); }

  protected applyTemplate(template: VariacaoTemplateApi): void {
    this.templateDropdown.set(false);
    const newVars: VariacaoFormExt[] = template.variacoes.map((item) => ({
      id:    null,
      nome:  item.nome,
      tipo:  item.tipo,
      opcoes: item.opcoes.map((o) => ({
        id:         null,
        valor:      o.valor,
        swatch:     o.swatch ?? '',
        estoque:    '0',
        precoExtra: '',
      })),
    }));
    this.variacoes.update((arr) => [...arr, ...newVars]);
  }

  // ── Salvar ─────────────────────────────────────────────────────────────────
  protected save(): void {
    this.submitted.set(true);
    if (!this.formValid() || this.saving()) return;

    this.saving.set(true);
    this.error.set(null);

    const pendingFiles      = this.photos().filter((p) => p.file !== null).map((p) => p.file!);
    const existingUrls      = this.photos().filter((p) => p.file === null).map((p) => p.url);
    const pendingVideoFiles = this.videos().filter((v) => v.file !== null).map((v) => v.file!);
    const existingVideoUrls = this.videos().filter((v) => v.file === null).map((v) => v.url);

    const vars = this.variacoes();
    const temVariacoes = vars.length > 0;

    const payload: Omit<ProdutoApi, 'id' | 'tenantId'> = {
      nome:       this.nome().trim(),
      descricao:  this.descricao(),
      preco:      parseFloat(this.preco()) || 0,
      categoryId: this.categoryId() || null,
      ativo:      this.ativo(),
      semEstoque: this.semEstoque(),
      estoque:    (this.semEstoque() || temVariacoes) ? null : parseInt(this.estoque(), 10) || 0,
      fotos:      existingUrls,
      videos:     existingVideoUrls,
      variacoes: vars.map((vr, idx) => ({
        id:    vr.id ?? null,
        nome:  vr.nome,
        tipo:  vr.tipo,
        ordem: idx,
        opcoes: vr.opcoes.map((op, oi) => ({
          id:         op.id ?? null,
          valor:      op.valor,
          swatch:     op.swatch || null,
          estoque:    parseInt(op.estoque, 10) || 0,
          precoExtra: op.precoExtra ? parseFloat(op.precoExtra) : null,
        } as OpcaoVariacaoApi)),
      } as VariacaoApi)),
    };

    const id = this.editId();
    const request$ = id
      ? this.catalog.updateProduct(id, payload, pendingFiles, pendingVideoFiles)
      : this.catalog.createProduct(payload, pendingFiles, pendingVideoFiles);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show({ message: id ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso' });
        void this.router.navigate(['/merchant/loja/gerenciar/produtos']);
      },
      error: (e: { error?: { error?: string }; message?: string }) => {
        this.saving.set(false);
        this.error.set(e?.error?.error ?? e?.message ?? 'Erro ao salvar produto. Tente novamente.');
      },
    });
  }
}
