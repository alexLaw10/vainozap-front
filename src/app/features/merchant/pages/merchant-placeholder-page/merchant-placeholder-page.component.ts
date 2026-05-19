import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-merchant-placeholder-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './merchant-placeholder-page.component.html',
  styleUrl: './merchant-placeholder-page.component.scss',
})
export class MerchantPlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly titulo = signal('');
  protected readonly texto = signal('');
  protected readonly voltarPara = signal<string | null>(null);
  protected readonly voltarLabel = signal('Voltar');

  constructor() {
    this.route.data.subscribe((d) => {
      this.titulo.set((d['sectionTitle'] as string) ?? 'Em breve');
      this.texto.set((d['sectionLead'] as string) ?? '');
      this.voltarPara.set((d['backLink'] as string) ?? null);
      const bl = d['backLabel'] as string | undefined;
      if (bl) this.voltarLabel.set(bl);
    });
  }
}
