import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../auth/services/auth.service';
import { ButtonComponent, IconComponent, InputComponent, ModalComponent, ToastService } from '@app/shared/ui';
import { MerchantContextService } from '../../../services/merchant-context.service';
import { MerchantMeService } from '../../../services/merchant-me.service';
import { PlanoContextService } from '../../../services/plano-context.service';
import { BillingService } from '../../../services/billing.service';
import { MyStoresService, type MinhaLojaDto, type NovaLojaRequest } from '../../../services/my-stores.service';
import type { TenantPlanoTipo } from '../../../../../core/models/tenant.model';

export interface PlanoCard {
  tipo: TenantPlanoTipo;
  nome: string;
  precoMensal: number;
  precoAnual: number;
  destaque: boolean;
  destaquesBullets: string[];
}

@Component({
  selector: 'app-merchant-contas-page',
  standalone: true,
  imports: [CurrencyPipe, ButtonComponent, IconComponent, InputComponent, ModalComponent],
  templateUrl: './merchant-contas-page.component.html',
  styleUrl: './merchant-contas-page.component.scss',
})
export class MerchantContasPageComponent implements OnInit {
  protected readonly billingEnabled = environment.billingEnabled;

  private readonly router        = inject(Router);
  private readonly authService   = inject(AuthService);
  protected readonly ctx         = inject(MerchantContextService);
  protected readonly plano       = inject(PlanoContextService);
  private readonly meService     = inject(MerchantMeService);
  private readonly storesService = inject(MyStoresService);
  private readonly billing       = inject(BillingService);
  private readonly toast         = inject(ToastService);

  // ── Dados da conta (vêm da API) ───────────────────────────────────────────
  protected readonly nomeExibicao     = signal('…');
  protected readonly emailExibicao    = signal('…');
  protected readonly telefoneExibicao = signal('…');
  protected readonly profileLoading   = signal(false);

  // ── Assinatura — delegado ao PlanoContextService ─────────────────────────
  protected readonly planoNome = computed(() => this.plano.planoTipo());

  protected readonly validoAteFormatado = computed(() => {
    const d = this.plano.trialEndsAt();
    if (!d) return '—';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  });

  protected readonly diasGratuitosRestantes = computed(() =>
    this.plano.diasRestantesTrial()
  );

  // ── Multi-loja ────────────────────────────────────────────────────────────
  protected readonly lojas          = signal<MinhaLojaDto[]>([]);
  protected readonly lojasLoading   = signal(false);
  protected readonly switching      = signal<string | null>(null);
  protected readonly storeError     = signal<string | null>(null);

  // Modal nova loja
  protected readonly showNovaLoja  = signal(false);
  protected readonly novaLojaNome  = signal('');
  protected readonly novaLojaSlug  = signal('');
  protected readonly novaLojaWpp   = signal('');
  protected readonly criando       = signal(false);
  protected readonly novaLojaError = signal<string | null>(null);

  // ── Alterar plano (inline expand) ────────────────────────────────────────
  protected readonly showAlterarPlano   = signal(false);
  protected readonly planoCards         = signal<PlanoCard[]>([]);
  protected readonly planoCardsLoading  = signal(false);
  protected readonly planoSelecionado   = signal<TenantPlanoTipo | null>(null);
  protected readonly ctaLoading         = signal(false);
  protected readonly alterarPlanoErro   = signal<string | null>(null);

  protected precoCard(p: PlanoCard): number {
    return p.precoMensal;
  }

  protected isPlanoAtual(tipo: TenantPlanoTipo): boolean {
    return this.plano.planoTipo() === tipo && this.plano.isAtiva();
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadLojas();
  }

  // ── Perfil ────────────────────────────────────────────────────────────────
  private loadProfile(): void {
    this.profileLoading.set(true);
    this.meService.getProfile().subscribe({
      next: (p) => {
        this.nomeExibicao.set(p.nomeProprietario ?? p.email);
        this.emailExibicao.set(p.email);
        this.telefoneExibicao.set(p.telefone ?? '—');
        this.profileLoading.set(false);
      },
      error: () => this.profileLoading.set(false),
    });
  }

