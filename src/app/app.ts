import { afterNextRender, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { merge, timer } from 'rxjs';
import { debounceTime, filter, take } from 'rxjs/operators';

import { CartIconComponent } from './shared/ui/cart-icon/cart-icon.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CartIconComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

  /** `on` visível, `fade` saída, `off` removido do DOM */
  protected readonly bootState = signal<'on' | 'fade' | 'off'>('on');

  private bootStartedAt = 0;

  constructor() {
    afterNextRender(() => {
      this.bootStartedAt = performance.now();

      const scheduleDismiss = (): void => {
        const minVisibleMs = 520;
        const elapsed = performance.now() - this.bootStartedAt;
        const wait = Math.max(0, minVisibleMs - elapsed);
        setTimeout(() => this.dismissBootOverlay(), wait);
      };

      if (this.router.navigated) {
        scheduleDismiss();
        return;
      }

      merge(
        this.router.events.pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          debounceTime(100),
        ),
        timer(5000),
      )
        .pipe(take(1))
        .subscribe(() => scheduleDismiss());
    });
  }

  private dismissBootOverlay(): void {
    if (this.bootState() !== 'on') return;
    this.bootState.set('fade');
    setTimeout(() => this.bootState.set('off'), 450);
  }
}
