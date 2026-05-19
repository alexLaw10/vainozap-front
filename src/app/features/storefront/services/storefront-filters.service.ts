import { Injectable, signal } from '@angular/core';

import { STOREFRONT_FILTERS_PANEL_MOCK } from '../../../mock/storefront-filters.mock';
import type { StorefrontFilterGroup } from '../../../shared/models/storefront-filters.model';
import type { Produto } from '../../../shared/models/produto.model';

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
