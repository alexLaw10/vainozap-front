import {
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [NgClass],
  template: `
    @if (totalPages() > 1) {
      <nav class="paginator" aria-label="Navegação de páginas">
        <!-- Anterior -->
        <button
          class="paginator__btn"
          [disabled]="page() === 0"
          (click)="go(page() - 1)"
          aria-label="Página anterior"
        >‹</button>

        <!-- Números de página -->
        @for (n of pages(); track n) {
          @if (n === -1) {
            <span class="paginator__ellipsis">…</span>
          } @else {
            <button
              class="paginator__btn"
              [ngClass]="{ 'paginator__btn--active': n === page() }"
              (click)="go(n)"
              [attr.aria-current]="n === page() ? 'page' : null"
            >{{ n + 1 }}</button>
          }
        }

        <!-- Próxima -->
        <button
          class="paginator__btn"
          [disabled]="page() === totalPages() - 1"
          (click)="go(page() + 1)"
          aria-label="Próxima página"
        >›</button>

        <span class="paginator__info">
          {{ page() * size() + 1 }}–{{ Math.min((page() + 1) * size(), totalElements()) }}
          de {{ totalElements() }}
        </span>
      </nav>
    }
  `,
  styleUrl: './paginator.component.scss',
})
export class PaginatorComponent {
  /** Página atual (0-based). */
  readonly page          = input.required<number>();
  readonly size          = input.required<number>();
  readonly totalElements = input.required<number>();
  readonly totalPages    = input.required<number>();

  /** Emite o número da nova página (0-based). */
  readonly pageChange = output<number>();

  protected readonly Math = Math;

  /** Gera a lista de páginas visíveis com reticências onde necessário. */
  protected readonly pages = computed<number[]>(() => {
    const total   = this.totalPages();
    const current = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);

    const result: number[] = [];
    // sempre mostra primeira e última
    const add = (n: number) => { if (!result.includes(n)) result.push(n); };

    add(0);
    if (current > 2)       result.push(-1); // reticências
    for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) add(i);
    if (current < total - 3) result.push(-1);
    add(total - 1);

    return result;
  });

  protected go(n: number): void {
    if (n < 0 || n >= this.totalPages() || n === this.page()) return;
    this.pageChange.emit(n);
  }
}
