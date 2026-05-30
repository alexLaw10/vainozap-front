import { Component, computed, inject, OnInit, signal } from '@angular/core';

import type { TenantApi } from '../../../../../core/models/tenant-api.model';
import { ButtonComponent, InputComponent, InputCnpjComponent, InputColorComponent, InputPhoneComponent, TextareaComponent, TooltipComponent, UploadImageComponent, IconComponent } from '@app/shared/ui';
import type { UiIconName } from '../../../../../shared/ui/primitives/icon/icon.types';
import { environment } from '../../../../../../environments/environment';
import { MerchantConfigService } from '../../../services/merchant-config.service';
import type { RedeForm } from '../../../models/form-types';

@Component({
  selector: 'app-merchant-configurar-page',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    InputComponent,
    InputCnpjComponent,
    InputColorComponent,
    InputPhoneComponent,
    TextareaComponent,
    TooltipComponent,
    UploadImageComponent,
  ],
  providers: [MerchantConfigService],
  templateUrl: './merchant-configurar-page.component.html',
  styleUrl: './merchant-configurar-page.component.scss',
})
export class MerchantConfigurarPageComponent implements OnInit {
  private readonly configService = inject(MerchantConfigService);

  protected readonly loading   = signal(false);
  protected readonly saving    = signal(false);
  protected readonly error     = signal<string | null>(null);
  protected readonly success   = signal(false);
  protected readonly submitted = signal(false);
  protected readonly ativo     = signal(false);

  protected readonly vitrineUrl = computed(() => {
    const s = this.slug();
    return s ? `https://${s}${environment.domainSuffix}` : null;
  });

  // ── Imagens ────────────────────────────────────────────────────────────────
  protected readonly logoPreview    = signal<string | null>(null);
  protected readonly faviconPreview = signal<string | null>(null);
  protected readonly bannerPreview  = signal<string | null>(null);
  private logoFile:    File | undefined;
  private faviconFile: File | undefined;
  private bannerFile:  File | undefined;
  private savedLogoUrl:    string | null = null;
  private savedFaviconUrl: string | null = null;
  private savedBannerUrl:  string | null = null;

  // ── Identidade ─────────────────────────────────────────────────────────────
  protected readonly nomeLoja        = signal('');
  protected readonly slug            = signal('');
  protected readonly slogan          = signal('');
  protected readonly tituloDocumento = signal('');

  // ── Cores ──────────────────────────────────────────────────────────────────
  protected readonly corPrimaria         = signal('#000000');
  protected readonly corSecundaria       = signal('#000000');
  protected readonly corDestaqueCatalogo = signal('#000000');

  // ── Contato ────────────────────────────────────────────────────────────────
  protected readonly whatsapp         = signal('');
  protected readonly telefoneContato  = signal('');
  protected readonly emailContato     = signal('');
  protected readonly cnpj             = signal('');
  protected readonly nomeProprietario = signal('');
  protected readonly enderecoLinha    = signal('');

  // ── Atendimento ────────────────────────────────────────────────────────────
  protected readonly horarioAtendimentoLinha    = signal('');
  protected readonly horarioAtendimentoDetalhes = signal('');

  // ── Vitrine ────────────────────────────────────────────────────────────────
  protected readonly mensagemTopo        = signal('');
  protected readonly corFundoTopo        = signal('');
  protected readonly politicaEntregaLinha = signal('');

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  protected readonly textoLinkWhatsapp = signal('');
  protected readonly seloTitulo        = signal('');
  protected readonly seloSubtitulo     = signal('');
  protected readonly reclamacoesTexto  = signal('');
  protected readonly reclamacoesUrl    = signal('');
  protected readonly formasPagamento   = signal<string[]>([]);
  protected readonly redesPlaceholder  = signal('');
  protected readonly faixaInferior     = signal('');

  // ── Redes sociais ──────────────────────────────────────────────────────────
  protected readonly redesSociais = signal<RedeForm[]>([]);

  // ── Validação ──────────────────────────────────────────────────────────────
  protected readonly nomeLojaError = computed(() => {
    if (!this.submitted()) return '';
    const v = this.nomeLoja().trim();
    if (!v) return 'Nome da loja é obrigatório.';
    if (v.length > 100) return 'Máximo de 100 caracteres.';
    return '';
  });

