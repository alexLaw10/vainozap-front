import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, HostListener, effect, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

import { StorefrontFiltersService } from '../../services/storefront-filters.service';

@Component({
  selector: 'app-storefront-filters-modal',
  standalone: true,
  templateUrl: './storefront-filters-modal.component.html',
  styleUrl: './storefront-filters-modal.component.scss',
})
export class StorefrontFiltersModalComponent {
  protected readonly filters = inject(StorefrontFiltersService);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      this.doc.body.style.overflow = this.filters.panelOpen() ? 'hidden' : '';
    });

    toObservable(this.filters.panelOpen)
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        queueMicrotask(() => {
          const el = this.doc.querySelector<HTMLElement>('[data-storefront-filters-dialog]');
          el?.focus();
        });
      });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.filters.panelOpen()) this.filters.cancel();
  }

  protected onChoiceChange(groupId: string, optionId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.filters.toggleDraftChoice(groupId, optionId, checked);
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.filters.cancel();
  }

  protected onPriceMinInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.filters.setDraftPriceMin(v === '' ? null : Number(v));
  }

  protected onPriceMaxInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.filters.setDraftPriceMax(v === '' ? null : Number(v));
  }

  protected priceMinInputValue(): string {
    const v = this.filters.draftPriceMin();
    return v == null ? '' : String(v);
  }

  protected priceMaxInputValue(): string {
    const v = this.filters.draftPriceMax();
    return v == null ? '' : String(v);
  }
}
