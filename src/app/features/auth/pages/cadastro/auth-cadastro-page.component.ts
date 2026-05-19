import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-auth-cadastro-page',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, ButtonComponent, IconComponent],
  templateUrl: './auth-cadastro-page.component.html',
  styleUrl: './auth-cadastro-page.component.scss',
})
export class AuthCadastroPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly step = signal<1 | 2>(1);
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);

  // Step 1 form fields
  protected form: Step1Form = {
    nomeProprietario: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    whatsapp: '',
    nomeLoja: '',
    slug: '',
  };

  // Step 2: beta é o único plano disponível; os demais ficam bloqueados
  protected readonly planoSelecionado = signal<TenantPlanoTipo>('beta');

  protected readonly planosLocked: Array<{ tipo: TenantPlanoTipo; labelCurto: string }> = [
    { tipo: 'essencial', labelCurto: TENANT_PLANO_UI.essencial.labelCurto },
    { tipo: 'profissional', labelCurto: TENANT_PLANO_UI.profissional.labelCurto },
    { tipo: 'empresarial', labelCurto: TENANT_PLANO_UI.empresarial.labelCurto },
  ];

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

  protected onNomeLojaChange(): void {
    // Auto-generate slug from nomeLoja if user hasn't manually edited it
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

  protected avancar(): void {
    if (!this.step1Valido) return;
    this.erro.set(null);
    this.step.set(2);
  }

  protected voltar(): void {
    this.erro.set(null);
    this.step.set(1);
  }

  protected finalizar(): void {
    if (this.loading()) return;
    this.erro.set(null);
    this.loading.set(true);

    this.auth
      .register({
        nomeProprietario: this.form.nomeProprietario.trim(),
        email: this.form.email.trim(),
        senha: this.form.senha,
        nomeLoja: this.form.nomeLoja.trim(),
        slug: this.form.slug.trim(),
        whatsapp: this.form.whatsapp.trim(),
        planoTipo: this.planoSelecionado(),
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/merchant'),
        error: (err) => {
          this.loading.set(false);
          const msg: string = err?.error?.message ?? '';
          if (msg.includes('E-mail')) {
            this.step.set(1);
            this.erro.set('Este e-mail já está em uso. Tente fazer login.');
          } else if (msg.includes('Slug') || msg.includes('slug')) {
            this.step.set(1);
            this.erro.set('Este endereço da loja já está em uso. Escolha outro.');
          } else {
            this.erro.set('Não foi possível criar sua conta. Tente novamente.');
          }
        },
      });
  }
}
