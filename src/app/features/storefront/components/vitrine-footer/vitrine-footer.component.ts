import { Component, inject, signal } from '@angular/core';

import type { TenantRodape } from '../../../../core/models/tenant.model';
import { IconComponent } from '@app/shared/ui';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontFiltersService } from '../../services/storefront-filters.service';

@Component({
  selector: 'app-vitrine-footer',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './vitrine-footer.component.html',
  styleUrl: './vitrine-footer.component.scss',
})
export class VitrineFooterComponent {
  protected readonly context = inject(StorefrontContextService);
  protected readonly filters = inject(StorefrontFiltersService);
  protected readonly currentYear = new Date().getFullYear();
  protected readonly horariosAbertos = signal(false);

  protected rodape(): TenantRodape {
    return this.context.tenant().rodape;
  }

  protected waLink(): string {
    const n = this.context.tenant().whatsapp.replace(/\D/g, '');
    return `https://wa.me/${n}`;
  }

  protected telefoneExibicao(): string {
    const t = this.context.tenant();
    const manual = t.telefoneContato?.trim();
    if (manual) return manual;
    let d = t.whatsapp.replace(/\D/g, '');
    if (d.startsWith('55') && d.length > 11) d = d.slice(2);
    return this.formatBrPhone(d);
  }

  protected telHref(): string {
    let d = (this.context.tenant().telefoneContato || this.context.tenant().whatsapp).replace(/\D/g, '');
    if (d.length >= 10 && !d.startsWith('55')) d = `55${d}`;
    return `tel:+${d}`;
  }

  protected horarioLinha(): string | undefined {
    return this.context.tenant().horarioAtendimentoLinha?.trim() || undefined;
  }

  protected horarioDetalhes(): string | undefined {
    return this.context.tenant().horarioAtendimentoDetalhes?.trim() || undefined;
  }

  protected cnpjExibicao(): string | undefined {
    return this.context.tenant().cnpj?.trim() || undefined;
  }

  protected toggleHorarios(): void {
    if (!this.horarioDetalhes()) return;
    this.horariosAbertos.update((v) => !v);
  }

  protected abrirFiltros(): void {
    this.filters.openPanel();
  }

  private formatBrPhone(d: string): string {
    if (d.length === 11) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }
    if (d.length === 10) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    }
    return d || this.context.tenant().whatsapp;
  }
}
