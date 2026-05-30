import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationModel } from '../models/notification.model';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

/** Tempo mínimo que a conexão precisa ficar estável antes de resetar o backoff (30s). */
const STABLE_CONNECTION_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/api/v1/merchant/notifications`;

  notifications = signal<NotificationModel[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.lida).length);

  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stableTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 3_000;
  private readonly MAX_RECONNECT_DELAY = 60_000;
  private destroyed = false;

  /**
   * Rastreia o token com o qual o EventSource foi aberto.
   * Quando o token muda (ex: refresh), o SSE é reconectado automaticamente
   * com o novo token sem precisar esperar o backoff de reconexão.
   */
  private connectedWithToken: string | null = null;

  constructor() {
    // Reage a mudanças no token de acesso
    effect(() => {
      const token = this.auth.token();

      if (!token) {
        this.clearReconnectTimer();
        this.eventSource?.close();
        this.eventSource = null;
        this.connectedWithToken = null;
        return;
      }

      if (token !== this.connectedWithToken && !this.eventSource) {
        this.clearReconnectTimer();
        this.connectSse();
      }
    });

    // Visibility API — pausa SSE quando aba está oculta, retoma quando visível.
    // Reduz requisições desnecessárias quando o lojista não está olhando o painel.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Aba ficou em background — fecha conexão e cancela timers
        this.clearReconnectTimer();
        this.clearStableTimer();
        this.eventSource?.close();
        this.eventSource = null;
        this.connectedWithToken = null;
      } else if (!this.destroyed && this.auth.token()) {
        // Aba voltou ao foco — reconecta imediatamente
        this.connectSse();
      }
    });
  }

  load(): void {
    this.http.get<NotificationModel[]>(this.base).subscribe(list => {
      this.notifications.set(list);
    });
  }

  connectSse(): void {
    if (this.eventSource || this.destroyed || document.hidden) return;
    const token = this.auth.token();
    if (!token) return;

    const es = new EventSource(`${this.base}/stream?token=${token}`);
    this.eventSource = es;
    this.connectedWithToken = token;

    es.addEventListener('notification', (event: MessageEvent) => {
      const notif: NotificationModel = JSON.parse(event.data);
      this.notifications.update(list => [notif, ...list]);
      this.playSound();
    });

    es.addEventListener('connected', () => {
      // Só reseta o backoff após 30s de conexão estável — evita o loop de 3s
      this.clearStableTimer();
      this.stableTimer = setTimeout(() => {
        this.reconnectDelay = 3_000;
        this.stableTimer = null;
      }, STABLE_CONNECTION_MS);
    });

    es.onerror = () => {
      this.clearStableTimer();
      es.close();
      if (this.eventSource === es) {
        this.eventSource = null;
        this.connectedWithToken = null;
      }
      this.scheduleReconnect();
    };
  }

  disconnectSse(): void {
    this.destroyed = true;
    this.clearReconnectTimer();
    this.clearStableTimer();
    this.eventSource?.close();
    this.eventSource = null;
    this.connectedWithToken = null;
  }

  /** Reinicia a conexão SSE (ex: após login em nova aba). */
  resetSse(): void {
    this.destroyed = false;
    this.clearReconnectTimer();
    this.clearStableTimer();
    this.eventSource?.close();
    this.eventSource = null;
    this.connectedWithToken = null;
    this.reconnectDelay = 3_000;
    this.connectSse();
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectTimer || document.hidden) return;
    const token = this.auth.token();
    if (!token) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.MAX_RECONNECT_DELAY);
      this.connectSse();
    }, this.reconnectDelay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearStableTimer(): void {
    if (this.stableTimer) {
      clearTimeout(this.stableTimer);
      this.stableTimer = null;
    }
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
