import { Injectable, signal } from '@angular/core';

import { STOREFRONT_FILTERS_PANEL_MOCK } from '../../../mock/storefront-filters.mock';
import type { StorefrontFilterGroup } from '../../../core/models/storefront-filters.model';
import type { Produto } from '../../../core/models/produto.model';

export interface StorefrontAppliedFilters {
  /** groupId → ids de opções selecionadas */
  choices: Record<string, string[]>;
  priceMin: number | null;
  priceMax: number | null;
}

const emptyApplied = (): StorefrontAppliedFilters => ({
  choices: {},
  priceMin: null,
  priceMax: null,
});

@Injectable()
export class StorefrontFiltersService {
  readonly config = signal(STOREFRONT_FILTERS_PANEL_MOCK);
  readonly groups = signal<StorefrontFilterGroup[]>(STOREFRONT_FILTERS_PANEL_MOCK.groups);

  readonly panelOpen = signal(false);
  /** Grupos de acordeão expandidos. */
  readonly expandedGroupIds = signal<Set<string>>(new Set());

  private readonly draft = signal<StorefrontAppliedFilters>(emptyApplied());
  private readonly applied = signal<StorefrontAppliedFilters>(emptyApplied());

  draftChoices(): Record<string, string[]> {
    return this.draft().choices;
  }

  draftPriceMin(): number | null {
    return this.draft().priceMin;
  }

  draftPriceMax(): number | null {
    return this.draft().priceMax;
  }

  appliedFilters(): StorefrontAppliedFilters {
    return this.applied();
  }

  isGroupExpanded(id: string): boolean {
    return this.expandedGroupIds().has(id);
  }

  toggleGroupExpanded(id: string): void {
    this.expandedGroupIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isChoiceSelected(groupId: string, optionId: string): boolean {
    return (this.draft().choices[groupId] ?? []).includes(optionId);
  }

  toggleDraftChoice(groupId: string, optionId: string, checked: boolean): void {
    this.draft.update((d) => {
      const choices = { ...d.choices };
      const cur = new Set(choices[groupId] ?? []);
      if (checked) cur.add(optionId);
      else cur.delete(optionId);
      const arr = [...cur];
      if (arr.length === 0) delete choices[groupId];
      else choices[groupId] = arr;
      return { ...d, choices };
    });
  }

  setDraftPriceMin(value: number | null): void {
    this.draft.update((d) => ({ ...d, priceMin: value }));
  }

  setDraftPriceMax(value: number | null): void {
    this.draft.update((d) => ({ ...d, priceMax: value }));
  }

  openPanel(): void {
    this.draft.set(structuredClone(this.applied()));
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  cancel(): void {
    this.draft.set(structuredClone(this.applied()));
    this.closePanel();
  }

  apply(): void {
    this.applied.set(structuredClone(this.draft()));
    this.closePanel();
  }

  /** Chips de filtros atualmente aplicados (para exibição na UI). */
  activeChips(): Array<{ label: string; groupId: string; optionId?: string; kind: 'choice' | 'priceMin' | 'priceMax' }> {
    const { choices, priceMin, priceMax } = this.applied();
    const chips: Array<{ label: string; groupId: string; optionId?: string; kind: 'choice' | 'priceMin' | 'priceMax' }> = [];

    for (const g of this.groups()) {
      if (g.kind !== 'choice') continue;
      const selected = choices[g.id];
      if (!selected?.length) continue;
      for (const optId of selected) {
        const opt = g.options?.find(o => o.id === optId);
        if (opt) chips.push({ label: opt.label, groupId: g.id, optionId: optId, kind: 'choice' });
      }
    }
    if (priceMin !== null) chips.push({ label: `Mín. R$ ${priceMin}`, groupId: 'preco', kind: 'priceMin' });
    if (priceMax !== null) chips.push({ label: `Máx. R$ ${priceMax}`, groupId: 'preco', kind: 'priceMax' });

    return chips;
  }

  removeChoice(groupId: string, optionId: string): void {
    const remove = (f: StorefrontAppliedFilters): StorefrontAppliedFilters => {
      const choices = { ...f.choices };
      const arr = (choices[groupId] ?? []).filter(id => id !== optionId);
      if (arr.length === 0) delete choices[groupId]; else choices[groupId] = arr;
      return { ...f, choices };
    };
    this.applied.update(remove);
    this.draft.update(remove);
  }

  removePriceMin(): void {
    this.applied.update(f => ({ ...f, priceMin: null }));
    this.draft.update(f => ({ ...f, priceMin: null }));
  }

  removePriceMax(): void {
    this.applied.update(f => ({ ...f, priceMax: null }));
    this.draft.update(f => ({ ...f, priceMax: null }));
  }

  /** Limpa todos os filtros aplicados e o draft. */
  clearAll(): void {
    const empty = emptyApplied();
    this.applied.set(empty);
    this.draft.set(structuredClone(empty));
  }

  /** Verifica se há algum filtro ativo. */
  hasActiveFilters(): boolean {
    const { choices, priceMin, priceMax } = this.applied();
    return priceMin !== null || priceMax !== null || Object.values(choices).some(v => v.length > 0);
  }

  /** Produto visível com os filtros atualmente aplicados. */
  productPassesAppliedFilters(p: Produto): boolean {
    const { choices, priceMin, priceMax } = this.applied();
    const groups = this.groups();

    for (const g of groups) {
      if (g.kind === 'range') continue;
      const selected = choices[g.id];
      if (!selected?.length) continue;
      if (g.categoriaId && p.categoriaId !== g.categoriaId) return false;
      const vid = g.variavelProdutoId;
      if (!vid) continue;
      const vari = p.variacoes.find((v) => v.id === vid);
      if (!vari) return false;
      const has = vari.opcoes.some((o) => selected.includes(o.id));
      if (!has) return false;
    }

    const rangeGroup = groups.find((g) => g.id === 'preco' && g.kind === 'range');
    if (rangeGroup?.range) {
      if (priceMin != null && p.preco < priceMin) return false;
      if (priceMax != null && p.preco > priceMax) return false;
    }

    return true;
  }
}