  // ── Multi-loja ────────────────────────────────────────────────────────────
  private loadLojas(): void {
    this.lojasLoading.set(true);
    this.storesService.listar().subscribe({
      next: (list) => { this.lojas.set(list); this.lojasLoading.set(false); },
      error: ()     => this.lojasLoading.set(false),
    });
  }

  protected switchLoja(loja: MinhaLojaDto): void {
    if (loja.isPrimary || this.switching()) return;
    this.switching.set(loja.tenantId);
    this.storeError.set(null);

    this.storesService.switch(loja.tenantId).subscribe({
      next: (res) => {
        this.authService.storeTokens(res);
        window.location.assign('/merchant');
      },
      error: (e: { error?: { detail?: string }; message?: string }) => {
        this.switching.set(null);
        this.storeError.set(e?.error?.detail ?? e?.message ?? 'Erro ao trocar loja.');
      },
    });
  }

  // ── Nova loja ─────────────────────────────────────────────────────────────
  protected abrirModalNovaLoja(): void {
    this.novaLojaNome.set('');
    this.novaLojaSlug.set('');
    this.novaLojaWpp.set('');
    this.novaLojaError.set(null);
    this.showNovaLoja.set(true);
  }

  protected fecharModalNovaLoja(): void { this.showNovaLoja.set(false); }

  protected onNomeChange(nome: string): void {
    this.novaLojaNome.set(nome);
    const slug = nome.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    this.novaLojaSlug.set(slug);
  }

  protected confirmarNovaLoja(): void {
    if (this.criando()) return;
    const req: NovaLojaRequest = {
      nomeLoja: this.novaLojaNome().trim(),
      slug:     this.novaLojaSlug().trim(),
      whatsapp: this.novaLojaWpp().trim(),
    };
    if (!req.nomeLoja || !req.slug || !req.whatsapp) {
      this.novaLojaError.set('Preencha todos os campos.');
      return;
    }
    this.criando.set(true);
    this.novaLojaError.set(null);

    this.storesService.criar(req).subscribe({
      next: () => {
        this.criando.set(false);
        this.showNovaLoja.set(false);
        this.loadLojas();
        this.toast.show({ message: 'Nova loja criada com sucesso' });
      },
      error: (e: { status?: number; error?: { detail?: string }; message?: string }) => {
        this.criando.set(false);
        // 402 é tratado globalmente pelo planInterceptor (abre UpgradeModal)
        if (e.status === 409) {
          this.novaLojaError.set('Já existe uma loja com esse slug. Escolha outro.');
        } else if (e.status !== 402) {
          this.novaLojaError.set(e?.error?.detail ?? e?.message ?? 'Erro ao criar loja.');
        }
      },
    });
  }

  // ── Alterar plano ────────────────────────────────────────────────────────
  protected abrirAlterarPlano(): void {
    this.showAlterarPlano.set(true);
    this.alterarPlanoErro.set(null);
  }

  protected fecharAlterarPlano(): void {
    this.showAlterarPlano.set(false);
    this.planoSelecionado.set(null);
    this.alterarPlanoErro.set(null);
  }

  protected confirmarTrocaPlano(): void {
    const tipo = this.planoSelecionado();
    if (!tipo || this.ctaLoading()) return;
    if (!environment.billingEnabled) {
      this.alterarPlanoErro.set('Cobrança temporariamente indisponível. Entre em contato com o suporte.');
      return;
    }

    this.ctaLoading.set(true);
    this.alterarPlanoErro.set(null);

    this.billing.checkout({ planoTipo: tipo, ciclo: 'MONTHLY' }).subscribe({
      next: (res) => {
        this.ctaLoading.set(false);
        this.fecharAlterarPlano();
        window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer');
        void this.router.navigate(['/merchant/contas/checkout-pendente']);
      },
      error: (err: { error?: { detail?: string } }) => {
        this.ctaLoading.set(false);
        this.alterarPlanoErro.set(
          err?.error?.detail ?? 'Não foi possível iniciar o pagamento. Tente novamente.',
        );
      },
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  protected sair(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth/login');
  }
}
