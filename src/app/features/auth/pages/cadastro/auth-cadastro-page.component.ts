import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TENANT_PLANO_UI, TenantPlanoTipo } from '../../../../shared/models/tenant.model';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { AuthService } from '../../services/auth.service';

interface Step1Form {
  nomeProprietario: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  whatsapp: string;
  nomeLoja: string;
  slug: string;
}

export type SenhaForca = 'fraca' | 'media' | 'forte';

@Component({
  selector: 'app-auth-cadastro-page',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, ButtonComponent, IconComponent],
  templateUrl: './auth-cadastro-page.component.html',
  styleUrl: './auth-cadastro-page.component.scss',
})
export class AuthCadastroPageComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly step    = signal<1 | 2>(1);
  protected readonly loading = signal(false);
  protected readonly erro    = signal<string | null>(null);

  // Erros por campo (exibidos inline)
  protected readonly erroEmail = signal<string | null>(null);
  protected readonly erroSlug  = signal<string | null>(null);
  protected readonly erroSenha = signal<string | null>(null);

  // Show/hide senha
  protected mostrarSenha          = false;
  protected mostrarConfirmarSenha = false;

  // Controla se o campo confirmar-senha foi tocado
  protected confirmarTocado = false;

  protected form: Step1Form = {
    nomeProprietario: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    whatsapp: '',
    nomeLoja: '',
    slug: '',
  };

  protected readonly planoSelecionado = signal<TenantPlanoTipo>('beta');

  protected readonly planosLocked: Array<{ tipo: TenantPlanoTipo; labelCurto: string }> = [
    { tipo: 'essencial',    labelCurto: TENANT_PLANO_UI.essencial.labelCurto },
    { tipo: 'profissional', labelCurto: TENANT_PLANO_UI.profissional.labelCurto },
    { tipo: 'empresarial',  labelCurto: TENANT_PLANO_UI.empresarial.labelCurto },
  ];

  // ── Computed: força da senha ───────────────────────────────────────────────
  protected get senhaForca(): SenhaForca {
    const s = this.form.senha;
    if (!s || s.length < 6) return 'fraca';
    const temMaiuscula  = /[A-Z]/.test(s);
    const temNumero     = /[0-9]/.test(s);
    const temEspecial   = /[^A-Za-z0-9]/.test(s);
    const score = [s.length >= 8, temMaiuscula, temNumero, temEspecial].filter(Boolean).length;
    if (score >= 3) return 'forte';
    if (score >= 1) return 'media';
    return 'fraca';
  }

  protected get senhaForcaLabel(): string {
    return { fraca: 'Fraca', media: 'Média', forte: 'Forte' }[this.senhaForca];
  }

  // ── Computed: senhas batem ─────────────────────────────────────────────────
  protected get senhasIguais(): boolean {
    return this.form.senha === this.form.confirmarSenha;
  }

  protected get mostrarErrMismatch(): boolean {
    return this.confirmarTocado && !!this.form.confirmarSenha && !this.senhasIguais;
  }

  // ── Validação do step 1 ───────────────────────────────────────────────────
  protected get step1Valido(): boolean {
    const f = this.form;
    return (
      f.nomeProprietario.trim().length >= 2 &&
      f.email.includes('@') &&
      f.senha.length >= 6 &&
      f.senha === f.confirmarSenha &&
      f.whatsapp.trim().length >= 8 &&
      f.nomeLoja.trim().length >= 2 &&
      /^[a-z0-9-]+$/.test(f.slug) &&
      f.slug.length >= 2
    );
  }

  // ── Slug auto-gerado do nome da loja ──────────────────────────────────────
  protected onNomeLojaChange(): void {
    this.form.slug = this.form.nomeLoja
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 63);
  }

  // ── Navegação entre steps ─────────────────────────────────────────────────
  protected avancar(): void {
    if (!this.step1Valido) return;
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

    this.auth
      .register({
        nomeProprietario: this.form.nomeProprietario.trim(),
        email:            this.form.email.trim(),
        senha:            this.form.senha,
        nomeLoja:         this.form.nomeLoja.trim(),
        slug:             this.form.slug.trim(),
        whatsapp:         this.form.whatsapp.trim(),
        planoTipo:        this.planoSelecionado(),
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/merchant'),
        error: (err) => {
          this.loading.set(false);
          // Backend usa ProblemDetail → campo "detail"
          const detail: string = err?.error?.detail ?? err?.error?.message ?? '';
          const status: number = err?.status ?? 0;

          if (detail.toLowerCase().includes('e-mail') || detail.toLowerCase().includes('email')) {
            this.step.set(1);
            this.erroEmail.set('Este e-mail já está cadastrado. Tente fazer login.');
          } else if (detail.toLowerCase().includes('slug') || detail.toLowerCase().includes('endereço')) {
            this.step.set(1);
            this.erroSlug.set('Este endereço de loja já está em uso. Escolha outro.');
          } else if (status === 422) {
            // Bean Validation (MethodArgumentNotValidException)
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
}
