import { inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type PanelTheme = 'dark' | 'light';

const STORAGE_KEY = 'merchant-panel-theme';

@Injectable({ providedIn: 'root' })
export class PanelThemeService {
  private readonly doc = inject(DOCUMENT);

  readonly theme = signal<PanelTheme>(this.loadInitial());

  toggle(): void {
    const next: PanelTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // SSR / private mode
    }
  }

  private loadInitial(): PanelTheme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // SSR / private mode
    }
    return 'dark';
  }
}
