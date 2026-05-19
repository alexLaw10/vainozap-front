import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import type { VariacaoTemplateApi, VariacaoTemplateItemApi, VariacaoTemplateOpcaoApi } from '../../../../shared/models/catalog-api.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { MerchantCatalogService } from '../../services/merchant-catalog.service';

@Component({
  selector: 'app-merchant-variacao-templates-page',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './merchant-variacao-templates-page.component.html',
  styleUrl: './merchant-variacao-templates-page.component.scss',
})
export class MerchantVariacaoTemplatesPageComponent implements OnInit {
  private readonly catalog = inject(MerchantCatalogService);
  private readonly fb     = inject(FormBuilder);

  protected readonly templates       = signal<VariacaoTemplateApi[]>([]);
  protected readonly loading         = signal(false);
  protected readonly saving          = signal(false);
  protected readonly error           = signal<string | null>(null);
  protected readonly modalOpen       = signal(false);
  protected readonly editingId       = signal<string | null>(null);
  protected readonly confirmDeleteId = signal<string | null>(null);

  readonly TIPOS = [
    { value: 'cor',     label: 'Cor' },
    { value: 'tamanho', label: 'Tamanho' },
    { value: 'outro',   label: 'Outro' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    nome:      ['', [Validators.required, Validators.minLength(2)]],
    variacoes: this.fb.array<FormGroup>([]),
  });

  get variacoesArr(): FormArray { return this.form.controls.variacoes as unknown as FormArray; }

  ngOnInit(): void { this.load(); }

  // ── Sumário para exibir na lista ─────────────────────────────────────────

  protected resumo(t: VariacaoTemplateApi): string {
    return t.variacoes
      .map((v) => `${v.nome}: ${v.opcoes.map((o) => o.valor).join(' / ')}`)
      .join(' · ') || 'Sem variações';
  }

  protected totalOpcoes(t: VariacaoTemplateApi): number {
    return t.variacoes.reduce((acc, v) => acc + v.opcoes.length, 0);
  }

  // ── Carregamento ─────────────────────────────────────────────────────────

  private load(): void {
    this.loading.set(true);
    this.catalog.listVariacaoTemplates().subscribe({
      next:  (list) => { this.templates.set(list); this.loading.set(false); },
      error: ()     => this.loading.set(false),
    });
  }

  // ── Modal ────────────────────────────────────────────────────────────────

  protected openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ nome: '' });
    while (this.variacoesArr.length) this.variacoesArr.removeAt(0);
    this.error.set(null);
    this.modalOpen.set(true);
  }

  protected openEdit(t: VariacaoTemplateApi): void {
    this.editingId.set(t.id);
    this.form.patchValue({ nome: t.nome });
    while (this.variacoesArr.length) this.variacoesArr.removeAt(0);
    t.variacoes.forEach((v) => this.variacoesArr.push(this.makeVariacaoGroup(v)));
    this.error.set(null);
    this.modalOpen.set(true);
  }

  protected closeModal(): void { this.modalOpen.set(false); }

  // ── Form helpers ─────────────────────────────────────────────────────────

  private makeVariacaoGroup(v?: Partial<VariacaoTemplateItemApi>): FormGroup {
    const g = this.fb.group({
      id:   [v?.id ?? null],
      nome: [v?.nome ?? '', Validators.required],
      tipo: [v?.tipo ?? 'outro'],
      opcoes: this.fb.array((v?.opcoes ?? []).map((o) => this.makeOpcaoGroup(o))),
    });
    return g;
  }

  private makeOpcaoGroup(o?: Partial<VariacaoTemplateOpcaoApi>): FormGroup {
    return this.fb.group({
      id:    [o?.id ?? null],
      valor: [o?.valor ?? '', Validators.required],
      swatch:[o?.swatch ?? ''],
    });
  }

  protected addVariacao(): void {
    this.variacoesArr.push(this.makeVariacaoGroup());
  }

  protected removeVariacao(i: number): void {
    this.variacoesArr.removeAt(i);
  }

  protected variacaoAt(i: number): FormGroup {
    return this.variacoesArr.at(i) as FormGroup;
  }

  protected getOpcoesArr(vi: number): FormArray {
    return this.variacaoAt(vi).get('opcoes') as FormArray;
  }

  protected addOpcao(vi: number): void {
    this.getOpcoesArr(vi).push(this.makeOpcaoGroup());
  }

  protected removeOpcao(vi: number, oi: number): void {
    this.getOpcoesArr(vi).removeAt(oi);
  }

  protected isCor(vi: number): boolean {
    return this.variacaoAt(vi).get('tipo')?.value === 'cor';
  }

  // ── Salvar ───────────────────────────────────────────────────────────────

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    const v = this.form.getRawValue() as {
      nome: string;
      variacoes: (VariacaoTemplateItemApi & { id: string | null })[];
    };

    const payload: Omit<VariacaoTemplateApi, 'id' | 'tenantId'> = {
      nome: v.nome,
      variacoes: v.variacoes.map((vr, idx) => ({
        id:     vr.id ?? null,
        nome:   vr.nome,
        tipo:   vr.tipo,
        ordem:  idx,
        opcoes: (vr.opcoes as unknown as VariacaoTemplateOpcaoApi[]).map((o, oi) => ({
          id:     o.id ?? null,
          valor:  o.valor,
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
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: (e: { error?: { error?: string }; message?: string }) => {
        this.saving.set(false);
        this.error.set(e?.error?.error ?? e?.message ?? 'Erro ao salvar.');
      },
    });
  }

  // ── Excluir ──────────────────────────────────────────────────────────────

  protected askDelete(id: string): void    { this.confirmDeleteId.set(id); }
  protected cancelDelete(): void           { this.confirmDeleteId.set(null); }

  protected confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.catalog.deleteVariacaoTemplate(id).subscribe({
      next: () => { this.confirmDeleteId.set(null); this.load(); },
    });
  }
}
