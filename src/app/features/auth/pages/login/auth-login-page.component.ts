import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { InputComponent, InputPasswordComponent } from '@app/shared/ui';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-login-page',
  standalone: true,
  imports: [RouterLink, FormsModule, InputComponent, InputPasswordComponent],
  templateUrl: './auth-login-page.component.html',
  styleUrl: './auth-login-page.component.scss',
})
export class AuthLoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email   = signal('');
  protected readonly senha   = signal('');
  protected readonly loading = signal(false);
  protected readonly erro    = signal<string | null>(null);

  protected submit(): void {
    if (this.loading()) return;
    this.erro.set(null);
    this.loading.set(true);

    this.auth.login(this.email(), this.senha()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/merchant']).then(ok => {
          if (!ok) this.erro.set('Não foi possível abrir o painel. Tente novamente.');
        });
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 401 || err?.status === 403) {
          this.erro.set('E-mail ou senha incorretos.');
        } else {
          this.erro.set('Não foi possível conectar. Tente novamente.');
        }
      },
    });
  }
}
