import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationModel } from '../../../shared/models/notification.model';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/api/v1/merchant/notifications`;

  notifications = signal<NotificationModel[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.lida).length);

  private eventSource: EventSource | null = null;

  load(): void {
    this.http.get<NotificationModel[]>(this.base).subscribe(list => {
      this.notifications.set(list);
    });
  }

  connectSse(): void {
    if (this.eventSource) return;
    const token = this.auth.token();
    if (!token) return;

    this.eventSource = new EventSource(`${this.base}/stream?token=${token}`);

    this.eventSource.addEventListener('notification', (event: MessageEvent) => {
      const notif: NotificationModel = JSON.parse(event.data);
      this.notifications.update(list => [notif, ...list]);
      this.playSound();
    });

    this.eventSource.addEventListener('connected', () => {
      console.log('[Notifications] SSE connected');
    });

    this.eventSource.onerror = () => {
      // Browser auto-reconnects after ~3s
    };
  }

  disconnectSse(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  markRead(id: string): void {
    this.http.patch(`${this.base}/${id}/read`, {}).subscribe(() => {
      this.notifications.update(list =>
        list.map(n => n.id === id ? { ...n, lida: true } : n)
      );
    });
  }

  markAllRead(): void {
    this.http.patch(`${this.base}/read-all`, {}).subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, lida: true })));
    });
  }

  private playSound(): void {
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  }
}
