import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-auth-forgot-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './auth-forgot-password-page.component.html',
  styleUrl: './auth-forgot-password-page.component.scss',
})
export class AuthForgotPasswordPageComponent {
  private readonly http = inject(HttpClient);

  protected email   = '';
  protected loading = signal(false);
  protected erro    = signal<string | null>(null);
  protected enviado = signal(false);

  protected submit(): void {
    if (!this.email || this.loading()) return;

    this.loading.set(true);
    this.erro.set(null);

    this.http
      .post(`${environment.apiUrl}/api/v1/auth/forgot-password`, { email: this.email })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.enviado.set(true);
        },
        error: () => {
          this.loading.set(false);
          // Mesmo em erro, mostramos a mensagem de sucesso — não revelamos se o e-mail existe
          this.enviado.set(true);
        },
      });
  }
}
