/**
 * Marca no browser: logo vem de `src/styles/img/` (ficheiro abaixo), copiado para `/img/…` no build
 * (`angular.json` → assets `input`: `src/styles/img`, `output`: `img`).
 */
const LOGO_FILE = 'pacefit.png';

export const TENANT_BRAND_MEDIA = {
  logoUrl: `/img/${LOGO_FILE}`,
  /** Ícone da aba: ficheiro em `public/favicon.ico` (PNG da logo é pesado para favicon). */
  faviconUrl: 'favicon.ico',
} as const;
