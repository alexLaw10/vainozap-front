import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { IconComponent } from '../../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-merchant-orders-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, IconComponent],
  template: `
    <div class="mol">
      <div class="mol__head container">
        <p class="mol__eyebrow">
          <span class="mol__dot" aria-hidden="true"></span>
          Central de vendas
        </p>
        <nav class="mol__seg" aria-label="Pedido — seções">
          <a
            routerLink="/merchant/orders/pedidos"
            class="mol__seg-btn"
            [class.mol__seg-btn--active]="primaryActive('pedidos')"
          >
            <span class="mol__seg-ico" aria-hidden="true">
              <app-icon name="file-text" [size]="18"></app-icon>
            </span>
            Pedidos
          </a>
          <a
            routerLink="/merchant/orders/vendas"
            class="mol__seg-btn"
            [class.mol__seg-btn--active]="primaryActive('vendas')"
          >
            <span class="mol__seg-ico" aria-hidden="true">
              <app-icon name="currency" [size]="18"></app-icon>
            </span>
            Vendas
          </a>
          <a
            routerLink="/merchant/orders/pdv"
            class="mol__seg-btn"
            [class.mol__seg-btn--active]="primaryActive('pdv')"
          >
            <span class="mol__seg-ico" aria-hidden="true">
              <app-icon name="cart" [size]="18"></app-icon>
            </span>
            PDV
          </a>
          <!-- NÃO IMPLEMENTADO — Clientes / Painel: ver merchant.routes.ts -->
        </nav>
      </div>

      <div class="mol__outlet">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [
    `
      .mol {
        --mol-accent: var(--color-primary);
        --mol-accent-2: var(--color-auth-accent);
        --mol-soft: color-mix(in srgb, var(--mol-accent) 14%, white);

        background: var(--color-neutral-100);

        &__head {
          padding-block: var(--space-4) var(--space-3);
        }

        &__eyebrow {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin: 0 0 var(--space-3);
          font-size: var(--font-size-xs);
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        &__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--mol-accent);
          box-shadow: 0 0 0 3px var(--mol-soft);
        }

        &__seg {
          display: flex;
          flex-wrap: nowrap;
          gap: 6px;
          padding: 5px;
          border-radius: 16px;
          background: var(--color-neutral-200);
          box-shadow: inset 0 1px 2px rgb(15 23 42 / 0.06);
          overflow-x: auto;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
        }

        &__seg-btn {
          scroll-snap-align: start;
          flex: 1 1 auto;
          min-width: 5.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.55rem 0.65rem;
          border-radius: 12px;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-decoration: none;
          white-space: nowrap;
          transition:
            background 0.18s ease,
            color 0.18s ease,
            box-shadow 0.18s ease;

          @media (min-width: 560px) {
            min-width: 0;
            flex: 1;
            font-size: var(--font-size-xs);
          }

          &:hover:not(&--active) {
            color: var(--color-text-primary);
            background: color-mix(in srgb, var(--color-surface-base) 50%, transparent);
          }

          &--active {
            color: var(--mol-accent);
            background: var(--color-surface-base);
            box-shadow:
              0 2px 8px rgb(15 23 42 / 0.08),
              0 0 0 1px rgb(99 102 241 / 0.15);
          }

          &:focus-visible {
            outline: 2px solid var(--color-focus-ring);
            outline-offset: 2px;
          }
        }

        &__seg-ico {
          display: flex;
          opacity: 0.9;
        }

        &__nest-wrap {
          padding-bottom: var(--space-3);
        }

        &__nest {
          padding: var(--space-3) var(--space-4);
          border-radius: 14px;
          background: var(--color-surface-base);
          border: 1px solid var(--color-border-subtle);
          box-shadow: 0 4px 20px rgb(15 23 42 / 0.05);
        }

        &__nest-title {
          display: block;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--mol-accent-2);
          margin-bottom: 0.25rem;
        }

        &__nest-hint {
          margin: 0 0 var(--space-3);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: 1.45;
          max-width: 36rem;
        }

        &__nest-scroll {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        &__chip {
          padding: 0.45rem 0.95rem;
          border-radius: 999px;
          font-size: var(--font-size-xs);
          font-weight: 700;
          color: var(--color-text-secondary);
          text-decoration: none;
          background: var(--color-neutral-50);
          border: 1px solid var(--color-border-subtle);
          transition:
            border-color 0.15s ease,
            color 0.15s ease,
            box-shadow 0.15s ease;

          &:hover {
            border-color: color-mix(in srgb, var(--mol-accent) 40%, var(--color-border-subtle));
            color: var(--mol-accent);
          }

          &--active {
            color: var(--color-on-primary);
            background: linear-gradient(135deg, var(--mol-accent) 0%, var(--mol-accent-2) 100%);
            border-color: transparent;
            box-shadow: 0 3px 12px rgb(99 102 241 / 0.35);
          }

          &:focus-visible {
            outline: 2px solid var(--color-focus-ring);
            outline-offset: 2px;
          }
        }

        &__outlet {
          min-height: 10rem;
        }
      }
    `,
  ],
})
export class MerchantOrdersLayoutComponent {
  private readonly router = inject(Router);

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected primaryActive(area: 'pedidos' | 'vendas' | 'clientes' | 'painel' | 'pdv'): boolean {
    const u = this.currentUrl().split('?')[0];
    if (area === 'pedidos') return u.includes('/merchant/orders/pedidos');
    if (area === 'vendas')  return u.includes('/merchant/orders/vendas');
    if (area === 'pdv')     return u.includes('/merchant/orders/pdv');
    if (area === 'clientes') return u.includes('/merchant/orders/clientes');
    if (area === 'painel')  return u.includes('/merchant/orders/painel');
    return false;
  }
}
