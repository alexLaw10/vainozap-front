import { Component, input } from '@angular/core';

/** Ícone do carrinho (mesmo desenho do splash `app-boot` em app.html). */
@Component({
  selector: 'app-cart-icon',
  standalone: true,
  host: {
    class: 'cart-icon',
    '[class.cart-icon--animated]': 'animated()',
  },
  template: `
    <svg
      class="cart-icon__svg"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="cart-icon-fill" x1="60" y1="100" x2="60" y2="38" gradientUnits="userSpaceOnUse">
          <stop stop-color="var(--cart-icon-fill-start, var(--color-primary))" stop-opacity="0.95" />
          <stop
            offset="1"
            stop-color="var(--cart-icon-fill-end, var(--color-secondary))"
            stop-opacity="0.85"
          />
        </linearGradient>
        <clipPath id="cart-icon-basket-inner">
          <path d="M28 42 L32 82 H88 L92 42 Z" />
        </clipPath>
      </defs>
      <path
        d="M38 42 V34 C38 24 46 18 56 18 H64 C74 18 82 24 82 34 V42"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linecap="round"
        fill="none"
        class="cart-icon__stroke"
      />
      <path
        d="M22 38 H98 L92 86 H28 L22 38 Z"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linejoin="round"
        fill="var(--cart-icon-body, var(--color-surface-base))"
        class="cart-icon__stroke"
      />
      <g clip-path="url(#cart-icon-basket-inner)">
        <rect x="26" y="38" width="68" height="48" fill="url(#cart-icon-fill)" class="cart-icon__liquid" />
      </g>
      <path
        d="M22 38 H98 L92 86 H28 L22 38 Z"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linejoin="round"
        fill="none"
        class="cart-icon__stroke"
      />
      <circle cx="44" cy="12" r="7" class="cart-icon__dot cart-icon__dot--1" fill="var(--cart-icon-fill-start, var(--color-primary))" />
      <circle cx="60" cy="8" r="6.5" class="cart-icon__dot cart-icon__dot--2" fill="var(--cart-icon-fill-end, var(--color-secondary))" />
      <circle
        cx="76"
        cy="12"
        r="7"
        class="cart-icon__dot cart-icon__dot--3"
        fill="var(--cart-icon-dot-muted, var(--color-primary-muted))"
      />
    </svg>
  `,
  styleUrl: './cart-icon.component.scss',
})
export class CartIconComponent {
  /** Ativa animação de enchimento e bolinhas (splash de boot). */
  readonly animated = input(false);
}