  protected readonly slugError = computed(() => {
    if (!this.submitted()) return '';
    const v = this.slug().trim();
    if (!v) return 'Slug é obrigatório.';
    if (!/^[a-z0-9-]+$/.test(v)) return 'Apenas letras minúsculas, números e hífen (ex: minha-loja).';
    return '';
  });

  protected readonly formValid = computed(
    () => {
      const nome = this.nomeLoja().trim();
      const s    = this.slug().trim();
      if (!nome || nome.length > 100) return false;
      if (!s || !/^[a-z0-9-]+$/.test(s)) return false;
      for (const r of this.redesSociais()) {
        if (!r.rotulo.trim() || !r.url.trim()) return false;
      }
      return true;
    },
  );

  // ── Chips e templates ──────────────────────────────────────────────────────
  protected readonly FORMAS_PAGAMENTO = ['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência'];

  protected readonly HORARIO_CHIPS = [
    'Seg–Sex 9h–18h', 'Seg–Sex 8h–17h', 'Seg–Sex 10h–19h',
    'Sáb 9h–13h', 'Sáb 9h–18h', 'Dom 10h–16h',
    'Seg–Sáb 9h–18h', 'Todos os dias 9h–18h', '24h / 7 dias',
  ];

  protected readonly HORARIO_TEMPLATES = [
    { label: 'Semana comercial',   texto: 'Segunda a Sexta das 9h às 18h.\nSábado das 9h às 13h.\nDomingo e feriados: fechado.' },
    { label: 'Seg–Sex integral',   texto: 'Segunda a Sexta das 9h às 18h.\nSábado, Domingo e feriados: fechado.' },
    { label: 'Seg–Sáb integral',   texto: 'Segunda a Sábado das 9h às 18h.\nDomingo e feriados: fechado.' },
    { label: 'Todos os dias',      texto: 'Todos os dias das 9h às 18h.\nFeriados: horário pode variar.' },
    { label: '24 horas',           texto: 'Atendimento 24 horas, 7 dias por semana, incluindo feriados.' },
  ];

  protected readonly REDES_CHIPS: { rotulo: string; placeholder: string; cor: string; inicial: string; icon: UiIconName }[] = [
    { rotulo: 'Instagram',  placeholder: 'https://instagram.com/sua-loja',   cor: '#e1306c', inicial: 'In', icon: 'brand-instagram'  },
    { rotulo: 'Facebook',   placeholder: 'https://facebook.com/sua-loja',    cor: '#1877f2', inicial: 'Fb', icon: 'brand-facebook'    },
    { rotulo: 'WhatsApp',   placeholder: 'https://wa.me/5511999998888',       cor: '#25d366', inicial: 'Wa', icon: 'brand-whatsapp'    },
    { rotulo: 'TikTok',     placeholder: 'https://tiktok.com/@sua-loja',     cor: '#010101', inicial: 'Tk', icon: 'brand-tiktok'      },
    { rotulo: 'YouTube',    placeholder: 'https://youtube.com/@sua-loja',    cor: '#ff0000', inicial: 'Yt', icon: 'brand-youtube'     },
    { rotulo: 'Twitter/X',  placeholder: 'https://x.com/sua-loja',           cor: '#000000', inicial: 'X',  icon: 'brand-x'           },
    { rotulo: 'LinkedIn',   placeholder: 'https://linkedin.com/company/...',  cor: '#0a66c2', inicial: 'Li', icon: 'brand-linkedin'    },
    { rotulo: 'Pinterest',  placeholder: 'https://pinterest.com/sua-loja',   cor: '#e60023', inicial: 'Pi', icon: 'brand-pinterest'   },
    { rotulo: 'Telegram',   placeholder: 'https://t.me/sua-loja',            cor: '#2aabee', inicial: 'Tg', icon: 'brand-telegram'    },
  ];

  ngOnInit(): void { this.load(); }

