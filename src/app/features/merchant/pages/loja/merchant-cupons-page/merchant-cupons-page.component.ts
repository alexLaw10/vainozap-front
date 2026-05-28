import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

import {
  ButtonComponent,
  ConfirmDialogComponent,
  IconComponent,
  InputComponent,
  ModalComponent,
  PageHeaderComponent,
  SelectComponent,
  TableComponent,
  ToastService,
  ToggleComponent,
  type SelectOption,
  type TableColumn,
} from '@app/shared/ui';
import { MerchantCouponService, type CupomDto } from '../../../services/merchant-coupon.service';

@Component({
  selector: 'app-merchant-cupons-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    TableComponent,
    ButtonComponent,
    ConfirmDialogComponent,
    IconComponent,
    InputComponent,
    ModalComponent,
    PageHeaderComponent,
    SelectComponent,
    ToggleComponent,
  ],
  templateUrl: './merchant-cupons-page.component.html',
  styleUrl: './merchant-cupons-page.component.scss',
})
export class MerchantCuponsPageComponent implements OnInit {
  private readonly service = inject(MerchantCouponService);
  private readonly toast   = inject(ToastService);

  // ── Colunas da tabela ──────────────────────────────────────────────────────
  protected readonly columns: TableColumn[] = [
    { key: 'codigo',             header: 'Código' },
    { key: 'desconto',           header: 'Desconto',       custom: true },
    { key: 'valorMinimoPedido',  header: 'Pedido mínimo',  custom: true, hideOnMobile: true },
    { key: 'usos',               header: 'Usos',           custom: true, hideOnMobile: true },
    { key: 'dataExpiracao',      header: 'Expira em',      custom: true, hideOnMobile: true },
    { key: 'ativo',              header: 'Ativo',          custom: true },
    { key: 'acoes',              header: 'Ações',          custom: true, width: 'actions' },
  ];

  // ── Lista ──────────────────────────────────────────────────────────────────
  protected readonly cupons  = signal<CupomDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error   = signal<string | null>(null);

  // ── Modal ──────────────────────────────────────────────────────────────────
  protected readonly modalOpen  = signal(false);
  protected readonly editingId  = signal<string | null>(null);
  protected readonly saving     = signal(false);
  protected readonly submitted  = signal(false);

  // ── Campos do formulário (signal forms, sem FormsModule) ───────────────────
  protected readonly codigo             = signal('');
  protected readonly tipo               = signal<'PERCENTUAL' | 'VALOR_FIXO'>('PERCENTUAL');
  protected readonly valor              = signal('');
  protected readonly valorMinimoPedido  = signal('');
  protected readonly limiteUsos         = signal('');
  protected readonly dataExpiracao      = signal('');
  protected readonly ativo              = signal(true);

  // ── Opções do select de tipo ───────────────────────────────────────────────
  protected readonly tipoOptions: SelectOption[] = [
    { label: 'Percentual (%)',   value: 'PERCENTUAL' },
    { label: 'Valor fixo (R$)', value: 'VALOR_FIXO' },
  ];

  // ── Confirm delete ─────────────────────────────────────────────────────────
  protected readonly confirmDeleteId = signal<string | null>(null);

  // ── Validação ─────────────────────────────────────────────────────────────
  protected readonly codigoError = computed(() => {
    if (!this.submitted()) return '';
    return this.codigo().trim() ? '' : 'Código obrigatório';
  });

  protected readonly valorError = computed(() => {
    if (!this.submitted()) return '';
    const v = parseFloat(this.valor());
    if (isNaN(v) || v <= 0) return 'Informe um valor maior que zero';
    if (this.tipo() === 'PERCENTUAL' && v > 100) return 'Percentual máximo é 100';
    return '';
  });

  protected readonly formValid = computed(() => {
    const v = parseFloat(this.valor());
    return (
      !!this.codigo().trim() &&
      !isNaN(v) && v > 0 &&
      !(this.tipo() === 'PERCENTUAL' && v > 100)
    );
  });

