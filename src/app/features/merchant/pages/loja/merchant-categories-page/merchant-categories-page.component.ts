import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';

import type { CategoriaApi } from '../../../../../core/models/catalog-api.model';
import { ButtonComponent, ConfirmDialogComponent, EmptyStateComponent, IconComponent, InputComponent, ModalComponent, PageHeaderComponent, TableComponent, ToastService, type TableColumn } from '@app/shared/ui';
import { MerchantCatalogService } from '../../../services/merchant-catalog.service';

@Component({
  selector: 'app-merchant-categories-page',
  standalone: true,
  imports: [TableComponent, ButtonComponent,
    ConfirmDialogComponent,
    IconComponent,
    InputComponent,
    ModalComponent,
    PageHeaderComponent,],
  templateUrl: './merchant-categories-page.component.html',
  styleUrl: './merchant-categories-page.component.scss',
})
export class MerchantCategoriesPageComponent implements OnInit {
  private readonly catalog = inject(MerchantCatalogService);
  private readonly toast   = inject(ToastService);

  // ── Colunas da tabela ──────────────────────────────────────────────────────
  protected readonly columns: TableColumn[] = [
    { key: 'imagemUrl', header: 'Imagem', width: 'img',     custom: true },
    { key: 'nome',      header: 'Nome' },
    { key: 'slug',      header: 'Slug',   hideOnMobile: true },
    { key: 'ordem',     header: 'Ordem',  hideOnMobile: true },
    { key: 'acoes',     header: 'Ações',  width: 'actions', custom: true },
  ];

  // ── Lista ──────────────────────────────────────────────────────────────────
  protected readonly categories = signal<CategoriaApi[]>([]);
  protected readonly loading    = signal(false);
  protected readonly error      = signal<string | null>(null);

  // ── Modal ──────────────────────────────────────────────────────────────────
  protected readonly modalOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving    = signal(false);
  protected readonly submitted = signal(false);

  // ── Campos do formulário (signal forms) ────────────────────────────────────
  protected readonly nome      = signal('');
  protected readonly slug      = signal('');
  protected readonly imagemUrl = signal('');
  protected readonly ordem     = signal('0');

  // ── Upload de imagem ───────────────────────────────────────────────────────
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly imagePreview = signal<string | null>(null);

  // ── Confirm delete ─────────────────────────────────────────────────────────
  protected readonly confirmDeleteId = signal<string | null>(null);

  // ── Validação — só exibe erros após tentativa de submit ───────────────────
  protected readonly nomeError = computed(() => {
    if (!this.submitted()) return '';
    const v = this.nome().trim();
    if (!v) return 'Nome obrigatório';
    if (v.length < 2) return 'Mínimo 2 caracteres';
    return '';
  });

  protected readonly slugError = computed(() => {
    if (!this.submitted()) return '';
    return this.slug().trim() ? '' : 'Slug obrigatório';
  });

  protected readonly formValid = computed(
    () => this.nome().trim().length >= 2 && !!this.slug().trim(),
  );

  constructor() {
    // Auto-gera slug a partir do nome — só ao criar (editingId === null)
    effect(() => {
      const nome = this.nome();
      if (untracked(() => this.editingId())) return;
      this.slug.set(
        nome
          .toLowerCase()
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      );
    });
  }

  ngOnInit(): void { this.load(); }

  // ── Carregamento ───────────────────────────────────────────────────────────
  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalog.listCategories().subscribe({
      next: (list) => { this.categories.set(list); this.loading.set(false); },
      error: (e)   => { this.error.set(e.message ?? 'Erro ao carregar'); this.loading.set(false); },
    });
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  protected openCreate(): void {
    this.editingId.set(null);
    this.submitted.set(false);
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.nome.set('');
    this.slug.set('');
    this.imagemUrl.set('');
    this.ordem.set(String(this.categories().length));
    this.modalOpen.set(true);
  }

  protected openEdit(cat: CategoriaApi): void {
    this.editingId.set(cat.id!);
    this.submitted.set(false);
    this.selectedFile.set(null);
    this.imagePreview.set(cat.imagemUrl ?? null);
    this.nome.set(cat.nome);
    this.slug.set(cat.slug);
    this.imagemUrl.set(cat.imagemUrl ?? '');
    this.ordem.set(String(cat.ordem));
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.modalOpen.set(false);
  }

  // ── Imagem ─────────────────────────────────────────────────────────────────
  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
    if (file) this.imagePreview.set(URL.createObjectURL(file));
  }

  protected removeImage(): void {
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.imagemUrl.set('');
  }

  // ── Salvar ─────────────────────────────────────────────────────────────────
  protected save(): void {
    this.submitted.set(true);
    if (!this.formValid() || this.saving()) return;

    const payload = {
      nome:      this.nome().trim(),
      slug:      this.slug().trim(),
      imagemUrl: this.imagemUrl() || null,
      ordem:     parseInt(this.ordem(), 10) || 0,
    };
    const id = this.editingId();

    this.saving.set(true);
    const req$ = id
      ? this.catalog.updateCategory(id, payload, this.selectedFile() ?? undefined)
      : this.catalog.createCategory(payload, this.selectedFile() ?? undefined);

    req$.subscribe({
      next:  ()  => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.toast.show({ message: id ? 'Categoria atualizada com sucesso' : 'Categoria criada com sucesso' });
      },
      error: (e) => { this.saving.set(false); this.error.set(e.message ?? 'Erro ao salvar'); },
    });
  }

  // ── Deletar ────────────────────────────────────────────────────────────────
  protected askDelete(id: string): void { this.confirmDeleteId.set(id); }
  protected cancelDelete(): void        { this.confirmDeleteId.set(null); }

  protected confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.catalog.deleteCategory(id).subscribe({
      next:  ()  => { this.confirmDeleteId.set(null); this.load(); },
      error: (e) => { this.error.set(e.message ?? 'Erro ao remover'); this.confirmDeleteId.set(null); },
    });
  }
}
