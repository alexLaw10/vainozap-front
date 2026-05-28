import {
  Component,
  ContentChild,
  input,
  output,
  computed,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { CurrencyPipe, DatePipe, NgTemplateOutlet, PercentPipe } from '@angular/common';

import { PaginatorComponent } from '../../navigation/paginator/paginator.component';
import { DocPipe }       from '../../../pipes/doc.pipe';
import { PhoneMaskPipe } from '../../../pipes/phone-mask.pipe';

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type TableColumnType =
  | 'text'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'percent'
  | 'phone'
  | 'doc';

export type TableColumnWidth = 'img' | 'actions';

export interface TableColumn {
  /** Chave do objeto row que será exibida */
  key: string;
  /** Texto do cabeçalho */
  header: string;
  /** Máscara/pipe aplicado automaticamente — omita para texto simples */
  type?: TableColumnType;
  /** Largura pré-definida: 'img' (3.5rem) | 'actions' (11rem) */
  width?: TableColumnWidth;
  /** Oculta em mobile (<640px) */
  hideOnMobile?: boolean;
  /**
   * Indica que esta célula será renderizada pelo ng-template #cell do consumer.
   * A tabela não tentará renderizar o valor automaticamente.
   */
  custom?: boolean;
  /**
   * Função opcional para calcular o valor da célula a partir da linha.
   * Útil para valores derivados (ex: quantidade * preço).
   * Ignorado quando custom=true.
   */
  valueFn?: (row: any) => any;
}

// ─── Componente ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    PercentPipe,
    NgTemplateOutlet,
    NgClass,
    PaginatorComponent,
    DocPipe,
    PhoneMaskPipe,
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="ui-table-wrap">

      <!-- ── Tabela ─────────────────────────────────────────────────────────── -->
      @if (columns().length > 0) {

        <table class="ui-table">

          <!-- cabeçalho gerado pelas colunas -->
          <thead>
            <tr>
              @for (col of columns(); track col.key) {
                <th
                  class="ui-th"
                  [class.ui-th--img]="col.width === 'img'"
                  [class.ui-th--actions]="col.width === 'actions'"
                  [class.ui-th--hide-sm]="col.hideOnMobile"
                >{{ col.header }}</th>
              }
            </tr>
          </thead>

          <!-- corpo gerado pelas linhas -->
          <tbody>
            @for (row of rows(); track $index) {
              <tr
                class="ui-tr"
                [ngClass]="rowClassFn()(row)"
                [class.ui-tr--clickable]="clickableRows()"
                (click)="clickableRows() && rowClick.emit(row)"
              >
                @for (col of columns(); track col.key) {
                  <td
                    class="ui-td"
                    [class.ui-td--actions]="col.width === 'actions'"
                    [class.ui-td--hide-sm]="col.hideOnMobile"
                  >
                    @if (col.custom && cellTpl) {
                      <!-- célula customizada pelo consumer via ng-template #cell -->
                      <ng-container
                        [ngTemplateOutlet]="cellTpl"
                        [ngTemplateOutletContext]="{ $implicit: row, col: col }"
                      />
                    } @else {
                      <!-- célula automática por type -->
                      @let val = col.valueFn ? col.valueFn(row) : row[col.key];
                      @switch (col.type) {
                        @case ('currency') {
                          {{ val | currency:'BRL':'symbol':'1.2-2' }}
                        }
                        @case ('date') {
                          {{ val | date:'dd/MM/yyyy' }}
                        }
                        @case ('datetime') {
                          {{ val | date:'dd/MM/yyyy HH:mm' }}
                        }
                        @case ('percent') {
                          {{ val / 100 | percent:'1.0-2' }}
                        }
                        @case ('phone') {
                          {{ val | phoneMask }}
                        }
                        @case ('doc') {
                          {{ val | doc }}
                        }
                        @default {
                          {{ val }}
                        }
                      }
                    }
                  </td>
                }
              </tr>
            }
          </tbody>

          <!-- tfoot opcional via ng-content -->
          <ng-content select="tfoot" />

        </table>

      } @else {
        <!-- fallback: ng-content para uso legado sem columns -->
        <table class="ui-table">
          <ng-content />
        </table>
      }

      <!-- ── Empty state ────────────────────────────────────────────────────── -->
      @if (!loading() && rows().length === 0 && columns().length > 0) {
        <div class="ui-table-empty">{{ emptyMessage() }}</div>
      }

      <!-- ── Overlay de carregamento ────────────────────────────────────────── -->
      @if (loading()) {
        <div class="ui-table-loading" aria-busy="true" aria-label="Carregando">
          <span class="ui-table-spinner"></span>
        </div>
      }

    </div>

    <!-- ── Paginador integrado ────────────────────────────────────────────── -->
    @if (hasPaginator()) {
      <app-paginator
        [page]="page()!"
        [size]="pageSize()"
        [totalElements]="totalElements()"
        [totalPages]="totalPages()"
        (pageChange)="pageChange.emit($event)"
      />
    }
  `,
  styleUrl: './table.component.scss',
})
export class TableComponent {

  // ── Template customizado do consumer ──────────────────────────────────────
  @ContentChild('cell') cellTpl?: TemplateRef<{ $implicit: any; col: TableColumn }>;

  // ── Dados ─────────────────────────────────────────────────────────────────
  readonly columns      = input<TableColumn[]>([]);
  readonly rows         = input<any[]>([]);

  // ── Estado ────────────────────────────────────────────────────────────────
  readonly loading      = input(false);
  readonly emptyMessage = input('Nenhum item encontrado.');

  // ── Linha clicável (opcional) ─────────────────────────────────────────────
  /** Emite a linha clicada — ativa cursor pointer automaticamente */
  readonly rowClick     = output<any>();
  /** Habilita cursor pointer e hover nas linhas */
  readonly clickableRows = input(false);
  /** Função que retorna classes CSS dinâmicas por linha — ex: destacar saving */
  readonly rowClassFn   = input<(row: any) => string>(() => '');

  // ── Paginação (opcional — paginador aparece só quando page !== null) ──────
  readonly page          = input<number | null>(null);
  readonly pageSize      = input(20);
  readonly totalElements = input(0);
  readonly totalPages    = input(0);

  readonly pageChange = output<number>();

  protected readonly hasPaginator = computed(
    () => this.page() !== null && this.totalPages() > 1,
  );
}
