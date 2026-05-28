import { Component, computed, inject, OnInit, signal } from '@angular/core';

import type { VariacaoTemplateApi } from '../../../../../core/models/catalog-api.model';
import { ButtonComponent, ConfirmDialogComponent, IconComponent, InputComponent, ModalComponent, SelectComponent, ToastService } from '@app/shared/ui';
import { MerchantCatalogService } from '../../../services/merchant-catalog.service';
import type { VariacaoForm } from '../../../models/form-types';

@Component({
  selector: 'app-merchant-variacao-templates-page',
  standalone: true,
  imports: [
    ButtonComponent,
    ConfirmDialogComponent,
    IconComponent,
    InputComponent,
    ModalComponent,
    SelectComponent,
  ],
  templateUrl: './merchant-variacao-templates-page.component.html',
  styleUrl: './merchant-variacao-templates-page.component.scss',
})
export class MerchantVariacaoTemplatesPageComponent implements OnInit {
  private readonly catalog = inject(MerchantCatalogService);
  private readonly toast   = inject(ToastService);

  protected readonly templates       = signal<VariacaoTemplateApi[]>([]);
  protected readonly loading         = signal(false);
  protected readonly saving          = signal(false);
  protected readonly error           = signal<string | null>(null);
  protected readonly modalOpen       = signal(false);
  protected readonly editingId       = signal<string | null>(null);
  protected readonly confirmDeleteId = signal<string | null>(null);
  protected readonly submitted       = signal(false);

  // ── Campos do formulário ───────────────────────────────────────────────────
  protected readonly nome      = signal('');
  protected readonly variacoes = signal<VariacaoForm[]>([]);

  // ── Validação ──────────────────────────────────────────────────────────────
  protected readonly nomeError = computed(() => {
    if (!this.submitted()) return '';
    const v = this.nome().trim();
    if (!v || v.length < 2) return 'Mínimo 2 caracteres';
    return '';
  });

  protected readonly formValid = computed(() => {
    if (this.nome().trim().length < 2) return false;
    for (const v of this.variacoes()) {
      if (!v.nome.trim()) return false;
      for (const o of v.opcoes) {
        if (!o.valor.trim()) return false;
      }
    }
    return true;
  });

  readonly TIPOS = [
    { value: 'cor',     label: 'Cor' },
    { value: 'tamanho', label: 'Tamanho' },
    { value: 'outro',   label: 'Outro' },
  ];

  ngOnInit(): void { this.load(); }

  // ── Sumário ────────────────────────────────────────────────────────────────
  protected resumo(t: VariacaoTemplateApi): string {
    return t.variacoes
      .map((v) => `${v.nome}: ${v.opcoes.map((o) => o.valor).join(' / ')}`)
      .join(' · ') || 'Sem variações';
  }

  protected totalOpcoes(t: VariacaoTemplateApi): number {
    return t.variacoes.reduce((acc, v) => acc + v.opcoes.length, 0);
  }

  // ── Carregamento ───────────────────────────────────────────────────────────
  private load(): void {
    this.loading.set(true);
    this.catalog.listVariacaoTemplates().subscribe({
      next:  (list) => { this.templates.set(list); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  protected openCreate(): void {
    this.editingId.set(null);
    this.submitted.set(false);
    this.nome.set('');
    this.variacoes.set([]);
    this.error.set(null);
    this.modalOpen.set(true);
  }

  protected openEdit(t: VariacaoTemplateApi): void {
    this.editingId.set(t.id);
    this.submitted.set(false);
    this.nome.set(t.nome);
    this.variacoes.set(t.variacoes.map((v) => ({
      id:    v.id ?? null,
      nome:  v.nome,
      tipo:  v.tipo,
      opcoes: v.opcoes.map((o) => ({ id: o.id ?? null, valor: o.valor, swatch: o.swatch ?? '' })),
    })));
    this.error.set(null);
    this.modalOpen.set(true);
  }

  protected closeModal(): void { this.modalOpen.set(false); }

  // ── Variações ──────────────────────────────────────────────────────────────
  protected addVariacao(): void {
    this.variacoes.update((arr) => [...arr, { id: null, nome: '', tipo: 'outro', opcoes: [] }]);
  }

  protected removeVariacao(i: number): void {
    this.variacoes.update((arr) => arr.filter((_, idx) => idx !== i));
  }

  protected updateVariacaoNome(i: number, val: string): void {
    this.variacoes.update((arr) => arr.map((v, idx) => idx === i ? { ...v, nome: val } : v));
  }

  protected updateVariacaoTipo(i: number, val: string): void {
    this.variacoes.update((arr) => arr.map((v, idx) => idx === i ? { ...v, tipo: val } : v));
  }

  protected isCor(i: number): boolean { return this.variacoes()[i]?.tipo === 'cor'; }

  // ── Opções ─────────────────────────────────────────────────────────────────
  protected addOpcao(vi: number): void {
    this.variacoes.update((arr) => arr.map((v, idx) =>
      idx === vi ? { ...v, opcoes: [...v.opcoes, { id: null, valor: '', swatch: '' }] } : v,
    ));
  }

  protected removeOpcao(vi: number, oi: number): void {
    this.variacoes.update((arr) => arr.map((v, idx) =>
      idx === vi ? { ...v, opcoes: v.opcoes.filter((_, i) => i !== oi) } : v,
    ));
  }

  protected updateOpcaoValor(vi: number, oi: number, val: string): void {
    this.variacoes.update((arr) => arr.map((v, idx) =>
      idx === vi ? { ...v, opcoes: v.opcoes.map((o, i) => i === oi ? { ...o, valor: val } : o) } : v,
    ));
  }

  protected updateOpcaoSwatch(vi: number, oi: number, ev: Event): void {
    const val = (ev.target as HTMLInputElement).value;
    this.variacoes.update((arr) => arr.map((v, idx) =>
      idx === vi ? { ...v, opcoes: v.opcoes.map((o, i) => i === oi ? { ...o, swatch: val } : o) } : v,
    ));
  }

  // ── Salvar ─────────────────────────────────────────────────────────────────
  protected save(): void {
    this.submitted.set(true);
    if (!this.formValid() || this.saving()) return;

    const payload: Omit<VariacaoTemplateApi, 'id' | 'tenantId'> = {
      nome: this.nome().trim(),
      variacoes: this.variacoes().map((v, idx) => ({
        id:    v.id,
        nome:  v.nome.trim(),
        tipo:  v.tipo,
        ordem: idx,
        opcoes: v.opcoes.map((o, oi) => ({
          id:     o.id,
          valor:  o.valor.trim(),
          swatch: o.swatch || null,
          ordem:  oi,
        })),
      })),
    };

    this.saving.set(true);
    const id = this.editingId();
    const req$ = id
      ? this.catalog.updateVariacaoTemplate(id, payload)
      : this.catalog.createVariacaoTemplate(payload);

    req$.subscribe({
      next:  () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.toast.show({ message: id ? 'Template atualizado com sucesso' : 'Template criado com sucesso' });
      },
      error: (e: { error?: { error?: string }; message?: string }) => {
        this.saving.set(false);
        this.error.set(e?.error?.error ?? e?.message ?? 'Erro ao salvar.');
      },
    });
  }

  // ── Excluir ────────────────────────────────────────────────────────────────
  protected askDelete(id: string): void  { this.confirmDeleteId.set(id); }
  protected cancelDelete(): void         { this.confirmDeleteId.set(null); }

  protected confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.catalog.deleteVariacaoTemplate(id).subscribe({
      next: () => { this.confirmDeleteId.set(null); this.load(); },
    });
  }
}
