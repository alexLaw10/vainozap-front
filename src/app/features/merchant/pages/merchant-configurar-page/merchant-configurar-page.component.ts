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
  private logoFile: File | undefined;
  private faviconFile: File | undefined;

  protected readonly FORMAS_PAGAMENTO = ['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência'];

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
    this.logoPreview.set(t.logoUrl);
    this.faviconPreview.set(t.faviconUrl);
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

  protected addRede(): void {
    this.redesArr.push(this.fb.group({ rotulo: ['', Validators.required], url: ['', Validators.required] }));
  }

  protected removeRede(i: number): void { this.redesArr.removeAt(i); }

  protected redeAt(i: number): FormGroup { return this.redesArr.at(i) as FormGroup; }

  protected get redesLength(): number { return this.redesArr.length; }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);

    const v = this.form.getRawValue();
    const payload = {
      slug: v.slug, nomeLoja: v.nomeLoja, tituloDocumento: v.tituloDocumento || null,
      logoUrl: v.logoUrl || null, faviconUrl: v.faviconUrl || null,
      corPrimaria: v.corPrimaria || null, corSecundaria: v.corSecundaria || null,
      corDestaqueCatalogo: v.corDestaqueCatalogo || null,
      whatsapp: v.whatsapp || null, slogan: v.slogan || null,
      emailContato: v.emailContato || null, telefoneContato: v.telefoneContato || null,
      horarioAtendimentoLinha: v.horarioAtendimentoLinha || null,
      horarioAtendimentoDetalhes: v.horarioAtendimentoDetalhes || null,
      cnpj: v.cnpj || null, nomeProprietario: v.nomeProprietario || null,
      enderecoLinha: v.enderecoLinha || null,
      planoTipo: null as unknown as string,
      ativo: null as unknown as boolean,
      rodape: {
        textoLinkWhatsapp: v.textoLinkWhatsapp || null,
        seloTitulo: v.seloTitulo || null, seloSubtitulo: v.seloSubtitulo || null,
        reclamacoesTexto: v.reclamacoesTexto || null, reclamacoesUrl: v.reclamacoesUrl || null,
        formasPagamento: v.formasPagamento,
        redesSociais: (v.redesSociais as { rotulo: string; url: string }[]),
        redesPlaceholder: v.redesPlaceholder || null, faixaInferior: v.faixaInferior || null,
      },
    };

    this.configService.update(payload, this.logoFile, this.faviconFile).subscribe({
      next: () => { this.saving.set(false); this.success.set(true); setTimeout(() => this.success.set(false), 3000); },
      error: (e: { error?: { error?: string }; message?: string }) => {
        this.saving.set(false);
        this.error.set(e?.error?.error ?? e?.message ?? 'Erro ao salvar configurações.');
      },
    });
  }
}
