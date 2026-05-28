/**
 * Wrapper de domínio — conecta NotificationService ao componente de UI puro.
 *
 * Responsabilidades deste wrapper:
 *  - Gerenciar conexão SSE (ngOnInit / ngOnDestroy)
 *  - Fornecer dados do service como inputs para o componente de UI
 *  - Traduzir outputs do UI component em chamadas do service
 */
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { NotificationBellComponent } from '../../../../shared/ui/feedback/notification-bell/notification-bell.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [NotificationBellComponent],
  template: `
    <ui-notification-bell
      [notifications]="notifService.notifications()"
      [unreadCount]="notifService.unreadCount()"
      (opened)="notifService.load()"
      (markRead)="notifService.markRead($event)"
      (markAllRead)="notifService.markAllRead()"
    />
  `,
})
export class MerchantNotificationBellComponent implements OnInit, OnDestroy {
  protected readonly notifService = inject(NotificationService);

  ngOnInit(): void  { this.notifService.connectSse(); }
  ngOnDestroy(): void { this.notifService.disconnectSse(); }
}
