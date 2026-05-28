import { Injectable, signal } from '@angular/core';

export interface ToastOptions {
  /** Texto principal do toast. */
  message: string;
  /** Rota Angular para o CTA opcional (ex.: '/cart'). */
  actionRoute?: string;
  /** Label do CTA (ex.: 'Ver pedido →'). */
  actionLabel?: string;
  /** Duração em ms antes do auto-dismiss. Padrão: 3000. */
  duration?: number;
}

export interface ToastState extends Required<ToastOptions> {
  visible: boolean;
}

const DEFAULTS: Omit<Required<ToastOptions>, 'message'> = {
  actionRoute:  '',
  actionLabel:  '',
  duration:     3000,
};

/**
 * Serviço de toast global — funciona em qualquer parte da aplicação.
 * Basta injetar, chamar `show()` e montar `<ui-toast>` no shell desejado.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly state = signal<ToastState>({
    visible:     false,
    message:     '',
    actionRoute: '',
    actionLabel: '',
    duration:    3000,
  });

  private timer: ReturnType<typeof setTimeout> | null = null;

  show(options: ToastOptions): void {
    const merged: ToastState = { ...DEFAULTS, ...options, visible: true };
    if (this.timer) clearTimeout(this.timer);
    this.state.set(merged);
    this.timer = setTimeout(() => this.dismiss(), merged.duration);
  }

  dismiss(): void {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.state.update((s) => ({ ...s, visible: false }));
  }
}
