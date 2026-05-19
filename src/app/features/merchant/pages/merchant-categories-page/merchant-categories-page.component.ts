import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { CategoriaApi } from '../../../../shared/models/catalog-api.model';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ConfirmDialogComponent } from '../../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { MerchantCatalogService } from '../../services/merchant-catalog.service';

@Component({
  selector: 'app-merchant-categories-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
    ModalComponent,
    PageHeaderComponent,
  ],
  templateUrl: './merchant-categories-page.component.html',
  styleUrl: './merchant-categories-page.component.scss',
})
export class MerchantCategoriesPageComponent implements OnInit {
  private readonly catalog = inject(MerchantCatalogService);
  private readonly fb = inject(FormBuilder);

  protected readonly categories = signal<CategoriaApi[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly modalOpen = signal(false);
  protected editingId = signal<string | null>(null);

  protected readonly confirmDeleteId = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly imagePreview = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', Validators.required],
    imagemUrl: [''],
    ordem: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalog.listCategories().subscribe({
      next: (list) => { this.categories.set(list); this.loading.set(false); },
      error: (e) => { this.error.set(e.message ?? 'Erro ao carregar'); this.loading.set(false); },
    });
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.form.reset({ nome: '', slug: '', imagemUrl: '', ordem: this.categories().length });
    this.modalOpen.set(true);
  }

  protected openEdit(cat: CategoriaApi): void {
    this.editingId.set(cat.id);
    this.selectedFile.set(null);
    this.imagePreview.set(cat.imagemUrl ?? null);
    this.form.reset({ nome: cat.nome, slug: cat.slug, imagemUrl: cat.imagemUrl ?? '', ordem: cat.ordem });
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.modalOpen.set(false);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    if (file) {
      this.imagePreview.set(URL.createObjectURL(file));
    }
  }

  protected removeImage(): void {
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.form.controls.imagemUrl.setValue('');
  }

  protected onNomeInput(): void {
    if (this.editingId()) return;
    const slug = this.form.value.nome
      ?.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ?? '';
    this.form.controls.slug.setValue(slug);
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    const file = this.selectedFile() ?? undefined;
    const payload = { nome: v.nome, slug: v.slug, imagemUrl: v.imagemUrl || null, ordem: v.ordem };
    this.saving.set(true);
    const id = this.editingId();
    const req$ = id
      ? this.catalog.updateCategory(id, payload, file)
      : this.catalog.createCategory(payload, file);

    req$.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: (e) => { this.saving.set(false); this.error.set(e.message ?? 'Erro ao salvar'); },
    });
  }

  protected askDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }

  protected cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  protected confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.catalog.deleteCategory(id).subscribe({
      next: () => { this.confirmDeleteId.set(null); this.load(); },
      error: (e) => { this.error.set(e.message ?? 'Erro ao remover'); this.confirmDeleteId.set(null); },
    });
  }
}
