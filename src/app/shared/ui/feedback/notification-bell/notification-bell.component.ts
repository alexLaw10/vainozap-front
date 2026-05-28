import {
  Component,
  HostListener,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../primitives/icon/icon.component';

export interface UiNotification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  pedidoId: string | null;
  criadoEm: string;
}

/**
 * Sino de notificações com dropdown — componente puramente visual.
 * Recebe dados via inputs e emite eventos para o pai conectar ao service.
 *
 * @example
 * <ui-notification-bell
 *   [notifications]="notifService.notifications()"
 *   [unreadCount]="notifService.unreadCount()"
 *   (opened)="notifService.load()"
 *   (markRead)="notifService.markRead($event)"
 *   (markAllRead)="notifService.markAllRead()"
 * />
 */
@Component({
  selector: 'ui-notification-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent {
  private readonly el = inject(ElementRef);

  readonly notifications = input<UiNotification[]>([]);
  readonly unreadCount   = input(0);

  /** Emitido na primeira abertura — use para carregar a lista lazy. */
  readonly opened      = output<void>();
  /** Emitido ao clicar em uma notificação não lida. Payload: id da notificação. */
  readonly markRead    = output<string>();
  /** Emitido ao clicar em "Marcar todas como lidas". */
  readonly markAllRead = output<void>();

  protected readonly open = signal(false);
  private firstOpen = true;

  protected toggle(): void {
    const opening = !this.open();
    this.open.set(opening);
    if (opening && this.firstOpen) {
      this.firstOpen = false;
      this.opened.emit();
    }
  }

  protected close(): void {
    this.open.set(false);
  }

  protected onItemClick(n: UiNotification): void {
    if (!n.lida) this.markRead.emit(n.id);
    this.close();
  }

  protected onMarkAllRead(): void {
    this.markAllRead.emit();
  }

  protected timeAgo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return 'agora';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) this.close();
  }
}
