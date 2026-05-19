import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import type { CategoriaApi, OpcaoVariacaoApi, ProdutoApi, VariacaoApi, VariacaoTemplateApi } from '../../../../shared/models/catalog-api.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { MerchantCatalogService } from '../../services/merchant-catalog.service';

export const MAX_FOTOS = 10;
export const ALL_SLOTS = Array.from({ length: MAX_FOTOS }, (_, i) => i);


interface PhotoSlot {
  url: string;      // URL real (após upload ou carregada do produto)
  file: File | null; // arquivo local ainda não enviado
  preview: string;  // blob URL (pendente) ou URL real
}

@Component({
  selector: 'app-merchant-product-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './merchant-product-form-page.component.html',
  styleUrl: './merchant-product-form-page.component.scss',
})
export class MerchantProductFormPageComponent implements OnInit, OnDestroy {
  private readonly catalog = inject(MerchantCatalogService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly MAX_FOTOS = MAX_FOTOS;
  protected readonly ALL_SLOTS = ALL_SLOTS;

  protected readonly editId = signal<string | null>(null);
  protected readonly isEdit = computed(() => !!this.editId());
  protected readonly categories       = signal<CategoriaApi[]>([]);
  protected readonly templates        = signal<VariacaoTemplateApi[]>([]);
  protected readonly templateDropdown = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving  = signal(false);
  protected readonly error   = signal<string | null>(null);

  protected readonly photos = signal<PhotoSlot[]>([]);
  protected readonly pendingCount = computed(() => this.photos().filter((p) => p.file !== null).length);
  protected readonly photoCount = computed(() => this.photos().length);

  protected readonly form = this.fb.nonNullable.group({
    nome:        ['', [Validators.required, Validators.minLength(2)]],
    descricao:   [''],
    preco:       [0, [Validators.required, Validators.min(0)]],
    categoryId:  [''],
    ativo:       [true],
    semEstoque:  [false],
    estoque:     [0, [Validators.min(0)]],
    variacoes:   this.fb.array<FormGroup>([]),
  });

  /** Reativo: atualizado sempre que o FormArray muda (via toSignal workaround) */
  protected readonly variacoesCount = signal(0);
  /** Controla visibilidade do campo de estoque direto. */
  protected readonly semVariacoes   = computed(
    () => this.variacoesCount() === 0 && !this.form.controls.semEstoque.value,
  );

  get variacoesArr(): FormArray { return this.form.controls.variacoes as unknown as FormArray; }

  private syncVariacoesCount(): void {
    this.variacoesCount.set(this.variacoesArr.length);
  }

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

  ngOnDestroy(): void {
    this.photos().forEach((p) => { if (p.file) URL.revokeObjectURL(p.preview); });
  }

  // ── Carregamento ──────────────────────────────────────────────────────────

  private loadCategories(): void {
    this.catalog.listCategories().subscribe({ next: (list) => this.categories.set(list) });
  }

  private loadTemplates(): void {
    this.catalog.listVariacaoTemplates().subscribe({ next: (list) => this.templates.set(list) });
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.catalog.getProduct(id).subscribe({
      next: (p) => {
        this.loading.set(false);
        this.form.patchValue({
          nome: p.nome, descricao: p.descricao, preco: p.preco,
          categoryId: p.categoryId ?? '', ativo: p.ativo,
          semEstoque: p.semEstoque ?? false,
        });
        this.form.patchValue({ estoque: p.estoque ?? 0 });
        this.photos.set((p.fotos ?? []).map((url) => ({ url, file: null, preview: url })));
        (p.variacoes ?? []).forEach((v) => this.variacoesArr.push(this.makeVariacaoGroup(v)));
        this.syncVariacoesCount();
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Fotos ─────────────────────────────────────────────────────────────────

  protected slotPhoto(i: number): PhotoSlot | null { return this.photos()[i] ?? null; }

  protected openReplace(i: number): void {
    this.pickFile((file) => {
      const preview = URL.createObjectURL(file);
      this.photos.update((arr) => {
        const next = [...arr];
        const old = next[i];
        if (old?.file) URL.revokeObjectURL(old.preview);
        next[i] = { url: '', file, preview };
        return next;
      });
    });
  }

  protected openAdd(): void {
    if (this.photos().length >= MAX_FOTOS) return;
    this.pickFile((file) => {
      const preview = URL.createObjectURL(file);
      this.photos.update((arr) => [...arr, { url: '', file, preview }]);
    });
  }

  private pickFile(cb: (f: File) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.onchange = () => { const f = input.files?.[0]; if (f) cb(f); };
    input.click();
  }

  protected removePhoto(i: number, ev: Event): void {
    ev.stopPropagation();
    this.photos.update((arr) => {
      const next = [...arr];
      const old = next[i];
      if (old?.file) URL.revokeObjectURL(old.preview);
      next.splice(i, 1);
      return next;
    });
  }

  // ── Variações ─────────────────────────────────────────────────────────────

  private makeVariacaoGroup(v?: Partial<VariacaoApi>): FormGroup {
    return this.fb.group({
      id:     [v?.id ?? null],
      nome:   [v?.nome ?? '', Validators.required],
      tipo:   [v?.tipo ?? 'outro'],
      ordem:  [v?.ordem ?? 0],
      opcoes: this.fb.array((v?.opcoes ?? []).map((o) => this.makeOpcaoGroup(o))),
    });
  }

  private makeOpcaoGroup(o?: Partial<OpcaoVariacaoApi>): FormGroup {
    return this.fb.group({
      id:         [o?.id ?? null],
      valor:      [o?.valor ?? '', Validators.required],
      swatch:     [o?.swatch ?? ''],
      estoque:    [o?.estoque ?? 0, [Validators.required, Validators.min(0)]],
      precoExtra: [o?.precoExtra ?? null],
    });
  }

  protected addVariacao(): void {
    this.variacoesArr.push(this.makeVariacaoGroup());
    this.syncVariacoesCount();
  }
  protected removeVariacao(i: number): void {
    this.variacoesArr.removeAt(i);
    this.syncVariacoesCount();
  }
  protected variacaoAt(i: number): FormGroup { return this.variacoesArr.at(i) as FormGroup; }
  protected getOpcoesArr(vi: number): FormArray { return this.variacaoAt(vi).get('opcoes') as FormArray; }
  protected addOpcao(vi: number): void               { this.getOpcoesArr(vi).push(this.makeOpcaoGroup()); }
  protected removeOpcao(vi: number, oi: number): void { this.getOpcoesArr(vi).removeAt(oi); }
  protected isCor(vi: number): boolean               { return this.variacaoAt(vi).get('tipo')?.value === 'cor'; }

  // ── Templates de variação ─────────────────────────────────────────────────

  protected toggleTemplateDropdown(): void {
    this.templateDropdown.update((v) => !v);
  }

  protected applyTemplate(template: VariacaoTemplateApi): void {
    this.templateDropdown.set(false);
    template.variacoes.forEach((item) => {

      const group = this.makeVariacaoGroup({
        id:   null,
        nome: item.nome,
        tipo: item.tipo,
        ordem: item.ordem,
        opcoes: item.opcoes.map((o) => ({
          id:         null,
          valor:      o.valor,
          swatch:     o.swatch ?? '',
          estoque:    0,
          precoExtra: null,
        })),
      });
      this.variacoesArr.push(group);
    });
    this.syncVariacoesCount();
  }

  // ── Salvar ────────────────────────────────────────────────────────────────

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.error.set(null);

    const pendingFiles = this.photos().filter((p) => p.file !== null).map((p) => p.file!);
    const existingUrls = this.photos().filter((p) => p.file === null).map((p) => p.url);

    const v = this.form.getRawValue() as {
      nome: string; descricao: string; preco: number; categoryId: string;
      ativo: boolean; semEstoque: boolean; estoque: number; variacoes: (VariacaoApi & { id: string | null })[];
    };

    const temVariacoes = v.variacoes.length > 0;

    const payload: Omit<ProdutoApi, 'id' | 'tenantId'> = {
      nome:        v.nome,
      descricao:   v.descricao,
      preco:       v.preco,
      categoryId:  v.categoryId || null,
      ativo:       v.ativo,
      semEstoque:  v.semEstoque,
      estoque:     (v.semEstoque || temVariacoes) ? null : Number(v.estoque),
      fotos:      existingUrls,
      variacoes: v.variacoes.map((vr, idx) => ({
        id:     vr.id ?? null,
        nome:   vr.nome,
        tipo:   vr.tipo,
        ordem:  idx,
        opcoes: (vr.opcoes as unknown as OpcaoVariacaoApi[]).map((op) => ({
          id:         op.id ?? null,
          valor:      op.valor,
          swatch:     op.swatch || null,
          estoque:    Number(op.estoque),
          precoExtra: op.precoExtra != null ? Number(op.precoExtra) : null,
        })),
      })),
    };

    const id = this.editId();
    const request$ = id
      ? this.catalog.updateProduct(id, payload, pendingFiles)
      : this.catalog.createProduct(payload, pendingFiles);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/merchant/loja/gerenciar/produtos']);
      },
      error: (e: { error?: { error?: string }; message?: string }) => {
        this.saving.set(false);
        const msg = e?.error?.error ?? e?.message ?? 'Erro ao salvar produto. Tente novamente.';
        this.error.set(msg);
      },
    });
  }
}
