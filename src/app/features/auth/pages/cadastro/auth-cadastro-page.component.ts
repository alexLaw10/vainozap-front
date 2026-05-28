import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { TENANT_PLANO_UI, TenantPlanoTipo } from '../../../../core/models/tenant.model';
import { ButtonComponent, IconComponent, InputComponent, InputPasswordComponent, InputPhoneComponent } from '@app/shared/ui';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../../../environments/environment';

export type SenhaForca = 'fraca' | 'media' | 'forte';
type PlanoOpcao = 'trial' | TenantPlanoTipo;

export interface PlanoSignup {
  tipo: TenantPlanoTipo;
  nome: string;
  descricao: string;
  precoMensal: number;
  precoAnual: number;
  destaque: boolean;
  destaquesBullets: string[];
}

@Component({
  selector: 'app-auth-cadastro-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, ButtonComponent, IconComponent, InputComponent, InputPasswordComponent, InputPhoneComponent],
  templateUrl: './auth-cadastro-page.component.html',
  styleUrl: './auth-cadastro-page.component.scss',
})
export class AuthCadastroPageComponent {
  protected readonly billingEnabled = environment.billingEnabled;

  private readonly auth    = inject(AuthService);
  private readonly router  = inject(Router);

  protected readonly step    = signal<1 | 2>(1);
  protected readonly loading = signal(false);
  protected readonly erro    = signal<string | null>(null);

  // Erros por campo (exibidos inline)
  protected readonly erroEmail = signal<string | null>(null);
  protected readonly erroSlug  = signal<string | null>(null);
  protected readonly erroSenha = signal<string | null>(null);

  // Campos do formulário como signals
  protected readonly nomeProprietario = signal('');
  protected readonly email            = signal('');
  protected readonly senha            = signal('');
  protected readonly confirmarSenha   = signal('');
  protected readonly whatsapp         = signal('');
  protected readonly nomeLoja         = signal('');
  protected readonly slug             = signal('');

  // Planos
  protected readonly planoSelecionado = signal<PlanoOpcao>('trial');
  protected readonly planos           = signal<PlanoSignup[]>([]);
  protected readonly planosLoading    = signal(true);

  protected readonly planoPago = computed(() => this.planoSelecionado() !== 'trial');

  protected readonly planosLocked: Array<{ tipo: TenantPlanoTipo; labelCurto: string }> = [
    { tipo: 'basico',       labelCurto: TENANT_PLANO_UI.basico.labelCurto },
    { tipo: 'profissional', labelCurto: TENANT_PLANO_UI.profissional.labelCurto },
    { tipo: 'business',     labelCurto: TENANT_PLANO_UI.business.labelCurto },
  ];

  // ── Computed: força da senha ──────────────────────────────────────────────
  protected readonly senhaForca = computed<SenhaForca>(() => {
    const s = this.senha();
    if (!s || s.length < 6) return 'fraca';
    const temMaiuscula = /[A-Z]/.test(s);
    const temNumero    = /[0-9]/.test(s);
    const temEspecial  = /[^A-Za-z0-9]/.test(s);
    const score = [s.length >= 8, temMaiuscula, temNumero, temEspecial].filter(Boolean).length;
    if (score >= 3) return 'forte';
    if (score >= 1) return 'media';
    return 'fraca';
  });

  protected readonly senhaForcaLabel = computed(() =>
    ({ fraca: 'Fraca', media: 'Média', forte: 'Forte' }[this.senhaForca()]),
  );

  // ── Computed: senhas batem ────────────────────────────────────────────────
  protected readonly senhasIguais = computed(() => this.senha() === this.confirmarSenha());

  protected readonly mostrarErrMismatch = computed(
    () => !!this.confirmarSenha() && !this.senhasIguais(),
  );

  // ── Validação do step 1 ──────────────────────────────────────────────────
  protected readonly step1Valido = computed(() =>
    this.nomeProprietario().trim().length >= 2 &&
    this.email().includes('@') &&
    this.senha().length >= 6 &&
    this.senhasIguais() &&
    this.whatsapp().trim().length >= 8 &&
    this.nomeLoja().trim().length >= 2 &&
    /^[a-z0-9-]+$/.test(this.slug()) &&
    this.slug().length >= 2,
  );

  // ── Helpers de preço ──────────────────────────────────────────────────────
  protected preco(p: PlanoSignup): number {
    return p.precoMensal;
  }

  // ── Slug auto-gerado do nome da loja ──────────────────────────────────────
  protected onNomeLojaChange(nome: string): void {
    this.nomeLoja.set(nome);
    this.slug.set(
      nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 63),
    );
  }

  // ── Navegação entre steps ─────────────────────────────────────────────────
  protected avancar(): void {
    if (!this.step1Valido()) return;
    this.erro.set(null);
    this.erroEmail.set(null);
    this.erroSlug.set(null);
    this.step.set(2);
  }

  protected voltar(): void {
    this.erro.set(null);
    this.step.set(1);
  }

  // ── Finalizar cadastro ────────────────────────────────────────────────────
  protected finalizar(): void {
    if (this.loading()) return;
    this.erro.set(null);
    this.erroEmail.set(null);
    this.erroSlug.set(null);
    this.loading.set(true);

    const planoTipo = (this.planoSelecionado() === 'trial' ? 'basico' : this.planoSelecionado()) as TenantPlanoTipo;

    this.auth
      .register({
        nomeProprietario: this.nomeProprietario().trim(),
        email:            this.email().trim(),
        senha:            this.senha(),
        nomeLoja:         this.nomeLoja().trim(),
        slug:             this.slug().trim(),
        whatsapp:         this.whatsapp().trim(),
        planoTipo,
      })
      .subscribe({
        next: () => {
          // Billing temporariamente desabilitado: cadastro segue direto para o painel.
          this.loading.set(false);
          void this.router.navigate(['/merchant']);
        },
        error: (err) => {
          this.loading.set(false);
          const detail: string = err?.error?.detail ?? err?.error?.message ?? '';
          const status: number = err?.status ?? 0;

          if (detail.toLowerCase().includes('e-mail') || detail.toLowerCase().includes('email')) {
            this.step.set(1);
            this.erroEmail.set('Este e-mail já está cadastrado. Tente fazer login.');
          } else if (detail.toLowerCase().includes('slug') || detail.toLowerCase().includes('endereço')) {
            this.step.set(1);
            this.erroSlug.set('Este endereço de loja já está em uso. Escolha outro.');
          } else if (status === 422) {
            const fields = err?.error?.errors ?? {};
            const msgs = Object.values(fields).join('. ');
            this.step.set(1);
            this.erro.set(msgs || 'Verifique os campos e tente novamente.');
          } else if (status === 0) {
            this.erro.set('Sem conexão com o servidor. Verifique sua internet.');
          } else {
            this.erro.set('Não foi possível criar sua conta. Tente novamente.');
          }
        },
      });
  }

  constructor() {
    this.planosLoading.set(false);
  }
}
