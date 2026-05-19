import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-auth-reset-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './auth-reset-password-page.component.html',
  styleUrl: './auth-reset-password-page.component.scss',
})
export class AuthResetPasswordPageComponent implements OnInit {
  private readonly http   = inject(HttpClient);
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected token     = '';
  protected novaSenha = '';
  protected confirmar = '';
  protected loading   = signal(false);
  protected erro      = signal<string | null>(null);
  protected sucesso   = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.erro.set('Link inválido. Solicite um novo link de recuperação.');
    }
  }

  protected submit(): void {
    if (this.novaSenha !== this.confirmar) {
      this.erro.set('As senhas não coincidem.');
      return;
    }
    if (this.novaSenha.length < 6) {
      this.erro.set('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!this.token || this.loading()) return;

    this.loading.set(true);
    this.erro.set(null);

    this.http
      .post(`${environment.apiUrl}/api/v1/auth/reset-password`, {
        token: this.token,
        novaSenha: this.novaSenha,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.sucesso.set(true);
          setTimeout(() => this.router.navigate(['/auth/login']), 2500);
        },
        error: (e) => {
          this.loading.set(false);
          this.erro.set(
            e?.error?.error ?? 'Token inválido ou expirado. Solicite um novo link.',
          );
        },
      });
  }
}
