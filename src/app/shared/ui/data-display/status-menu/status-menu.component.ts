import {
  Component,
  HostListener,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgClass } from '@angular/common';

import { type StatusConfig, type StatusPedido } from '../../../../features/merchant/models/order-api.model';
import { IconComponent } from '../../primitives/icon/icon.component';

/**
 * Badge de status clicável com dropdown para trocar status de um pedido.
 *
 * - Renderiza um badge colorido + chevron quando há próximos status disponíveis
 * - Ao clicar, abre um dropdown posicionado em `fixed` (não quebra em tabelas com overflow)
 * - Emite `(statusChange)` com o novo status escolhido
 * - Exibe spinner enquanto `[saving]="true"`
 *
 * @example
 * <app-status-menu
 *   [status]="row.status"
 *   [config]="STATUS_CONFIG"
 *   [saving]="savingId() === row.id"
 *   (statusChange)="onStatusChange(row, $event)"
 * />
 */
@Component({
  selector: 'app-status-menu',
  standalone: true,
  imports: [NgClass, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sm-wrap" [class.sm-wrap--open]="open()">

      @if (saving()) {
        <!-- Spinner enquanto salva -->
        <span class="sm-saving">
          <span class="sm-spinner"></span>
          <span class="sm-badge" [ngClass]="currentConfig().colorClass">
            {{ currentConfig().label }}
          </span>
        </span>

      } @else if (nextStatuses().length > 0) {
        <!-- Badge clicável + chevron -->
        <button
          type="button"
          class="sm-trigger"
          [class.sm-trigger--open]="open()"
          (click)="toggle($event)"
          [attr.aria-expanded]="open()"
          aria-haspopup="true"
        >
          <span class="sm-badge" [ngClass]="currentConfig().colorClass">
            {{ currentConfig().label }}
          </span>
          <app-icon name="chevron-down" [size]="12" [strokeWidth]="1.5" class="sm-chevron" />
        </button>

      } @else {
        <!-- Status terminal: só badge, sem interação -->
        <span class="sm-badge" [ngClass]="currentConfig().colorClass">
          {{ currentConfig().label }}
        </span>
      }

    </div>

    <!-- Dropdown — renderizado no body via fixed para não quebrar com overflow:hidden -->
    @if (open() && menuPos()) {
      @let pos = menuPos()!;
      <div
        class="sm-menu"
        role="menu"
        [style.top.px]="pos.top"
        [style.left.px]="pos.left"
        (click)="$event.stopPropagation()"
      >
        @for (s of mainStatuses(); track s) {
          <button
            type="button"
            class="sm-menu__item"
            role="menuitem"
            (click)="select(s, $event)"
          >
            <span class="sm-badge sm-badge--sm" [ngClass]="config()[s]?.colorClass">
              {{ config()[s]?.label }}
            </span>
            <span class="sm-menu__label">{{ actionLabel(s) }}</span>
          </button>
        }

        @if (hasCancelStatus()) {
          <div class="sm-menu__divider"></div>
          <button
            type="button"
            class="sm-menu__item sm-menu__item--danger"
            role="menuitem"
            (click)="select('CANCELADO', $event)"
          >
            <span class="sm-menu__label">Cancelar pedido</span>
          </button>
        }
      </div>
    }
  `,
  styleUrl: './status-menu.component.scss',
})
export class StatusMenuComponent {

  readonly status       = input.required<StatusPedido>();
  readonly config       = input.required<Record<StatusPedido, StatusConfig>>();
  readonly saving       = input(false);

  readonly statusChange = output<StatusPedido>();

  protected readonly open    = signal(false);
  protected readonly menuPos = signal<{ top: number; left: number } | null>(null);

  protected readonly currentConfig = computed(() => this.config()[this.status()]);
  protected readonly nextStatuses  = computed(() => this.currentConfig().next ?? []);
  protected readonly mainStatuses  = computed(() =>
    this.nextStatuses().filter(s => s !== 'CANCELADO')
  );
  protected readonly hasCancelStatus = computed(() =>
    this.nextStatuses().includes('CANCELADO')
  );

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.open()) {
      this.close();
      return;
    }
    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    this.menuPos.set({ top: rect.bottom + 6, left: rect.left });
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
    this.menuPos.set(null);
  }

  protected select(status: StatusPedido, event: MouseEvent): void {
    event.stopPropagation();
    this.close();
    this.statusChange.emit(status);
  }

  protected actionLabel(status: StatusPedido): string {
    const labels: Record<StatusPedido, string> = {
      AGUARDANDO_PAGAMENTO:   'Confirmar pagamento',
      PAGAMENTO_NAO_EFETUADO: 'Pgto. não recebido',
      NOVO:                   'Iniciar preparo',
      EM_PREPARO:             'Marcar enviado',
      ENVIADO:                'Confirmar entrega',
      ENTREGUE:               'Entregue',
      CANCELADO:              'Cancelar',
    };
    return labels[status] ?? status;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.open()) this.close();
  }
}