  // ── Carregamento ───────────────────────────────────────────────────────────
  private load(): void {
    this.loading.set(true);
    this.configService.get().subscribe({
      next: (t) => { this.patchSignals(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private patchSignals(t: TenantApi): void {
    this.ativo.set(t.ativo);
    this.nomeLoja.set(t.nomeLoja ?? '');
    this.slug.set(t.slug ?? '');
    this.slogan.set(t.slogan ?? '');
    this.tituloDocumento.set(t.tituloDocumento ?? '');
    this.corPrimaria.set(t.corPrimaria ?? '#000000');
    this.corSecundaria.set(t.corSecundaria ?? '#000000');
    this.corDestaqueCatalogo.set(t.corDestaqueCatalogo ?? '#000000');
    this.whatsapp.set(t.whatsapp ?? '');
    this.telefoneContato.set(t.telefoneContato ?? '');
    this.emailContato.set(t.emailContato ?? '');
    this.cnpj.set(t.cnpj ?? '');
    this.nomeProprietario.set(t.nomeProprietario ?? '');
    this.enderecoLinha.set(t.enderecoLinha ?? '');
    this.mensagemTopo.set(t.mensagemTopo ?? '');
    this.corFundoTopo.set(t.corFundoTopo ?? '');
    this.politicaEntregaLinha.set(t.politicaEntregaLinha ?? '');
    this.horarioAtendimentoLinha.set(t.horarioAtendimentoLinha ?? '');
    this.horarioAtendimentoDetalhes.set(t.horarioAtendimentoDetalhes ?? '');
    this.textoLinkWhatsapp.set(t.rodape?.textoLinkWhatsapp ?? '');
    this.seloTitulo.set(t.rodape?.seloTitulo ?? '');
    this.seloSubtitulo.set(t.rodape?.seloSubtitulo ?? '');
    this.reclamacoesTexto.set(t.rodape?.reclamacoesTexto ?? '');
    this.reclamacoesUrl.set(t.rodape?.reclamacoesUrl ?? '');
    this.formasPagamento.set(t.rodape?.formasPagamento ?? []);
    this.redesPlaceholder.set(t.rodape?.redesPlaceholder ?? '');
    this.faixaInferior.set(t.rodape?.faixaInferior ?? '');
    this.redesSociais.set((t.rodape?.redesSociais ?? []).map((r) => ({ rotulo: r.rotulo, url: r.url })));
    this.savedLogoUrl    = t.logoUrl    ?? null;
    this.savedFaviconUrl = t.faviconUrl ?? null;
    this.savedBannerUrl  = t.bannerUrl  ?? null;
    this.logoPreview.set(this.savedLogoUrl);
    this.faviconPreview.set(this.savedFaviconUrl);
    this.bannerPreview.set(this.savedBannerUrl);
  }

  // ── Imagens ────────────────────────────────────────────────────────────────
  protected onLogoPicked(file: File): void    { this.logoFile    = file; }
  protected onFaviconPicked(file: File): void { this.faviconFile = file; }
  protected onBannerPicked(file: File): void  { this.bannerFile  = file; }

  protected onLogoRemoved(): void    { this.logoFile    = undefined; this.savedLogoUrl    = null; }
  protected onFaviconRemoved(): void { this.faviconFile = undefined; this.savedFaviconUrl = null; }
  protected onBannerRemoved(): void  { this.bannerFile  = undefined; this.savedBannerUrl  = null; }

  // ── Horários ───────────────────────────────────────────────────────────────
  protected appendHorarioChip(chip: string): void {
    const atual = this.horarioAtendimentoLinha().trim();
    this.horarioAtendimentoLinha.set(atual ? `${atual} · ${chip}` : chip);
  }

  protected applyHorarioTemplate(t: string): void { this.horarioAtendimentoDetalhes.set(t); }

  // ── Formas de pagamento ────────────────────────────────────────────────────
  protected toggleForma(forma: string): void {
    const cur = this.formasPagamento();
    this.formasPagamento.set(
      cur.includes(forma) ? cur.filter((f) => f !== forma) : [...cur, forma],
    );
  }
  protected hasForma(forma: string): boolean { return this.formasPagamento().includes(forma); }

  // ── Redes sociais ──────────────────────────────────────────────────────────
  protected redeChipJaAdicionada(rotulo: string): boolean {
    return this.redesSociais().some((r) => r.rotulo === rotulo);
  }

  protected addRedeByChip(chip: { rotulo: string }): void {
    if (this.redeChipJaAdicionada(chip.rotulo)) return;
    this.redesSociais.update((arr) => [...arr, { rotulo: chip.rotulo, url: '' }]);
  }

  protected addRede(): void {
    this.redesSociais.update((arr) => [...arr, { rotulo: '', url: '' }]);
  }

  protected removeRede(i: number): void {
    this.redesSociais.update((arr) => arr.filter((_, idx) => idx !== i));
  }

  protected updateRedeRotulo(i: number, ev: Event): void {
    const val = (ev.target as HTMLInputElement).value;
    this.redesSociais.update((arr) => arr.map((r, idx) => idx === i ? { ...r, rotulo: val } : r));
  }

  protected updateRedeUrl(i: number, ev: Event): void {
    const val = (ev.target as HTMLInputElement).value;
    this.redesSociais.update((arr) => arr.map((r, idx) => idx === i ? { ...r, url: val } : r));
  }

  protected chipParaRede(rotulo: string): { rotulo: string; placeholder: string; cor: string; inicial: string; icon: UiIconName } | undefined {
    return this.REDES_CHIPS.find((c) => c.rotulo === rotulo);
  }

  protected get redesLength(): number { return this.redesSociais().length; }

  // ── Validação de exibição ──────────────────────────────────────────────────
  protected invalidFields(): string[] {
    const fields: string[] = [];
    if (!this.nomeLoja().trim() || this.nomeLoja().length > 100) fields.push('Nome da loja');
    if (!this.slug().trim() || !/^[a-z0-9-]+$/.test(this.slug())) fields.push('Slug (URL)');
    this.redesSociais().forEach((r, i) => {
      if (!r.rotulo.trim()) fields.push(`Nome — Rede ${i + 1}`);
      if (!r.url.trim())    fields.push(`URL — ${r.rotulo || `Rede ${i + 1}`}`);
    });
    return fields;
  }

  // ── Salvar ─────────────────────────────────────────────────────────────────
  protected save(): void {
    this.submitted.set(true);
    if (!this.formValid() || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);

    const payload = {
      slug:                        this.slug().trim(),
      nomeLoja:                    this.nomeLoja().trim(),
      tituloDocumento:             this.tituloDocumento()             || null,
      logoUrl:                     this.savedLogoUrl,
      faviconUrl:                  this.savedFaviconUrl,
      bannerUrl:                   this.savedBannerUrl,
      corPrimaria:                 this.corPrimaria()                 || null,
      corSecundaria:               this.corSecundaria()               || null,
      corDestaqueCatalogo:         this.corDestaqueCatalogo()         || null,
      whatsapp:                    this.whatsapp()                    || null,
      slogan:                      this.slogan()                      || null,
      emailContato:                this.emailContato()                || null,
      telefoneContato:             this.telefoneContato()             || null,
      horarioAtendimentoLinha:     this.horarioAtendimentoLinha()     || null,
      horarioAtendimentoDetalhes:  this.horarioAtendimentoDetalhes()  || null,
      cnpj:                        this.cnpj()                        || null,
      nomeProprietario:            this.nomeProprietario()            || null,
      enderecoLinha:               this.enderecoLinha()               || null,
      mensagemTopo:                this.mensagemTopo()                || null,
      corFundoTopo:                this.corFundoTopo()                || null,
      politicaEntregaLinha:        this.politicaEntregaLinha()        || null,
      rodape: {
        textoLinkWhatsapp:  this.textoLinkWhatsapp()  || null,
        seloTitulo:         this.seloTitulo()         || null,
        seloSubtitulo:      this.seloSubtitulo()      || null,
        reclamacoesTexto:   this.reclamacoesTexto()   || null,
        reclamacoesUrl:     this.reclamacoesUrl()     || null,
        formasPagamento:    this.formasPagamento(),
        redesSociais:       this.redesSociais(),
        redesPlaceholder:   this.redesPlaceholder()   || null,
        faixaInferior:      this.faixaInferior()      || null,
      },
    };

    const files = { logo: this.logoFile, favicon: this.faviconFile, banner: this.bannerFile };
    this.logoFile = this.faviconFile = this.bannerFile = undefined;

    this.configService.update(payload, files).subscribe({
      next: (saved: TenantApi) => {
        this.saving.set(false);
        this.success.set(true);
        this.patchSignals(saved);
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (e: { error?: { error?: string }; message?: string }) => {
        this.saving.set(false);
        this.error.set(e?.error?.error ?? e?.message ?? 'Erro ao salvar configurações.');
      },
    });
  }
}
