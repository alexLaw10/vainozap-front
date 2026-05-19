import { Component, OnInit, OnDestroy, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { NotificationModel } from '../../../../shared/models/notification.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="notif-wrapper">
      <button class="notif-btn" (click)="toggle()" [class.active]="open()">
        <app-icon name="bell" [size]="22"></app-icon>
        @if (notifService.unreadCount() > 0) {
          <span class="badge">{{ notifService.unreadCount() > 99 ? '99+' : notifService.unreadCount() }}</span>
        }
      </button>

      @if (open()) {
        <div class="notif-dropdown">
          <div class="notif-header">
            <span class="notif-title">Notificações</span>
            @if (notifService.unreadCount() > 0) {
              <button class="mark-all-btn" (click)="markAllRead()">Marcar todas como lidas</button>
            }
          </div>

          <div class="notif-list">
            @if (notifService.notifications().length === 0) {
              <div class="notif-empty">Nenhuma notificação</div>
            }
            @for (n of notifService.notifications(); track n.id) {
              <div
                class="notif-item"
                [class.unread]="!n.lida"
                (click)="onNotifClick(n)"
                [routerLink]="n.pedidoId ? ['/merchant/orders'] : null"
              >
                <div class="notif-icon" [class.novo-pedido]="n.tipo === 'NOVO_PEDIDO'">🛍</div>
                <div class="notif-body">
                  <p class="notif-item-title">{{ n.titulo }}</p>
                  @if (n.mensagem) {
                    <p class="notif-item-msg">{{ n.mensagem }}</p>
                  }
                  <p class="notif-time">{{ timeAgo(n.criadoEm) }}</p>
                </div>
                @if (!n.lida) {
                  <span class="unread-dot"></span>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .notif-wrapper {
        position: relative;
      }

      .notif-btn {
        position: relative;
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        color: var(--color-text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
          background 0.15s,
          color 0.15s;

        &:hover,
        &.active {
          background: var(--color-chip-neutral-bg);
          color: var(--color-text-primary);
        }
      }

      .badge {
        position: absolute;
        top: 2px;
        right: 2px;
        background: var(--color-danger);
        color: var(--color-on-primary);
        font-size: 10px;
        font-weight: 700;
        min-width: 16px;
        height: 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 3px;
        line-height: 1;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }

      .notif-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 360px;
        background: var(--color-surface-base);
        border: 1px solid var(--color-border-subtle);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgb(0 0 0 / 0.12);
        z-index: 1000;
        overflow: hidden;
      }

      .notif-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid var(--color-chip-neutral-bg);
      }

      .notif-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--color-text-primary);
      }

      .mark-all-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 12px;
        color: var(--color-primary);
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }

      .notif-list {
        max-height: 400px;
        overflow-y: auto;
      }

      .notif-empty {
        text-align: center;
        padding: 32px 16px;
        color: var(--color-text-disabled);
        font-size: 14px;
      }

      .notif-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        transition: background 0.1s;
        border-bottom: 1px solid var(--color-surface-subtle);
        position: relative;

        &:hover {
          background: var(--color-surface-subtle);
        }

        &.unread {
          background: var(--color-purple-tint);
        }

        &:last-child {
          border-bottom: none;
        }
      }

      .notif-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: var(--color-chip-neutral-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;

        &.novo-pedido {
          background: var(--color-violet-muted);
        }
      }

      .notif-body {
        flex: 1;
        min-width: 0;
      }

      .notif-item-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-primary);
        margin: 0 0 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .notif-item-msg {
        font-size: 12px;
        color: var(--color-text-muted);
        margin: 0 0 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .notif-time {
        font-size: 11px;
        color: var(--color-text-disabled);
        margin: 0;
      }

      .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-primary);
        flex-shrink: 0;
        margin-top: 4px;
      }
    `,
  ],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly notifService = inject(NotificationService);
  private readonly el = inject(ElementRef);
  open = signal(false);

  ngOnInit(): void {
    this.notifService.load();
    this.notifService.connectSse();
  }

  ngOnDestroy(): void {
    this.notifService.disconnectSse();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  onNotifClick(n: NotificationModel): void {
    if (!n.lida) this.notifService.markRead(n.id);
    this.close();
  }

  markAllRead(): void {
    this.notifService.markAllRead();
  }

  timeAgo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  }
}
