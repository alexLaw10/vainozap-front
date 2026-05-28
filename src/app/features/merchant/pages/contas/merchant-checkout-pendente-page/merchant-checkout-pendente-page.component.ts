import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../auth/services/auth.service';
import { PlanoContextService } from '../../../services/plano-context.service';
import type { AssinaturaDetalhe } from '../../../services/plano-context.service';

type EstadoPagamento = 'aguardando' | 'confirmado' | 'timeout' | 'erro';

@Component({
  selector: 'app-merchant-checkout-pendente-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './merchant-checkout-pendente-page.component.html',
  styleUrl: './merchant-checkout-pendente-page.component.scss',
})
export class MerchantCheckoutPendentePage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly http   = inject(HttpClient);
  private readonly auth   = inject(AuthService);
  private readonly plano  = inject(PlanoContextService);

  private readonly POLL_INTERVAL_MS = 10_000; // 10 segundos
  private readonly MAX_TENTATIVAS   = 18;      // 3 minutos no total

  protected readonly estado      = signal<EstadoPagamento>('aguardando');
  protected readonly tentativas  = signal(0);
  protected readonly verificando = signal(false);

  private pollSub?: Subscription;

  ngOnInit(): void {
    this.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }

  // ── Polling ───────────────────────────────────────────────────────────────

  private iniciarPolling(): void {
    this.pollSub = interval(this.POLL_INTERVAL_MS).pipe(
      takeWhile(() =>
        this.estado() === 'aguardando' &&
        this.tentativas() < this.MAX_TENTATIVAS
      ),
      switchMap(() => this.http.get<AssinaturaDetalhe>(
        `${environment.apiUrl}/api/v1/merchant/assinatura`
      )),
    ).subscribe({
      next: (detalhe) => {
        this.tentativas.update(n => n + 1);

        if (detalhe.status === 'ativa') {
          this.onPagamentoConfirmado();
        } else if (this.tentativas() >= this.MAX_TENTATIVAS) {
          this.estado.set('timeout');
        }
      },
      error: () => {
        this.tentativas.update(n => n + 1);
        if (this.tentativas() >= this.MAX_TENTATIVAS) {
          this.estado.set('timeout');
        }
      },
    });
  }

  private pararPolling(): void {
    this.pollSub?.unsubscribe();
  }

  // ── Confirmação ───────────────────────────────────────────────────────────

  private onPagamentoConfirmado(): void {
    this.pararPolling();
    this.estado.set('confirmado');

    // Refresha o JWT para que planoTipo e assinaturaStatus reflitam o novo plano
    this.auth.refresh().subscribe({
      next: () => {
        this.plano.recarregar();
        // Redireciona para o painel após 2 segundos de celebração
        setTimeout(() => void this.router.navigate(['/merchant']), 2000);
      },
      error: () => {
        // Mesmo se o refresh falhar, redireciona (o próximo login atualizará o token)
        setTimeout(() => void this.router.navigate(['/merchant']), 2000);
      },
    });
  }

  // ── Ações manuais ─────────────────────────────────────────────────────────

  /** Verificação manual — útil se o lojista quiser checar antes do próximo poll */
  protected verificarAgora(): void {
    if (this.verificando()) return;
    this.verificando.set(true);

    this.http.get<AssinaturaDetalhe>(
      `${environment.apiUrl}/api/v1/merchant/assinatura`
    ).subscribe({
      next: (detalhe) => {
        this.verificando.set(false);
        if (detalhe.status === 'ativa') {
          this.onPagamentoConfirmado();
        }
      },
      error: () => this.verificando.set(false),
    });
  }

  protected get progressoPercent(): number {
    return Math.min((this.tentativas() / this.MAX_TENTATIVAS) * 100, 100);
  }
}
