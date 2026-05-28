import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PlanoContextService } from '../../services/plano-context.service';

/**
 * Faixa informativa exibida no topo do painel enquanto o lojista
 * estiver em período de trial.
 *
 * - Mostra dias restantes assim que `detalheCarregado` for true.
 * - Muda para tom urgente quando ≤ 3 dias.
 * - Pode ser dispensada (dismissed) — a dispensa dura a sessão
 *   corrente (sessionStorage), exceto quando expirado (forçado).
 */
@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [],
  templateUrl: './trial-banner.component.html',
  styleUrl: './trial-banner.component.scss',
})
export class TrialBannerComponent {
  private readonly router = inject(Router);
  protected readonly plano = inject(PlanoContextService);

  private readonly DISMISS_KEY = 'trial-banner-dismissed';

  protected readonly dismissed = signal(
    sessionStorage.getItem(this.DISMISS_KEY) === 'true'
  );

  /** Visível quando: trial ativo + não dispensado */
  protected readonly visible = computed(() =>
    this.plano.isTrial() && !this.dismissed()
  );

  protected readonly dias = computed(() => this.plano.diasRestantesTrial());

  /** Urgente quando ≤ 3 dias ou expirado */
  protected readonly urgente = computed(() => this.dias() <= 3);

  /** Expirado = 0 dias (não bloqueia leitura mas mutações retornam 402) */
  protected readonly expirado = computed(() =>
    this.plano.detalheCarregado() && this.dias() === 0
  );

  protected readonly mensagem = computed(() => {
    if (!this.plano.detalheCarregado()) return 'Carregando informações do seu plano…';
    if (this.expirado()) return 'Seu período de avaliação gratuita expirou. Assine um plano para continuar.';
    if (this.dias() === 1) return '1 dia restante no seu período de avaliação gratuita.';
    return `${this.dias()} dias restantes no seu período de avaliação gratuita.`;
  });

  protected verPlanos(): void {
    void this.router.navigate(['/merchant/contas/planos']);
  }

  protected dismiss(): void {
    // Expirado não pode ser dispensado — usuário precisa assinar
    if (this.expirado()) return;
    sessionStorage.setItem(this.DISMISS_KEY, 'true');
    this.dismissed.set(true);
  }
}
