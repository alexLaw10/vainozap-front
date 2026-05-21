import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import type { TenantApi } from '../../../../shared/models/tenant-api.model';
import { MerchantConfigService } from '../../services/merchant-config.service';

@Component({
  selector: 'app-merchant-configurar-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [MerchantConfigService],
  templateUrl: './merchant-configurar-page.component.html',
  styleUrl: './merchant-configurar-page.component.scss',
})
export class MerchantConfigurarPageComponent implements OnInit {
  private readonly configService = inject(MerchantConfigService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly saving  = signal(false);
  protected readonly error   = signal<string | null>(null);
  protected readonly success = signal(false);

  protected readonly logoPreview    = signal<string | null>(null);
  protected readonly faviconPreview = signal<string | null>(null);
  protected readonly bannerPreview  = signal<string | null>(null);
  private logoFile:    File | undefined;
  private faviconFile: File | undefined;
  private bannerFile:  File | undefined;
  /** URLs S3 salvas — distintas dos blob URLs usados só para preview local. */
  private savedLogoUrl:    string | null = null;
  private savedFaviconUrl: string | null = null;
  private savedBannerUrl:  string | null = null;

  protected readonly FORMAS_PAGAMENTO = ['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência'];

  // Chips rápidos para o resumo de horário — clique adiciona o período
  protected readonly HORARIO_CHIPS = [
    'Seg–Sex 9h–18h',
    'Seg–Sex 8h–17h',
    'Seg–Sex 10h–19h',
    'Sáb 9h–13h',
    'Sáb 9h–18h',
    'Dom 10h–16h',
    'Seg–Sáb 9h–18h',
    'Todos os dias 9h–18h',
    '24h / 7 dias',
  ];

  // Templates prontos para o campo de detalhes
  protected readonly HORARIO_TEMPLATES = [
    {
      label: 'Semana comercial',
      texto: 'Segunda a Sexta das 9h às 18h.\nSábado das 9h às 13h.\nDomingo e feriados: fechado.',
    },
    {
      label: 'Seg–Sex integral',
      texto: 'Segunda a Sexta das 9h às 18h.\nSábado, Domingo e feriados: fechado.',
    },
    {
      label: 'Seg–Sáb integral',
      texto: 'Segunda a Sábado das 9h às 18h.\nDomingo e feriados: fechado.',
    },
    {
      label: 'Todos os dias',
      texto: 'Todos os dias das 9h às 18h.\nFeriados: horário pode variar.',
    },
    {
      label: '24 horas',
      texto: 'Atendimento 24 horas, 7 dias por semana, incluindo feriados.',
    },
  ];

  protected appendHorarioChip(chip: string): void {
    const ctrl = this.form.controls.horarioAtendimentoLinha;
    const atual = ctrl.value.trim();
    ctrl.setValue(atual ? `${atual} · ${chip}` : chip);
  }

  protected clearHorarioLinha(): void {
    this.form.controls.horarioAtendimentoLinha.setValue('');
  }

  protected applyHorarioTemplate(texto: string): void {
    this.form.controls.horarioAtendimentoDetalhes.setValue(texto);
  }

  protected readonly form = this.fb.nonNullable.group({
    // Identidade
    nomeLoja:            ['', [Validators.required, Validators.maxLength(100)]],
    slug:                ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    slogan:              [''],
    tituloDocumento:     [''],
    logoUrl:             [''],
    faviconUrl:          [''],
    // Cores
    corPrimaria:         ['#000000'],
    corSecundaria:       ['#000000'],
    corDestaqueCatalogo: ['#000000'],
    // Contato
    whatsapp:            [''],
    telefoneContato:     [''],
    emailContato:        [''],
    cnpj:                [''],
    nomeProprietario:    [''],
    enderecoLinha:       [''],
    // Atendimento
    horarioAtendimentoLinha:    [''],
    horarioAtendimentoDetalhes: [''],
    // Rodapé
    textoLinkWhatsapp:   [''],
    seloTitulo:          [''],
    seloSubtitulo:       [''],
    reclamacoesTexto:    [''],
    reclamacoesUrl:      [''],
    formasPagamento:     [[] as string[]],
    redesPlaceholder:    [''],
    faixaInferior:       [''],
    // Redes sociais
    redesSociais: this.fb.array<FormGroup>([]),
  });

  get redesArr(): FormArray { return this.form.controls.redesSociais as unknown as FormArray; }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.configService.get().subscribe({
      next: (t) => { this.patchForm(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private patchForm(t: TenantApi): void {
    this.form.patchValue({
      nomeLoja: t.nomeLoja, slug: t.slug, slogan: t.slogan ?? '',
      tituloDocumento: t.tituloDocumento ?? '', logoUrl: t.logoUrl ?? '',
      faviconUrl: t.faviconUrl ?? '', corPrimaria: t.corPrimaria ?? '#000000',
      corSecundaria: t.corSecundaria ?? '#000000',
      corDestaqueCatalogo: t.corDestaqueCatalogo ?? '#000000',
      whatsapp: t.whatsapp ?? '', telefoneContato: t.telefoneContato ?? '',
      emailContato: t.emailContato ?? '', cnpj: t.cnpj ?? '',
      nomeProprietario: t.nomeProprietario ?? '', enderecoLinha: t.enderecoLinha ?? '',
      horarioAtendimentoLinha: t.horarioAtendimentoLinha ?? '',
      horarioAtendimentoDetalhes: t.horarioAtendimentoDetalhes ?? '',
      textoLinkWhatsapp: t.rodape?.textoLinkWhatsapp ?? '',
      seloTitulo: t.rodape?.seloTitulo ?? '', seloSubtitulo: t.rodape?.seloSubtitulo ?? '',
      reclamacoesTexto: t.rodape?.reclamacoesTexto ?? '', reclamacoesUrl: t.rodape?.reclamacoesUrl ?? '',
      formasPagamento: t.rodape?.formasPagamento ?? [],
      redesPlaceholder: t.rodape?.redesPlaceholder ?? '', faixaInferior: t.rodape?.faixaInferior ?? '',
    });
    this.savedLogoUrl    = t.logoUrl    ?? null;
    this.savedFaviconUrl = t.faviconUrl ?? null;
    this.savedBannerUrl  = t.bannerUrl  ?? null;
    this.logoPreview.set(this.savedLogoUrl);
    this.faviconPreview.set(this.savedFaviconUrl);
    this.bannerPreview.set(this.savedBannerUrl);
    this.redesArr.clear();
    (t.rodape?.redesSociais ?? []).forEach((r) =>
      this.redesArr.push(this.fb.group({ rotulo: [r.rotulo, Validators.required], url: [r.url, Validators.required] }))
    );
  }

  protected pickLogo(): void {
    this.pickImage((f) => {
      this.logoFile = f;
      this.logoPreview.set(URL.createObjectURL(f));
    });
  }

  protected pickFavicon(): void {
    this.pickImage((f) => {
      this.faviconFile = f;
      this.faviconPreview.set(URL.createObjectURL(f));
    });
  }

  protected removeLogo(): void {
    this.logoFile = undefined;
    this.savedLogoUrl = null;
    this.logoPreview.set(null);
  }

  protected removeFavicon(): void {
    this.faviconFile = undefined;
    this.savedFaviconUrl = null;
    this.faviconPreview.set(null);
  }

  protected pickBanner(): void {
    this.pickImage((f) => {
      this.bannerFile = f;
      this.bannerPreview.set(URL.createObjectURL(f));
    });
  }

  protected removeBanner(): void {
    this.bannerFile = undefined;
    this.savedBannerUrl = null;
    this.bannerPreview.set(null);
  }

  private pickImage(cb: (f: File) => void): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => { const f = input.files?.[0]; if (f) cb(f); };
    input.click();
  }

  protected toggleForma(forma: string): void {
    const current: string[] = this.form.controls.formasPagamento.value as string[];
    const idx = current.indexOf(forma);
    this.form.controls.formasPagamento.setValue(
      idx >= 0 ? current.filter((f) => f !== forma) : [...current, forma]
    );
  }

  protected hasForma(forma: string): boolean {
    return (this.form.controls.formasPagamento.value as string[]).includes(forma);
  }

  protected readonly REDES_CHIPS: { rotulo: string; placeholder: string; cor: string; inicial: string }[] = [
    { rotulo: 'Instagram',  placeholder: 'https://instagram.com/sua-loja',  cor: '#e1306c', inicial: 'In' },
    { rotulo: 'Facebook',   placeholder: 'https://facebook.com/sua-loja',   cor: '#1877f2', inicial: 'Fb' },
    { rotulo: 'WhatsApp',   placeholder: 'https://wa.me/5511999998888',      cor: '#25d366', inicial: 'Wa' },
    { rotulo: 'TikTok',     placeholder: 'https://tiktok.com/@sua-loja',    cor: '#010101', inicial: 'Tk' },
    { rotulo: 'YouTube',    placeholder: 'https://youtube.com/@sua-loja',   cor: '#ff0000', inicial: 'Yt' },
    { rotulo: 'Twitter/X',  placeholder: 'https://x.com/sua-loja',          cor: '#000000', inicial: 'X'  },
    { rotulo: 'LinkedIn',   placeholder: 'https://linkedin.com/company/...',cor: '#0a66c2', inicial: 'Li' },
    { rotulo: 'Pinterest',  placeholder: 'https://pinterest.com/sua-loja',  cor: '#e60023', inicial: 'Pi' },
    { rotulo: 'Telegram',   placeholder: 'https://t.me/sua-loja',           cor: '#2aabee', inicial: 'Tg' },
  ];

  protected redeChipJaAdicionada(rotulo: string): boolean {
    return (this.redesArr.value as { rotulo: string }[]).some((r) => r.rotulo === rotulo);
  }

  protected addRedeByChip(chip: { rotulo: string; placeholder: string }): void {
    if (this.redeChipJaAdicionada(chip.rotulo)) return;
    this.redesArr.push(this.fb.group({
      rotulo: [chip.rotulo, Validators.required],
      url:    ['', Validators.required],
    }));
  }

  protected addRede(): void {
    this.redesArr.push(this.fb.group({ rotulo: ['', Validators.required], url: ['', Validators.required] }));
  }

  protected removeRede(i: number): void { this.redesArr.removeAt(i); }

  protected redeAt(i: number): FormGroup { return this.redesArr.at(i) as FormGroup; }

  protected get redesLength(): number { return this.redesArr.length; }

  protected chipParaRede(rotulo: string): { rotulo: string; placeholder: string; cor: string; inicial: string } | undefined {
    return this.REDES_CHIPS.find((c) => c.rotulo === rotulo);
  }

  /** Lista de nomes de campos inválidos para exibir na mensagem de validação. */
  protected invalidFields(): string[] {
    const fields: string[] = [];
    if (this.form.controls.nomeLoja.invalid) fields.push('Nome da loja');
    if (this.form.controls.slug.invalid)     fields.push('Slug (URL)');
    this.redesArr.controls.forEach((ctrl, i) => {
      const g = ctrl as FormGroup;
      const rotulo = (g.controls['rotulo']?.value as string) || `Rede ${i + 1}`;
      if (g.controls['rotulo']?.invalid) fields.push(`Nome — ${rotulo}`);
      if (g.controls['url']?.invalid)    fields.push(`URL — ${rotulo}`);
    });
    return fields;
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);

    const v = this.form.getRawValue();
    // lidos diretamente dos controles para garantir serialização correta
    const formasPagamento = this.form.controls.formasPagamento.value as string[];
    const redesSociais    = this.redesArr.getRawValue() as { rotulo: string; url: string }[];

    const payload = {
      slug:                        v.slug,
      nomeLoja:                    v.nomeLoja,
      tituloDocumento:             v.tituloDocumento             || null,
      logoUrl:                     this.savedLogoUrl,
      faviconUrl:                  this.savedFaviconUrl,
      bannerUrl:                   this.savedBannerUrl,
      corPrimaria:                 v.corPrimaria                 || null,
      corSecundaria:               v.corSecundaria               || null,
      corDestaqueCatalogo:         v.corDestaqueCatalogo         || null,
      whatsapp:                    v.whatsapp                    || null,
      slogan:                      v.slogan                      || null,
      emailContato:                v.emailContato                || null,
      telefoneContato:             v.telefoneContato             || null,
      horarioAtendimentoLinha:     v.horarioAtendimentoLinha     || null,
      horarioAtendimentoDetalhes:  v.horarioAtendimentoDetalhes  || null,
      cnpj:                        v.cnpj                        || null,
      nomeProprietario:            v.nomeProprietario            || null,
      enderecoLinha:               v.enderecoLinha               || null,
      rodape: {
        textoLinkWhatsapp:  v.textoLinkWhatsapp  || null,
        seloTitulo:         v.seloTitulo         || null,
        seloSubtitulo:      v.seloSubtitulo      || null,
        reclamacoesTexto:   v.reclamacoesTexto   || null,
        reclamacoesUrl:     v.reclamacoesUrl     || null,
        formasPagamento,
        redesSociais,
        redesPlaceholder:   v.redesPlaceholder   || null,
        faixaInferior:      v.faixaInferior       || null,
      },
    };

    const files = {
      logoFile:    this.logoFile,
      faviconFile: this.faviconFile,
      bannerFile:  this.bannerFile,
    };
    this.logoFile = this.faviconFile = this.bannerFile = undefined;

    this.configService.update(payload, files).subscribe({
      // Recarrega o formulário com a resposta real da API — garante que o que
      // está na tela bate exatamente com o que foi salvo no banco.
      next: (saved: TenantApi) => {
        this.saving.set(false);
        this.success.set(true);
        this.patchForm(saved);   // atualiza savedBannerUrl + bannerPreview com a URL S3 real
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (e: { error?: { error?: string }; message?: string }) => {
        this.saving.set(false);
        this.error.set(e?.error?.error ?? e?.message ?? 'Erro ao salvar configurações.');
      },
    });
  }
}