  ngOnInit(): void { this.load(); }

  // ── Carregamento ───────────────────────────────────────────────────────────
  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listar().subscribe({
      next:  (list) => { this.cupons.set(list); this.loading.set(false); },
      error: (e)    => { this.error.set(e?.error?.detail ?? 'Erro ao carregar cupons.'); this.loading.set(false); },
    });
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  protected openCreate(): void {
    this.editingId.set(null);
    this.submitted.set(false);
    this.codigo.set('');
    this.tipo.set('PERCENTUAL');
    this.valor.set('');
    this.valorMinimoPedido.set('');
    this.limiteUsos.set('');
    this.dataExpiracao.set('');
    this.ativo.set(true);
    this.modalOpen.set(true);
  }

  protected openEdit(c: CupomDto): void {
    this.editingId.set(c.id ?? null);
    this.submitted.set(false);
    this.codigo.set(c.codigo);
    this.tipo.set(c.tipo);
    this.valor.set(String(c.valor));
    this.valorMinimoPedido.set(c.valorMinimoPedido != null ? String(c.valorMinimoPedido) : '');
    this.limiteUsos.set(c.limiteUsos != null ? String(c.limiteUsos) : '');
    this.dataExpiracao.set(c.dataExpiracao ? this.toDatetimeLocal(c.dataExpiracao) : '');
    this.ativo.set(c.ativo);
    this.modalOpen.set(true);
  }

  protected closeModal(): void { this.modalOpen.set(false); }

  // ── Salvar ─────────────────────────────────────────────────────────────────
  protected save(): void {
    this.submitted.set(true);
    if (!this.formValid() || this.saving()) return;

    const payload: CupomDto = {
      codigo:            this.codigo().trim().toUpperCase(),
      tipo:              this.tipo(),
      valor:             parseFloat(this.valor()),
      valorMinimoPedido: this.valorMinimoPedido() ? parseFloat(this.valorMinimoPedido()) : null,
      limiteUsos:        this.limiteUsos() ? parseInt(this.limiteUsos(), 10) : null,
      dataExpiracao:     this.dataExpiracao() ? new Date(this.dataExpiracao()).toISOString() : null,
      ativo:             this.ativo(),
    };

    const id = this.editingId();
    this.saving.set(true);
    const req$ = id ? this.service.atualizar(id, payload) : this.service.criar(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.load();
        this.toast.show({ message: id ? 'Cupom atualizado!' : 'Cupom criado!' });
      },
      error: (e) => {
        this.saving.set(false);
        const msg = e?.error?.detail ?? e?.error?.message ?? 'Erro ao salvar cupom.';
        this.error.set(msg);
      },
    });
  }

  // ── Ativar / desativar ─────────────────────────────────────────────────────
  protected toggleAtivo(c: CupomDto): void {
    if (!c.id) return;
    this.service.atualizar(c.id, { ...c, ativo: !c.ativo }).subscribe({
      next:  () => this.load(),
      error: () => this.toast.show({ message: 'Erro ao atualizar cupom.' }),
    });
  }

  // ── Deletar ────────────────────────────────────────────────────────────────
  protected askDelete(id: string): void    { this.confirmDeleteId.set(id); }
  protected cancelDelete(): void           { this.confirmDeleteId.set(null); }

  protected confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.service.deletar(id).subscribe({
      next:  () => { this.confirmDeleteId.set(null); this.load(); this.toast.show({ message: 'Cupom excluído.' }); },
      error: () => { this.confirmDeleteId.set(null); this.toast.show({ message: 'Erro ao excluir.' }); },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Formata ISO string para valor aceito pelo input[type=datetime-local] */
  private toDatetimeLocal(iso: string): string {
    return iso.slice(0, 16); // "YYYY-MM-DDTHH:MM"
  }

  protected descontoLabel(c: CupomDto): string {
    return c.tipo === 'PERCENTUAL'
      ? `${c.valor}% off`
      : `R$ ${c.valor.toFixed(2).replace('.', ',')} off`;
  }
}
