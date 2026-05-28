import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationModel } from '../models/notification.model';
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
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
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
    // Reage a mudanças no token de acesso:
    // - Token → null  : usuário deslogado, para o SSE imediatamente
    // - Token mudou   : refresh bem-sucedido, reconecta com novo token para parar o loop de 401
    effect(() => {
      const token = this.auth.token();

      if (!token) {
        // Logout ou token limpo — para tudo
        this.clearReconnectTimer();
        this.eventSource?.close();
        this.eventSource = null;
        this.connectedWithToken = null;
        return;
      }

      // Token mudou e o SSE estava falhando (sem conexão ativa) → reconecta agora
      if (token !== this.connectedWithToken && !this.eventSource) {
        this.clearReconnectTimer();
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
    if (this.eventSource || this.destroyed) return;
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
      // Conexão estabelecida — reseta o delay de reconexão
      this.reconnectDelay = 3_000;
    });

    es.onerror = () => {
      // Fecha o EventSource com erro e agenda reconexão com backoff exponencial
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
    this.eventSource?.close();
    this.eventSource = null;
    this.connectedWithToken = null;
  }

  /** Reinicia a conexão SSE (ex: após login em nova aba). */
  resetSse(): void {
    this.destroyed = false;
    this.clearReconnectTimer();
    this.eventSource?.close();
    this.eventSource = null;
    this.connectedWithToken = null;
    this.reconnectDelay = 3_000;
    this.connectSse();
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectTimer) return;
    const token = this.auth.token();
    // Se não há token (usuário deslogado), não agenda reconexão
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
