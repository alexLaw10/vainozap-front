import {
  Directive,
  EmbeddedViewRef,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';

import { PlanoContextService, type PlanoFeatures } from '../services/plano-context.service';

/**
 * Diretiva estrutural que exibe/oculta conteúdo com base no plano do lojista.
 *
 * Uso básico — exibe só se o plano tiver acesso:
 * ```html
 * <section *appFeature="'videos'">...</section>
 * ```
 *
 * Com template alternativo (ex: botão de upgrade):
 * ```html
 * <section *appFeature="'videos'; else upgradeRef">...</section>
 * <ng-template #upgradeRef><app-upgrade-banner feature="videos"/></ng-template>
 * ```
 *
 * Com overlay de bloqueio (renderiza o conteúdo com visual de bloqueado):
 * ```html
 * <section *appFeature="'pixel'; showLocked: true">...</section>
 * ```
 */
@Directive({
  selector: '[appFeature]',
  standalone: true,
})
export class AppFeatureDirective {
  private readonly plano = inject(PlanoContextService);
  private readonly tpl   = inject(TemplateRef<unknown>);
  private readonly vcr   = inject(ViewContainerRef);

  /** Nome da feature a verificar (keyof PlanoFeatures). */
  readonly appFeature = input.required<keyof PlanoFeatures>();

  /**
   * Template alternativo exibido quando o plano NÃO tem acesso.
   * Ex: <ng-template #upgradeRef>...</ng-template>
   */
  readonly appFeatureElse = input<TemplateRef<unknown> | null>(null);

  /**
   * Quando true, renderiza o conteúdo mesmo sem acesso,
   * mas envolto em um wrapper com classe CSS `feature-locked`
   * e um badge indicando o plano mínimo necessário.
   */
  readonly appFeatureShowLocked = input(false);

  /** Referência à view ativa para evitar re-render desnecessário. */
  private _currentView: EmbeddedViewRef<unknown> | null = null;
  private _isLocked = false;

  constructor() {
    // effect() rastreia automaticamente os computed signals dentro de temFeature()
    effect(() => {
      const feature   = this.appFeature();
      const hasAccess = this.plano.temFeature(feature);
      const showLocked = this.appFeatureShowLocked();
      const elseRef   = this.appFeatureElse();

      if (hasAccess) {
        this._renderMain(false);
      } else if (showLocked) {
        this._renderMain(true);
      } else if (elseRef) {
        this._renderElse(elseRef);
      } else {
        this._clear();
      }
    });
  }

  // ── helpers privados ──────────────────────────────────────────────────────

  private _renderMain(locked: boolean): void {
    if (this._currentView && this._isLocked === locked) return; // sem mudança

    this.vcr.clear();
    this._currentView = this.vcr.createEmbeddedView(this.tpl);
    this._isLocked = locked;

    if (locked) {
      // Aplica wrapper de lock nos elementos raiz da view
      this._currentView.rootNodes.forEach((node: HTMLElement) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          node.classList?.add('feature-locked');
          node.setAttribute('data-feature-locked', this.appFeature());
        }
      });
    }
  }

  private _renderElse(elseRef: TemplateRef<unknown>): void {
    if (this._currentView && this._isLocked === false) {
      // Verifica se já estamos no else template (não há forma direta, então re-renderiza)
    }
    this.vcr.clear();
    this._currentView = this.vcr.createEmbeddedView(elseRef);
    this._isLocked = false;
  }

  private _clear(): void {
    this.vcr.clear();
    this._currentView = null;
    this._isLocked = false;
  }
}
