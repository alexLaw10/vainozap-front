import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../auth/services/auth.service';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { MerchantContextService } from '../../services/merchant-context.service';
import { MerchantMeService } from '../../services/merchant-me.service';
import { MyStoresService, type MinhaLojaDto, type NovaLojaRequest } from '../../services/my-stores.service';

@Component({
  selector: 'app-merchant-contas-page',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './merchant-contas-page.component.html',
  styleUrl: './merchant-contas-page.component.scss',
})
export class MerchantContasPageComponent implements OnInit {
  private readonly router        = inject(Router);
  private readonly authService   = inject(AuthService);
  protected readonly ctx         = inject(MerchantContextService);
  private readonly meService     = inject(MerchantMeService);
  private readonly storesService = inject(MyStoresService);

  // ── Dados da conta (vêm da API) ───────────────────────────────────────────
  protected readonly nomeExibicao     = signal('…');
  protected readonly emailExibicao    = signal('…');
  protected readonly telefoneExibicao = signal('…');
  protected readonly profileLoading   = signal(false);

  // ── Assinatura (vem da API) ───────────────────────────────────────────────
  protected readonly planoNome      = signal('…');
  protected readonly trialTerminaEm = signal<Date | null>(null);

  protected readonly validoAteFormatado = computed(() => {
    const d = this.trialTerminaEm();
    if (!d) return '—';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  });

  protected readonly diasGratuitosRestantes = computed(() => {
    const fim = this.trialTerminaEm();
    if (!fim) return 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const t = new Date(fim);
    t.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((t.getTime() - hoje.getTime()) / 86400000));
  });

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
        this.planoNome.set(p.planoTipo);
        this.trialTerminaEm.set(p.trialEndsAt ? new Date(p.trialEndsAt) : null);
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
      },
      error: (e: { status?: number; error?: { detail?: string }; message?: string }) => {
        this.criando.set(false);
        if (e.status === 402) {
          this.novaLojaError.set(
            e?.error?.detail ?? 'Seu plano não permite criar mais lojas. Faça upgrade para continuar.',
          );
        } else if (e.status === 409) {
          this.novaLojaError.set('Já existe uma loja com esse slug. Escolha outro.');
        } else {
          this.novaLojaError.set(e?.error?.detail ?? e?.message ?? 'Erro ao criar loja.');
        }
      },
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  protected sair(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth/login');
  }
}
