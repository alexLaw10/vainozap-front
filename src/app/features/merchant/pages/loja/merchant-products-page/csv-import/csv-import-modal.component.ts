import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';

import { ButtonComponent, IconComponent } from '@app/shared/ui';
import { ToastService } from '@app/shared/ui/feedback/toast/toast.service';
import { MerchantCatalogService } from '../../../../services/merchant-catalog.service';
import {
  type CsvRow,
  downloadCsvTemplate,
  parseCsvProducts,
} from '../../../../utils/csv-product-parser.util';
import type { CategoriaApi } from '../../../../../../core/models/catalog-api.model';

type ImportState = 'idle' | 'preview' | 'importing' | 'done';

@Component({
  selector: 'app-csv-import-modal',
  standalone: true,
  imports: [IconComponent, ButtonComponent],
  templateUrl: './csv-import-modal.component.html',
  styleUrl:    './csv-import-modal.component.scss',
})
export class CsvImportModalComponent implements OnInit {
  private readonly catalog = inject(MerchantCatalogService);
  private readonly toast   = inject(ToastService);

  readonly open = input.required<boolean>();

  readonly close   = output<void>();
  /** Emitido após importação concluída com pelo menos 1 sucesso. */
  readonly imported = output<number>();

  protected readonly state        = signal<ImportState>('idle');
  protected readonly categories   = signal<CategoriaApi[]>([]);
  protected readonly rows         = signal<CsvRow[]>([]);
  protected readonly fileName     = signal('');
  protected readonly dragOver     = signal(false);

  /** Progresso durante a importação */
  protected readonly importTotal    = signal(0);
  protected readonly importDone     = signal(0);
  protected readonly importErrors   = signal(0);
  protected readonly importMessages = signal<string[]>([]);

  protected readonly validRows   = computed(() => this.rows().filter(r => r.errors.length === 0));
  protected readonly invalidRows = computed(() => this.rows().filter(r => r.errors.length > 0));
  /** Linhas válidas que tiveram algum campo ignorado (ex.: categoria desconhecida). */
  protected readonly warnRows    = computed(() => this.rows().filter(r => r.errors.length === 0 && r.warnings.length > 0));

  /** Mapa nome/slug → categoryId para lookup durante o parse */
  private categoryMap = new Map<string, string | null>();

  ngOnInit(): void {
    this.catalog.listCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.categoryMap = new Map(cats.flatMap(c => [
          [c.nome,  c.id ?? null],
          [c.slug,  c.id ?? null],
        ]));
      },
    });
  }

  // ── Template download ─────────────────────────────────────────────────────

  protected downloadTemplate(): void {
    downloadCsvTemplate();
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  protected onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    this.dragOver.set(true);
  }

  protected onDragLeave(): void { this.dragOver.set(false); }

  protected onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dragOver.set(false);
    const file = ev.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  protected onFileInput(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
    (ev.target as HTMLInputElement).value = '';
  }

  // ── Processamento ─────────────────────────────────────────────────────────

  private processFile(file: File): void {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('Por favor, envie um arquivo .csv');
      return;
    }
    this.fileName.set(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string ?? '';
      const parsed = parseCsvProducts(text, this.categoryMap);
      this.rows.set(parsed.rows);
      this.state.set('preview');

      if (parsed.warnCount > 0) {
        this.toast.show({
          message: `${parsed.warnCount} produto${parsed.warnCount !== 1 ? 's' : ''} com categoria desconhecida — será${parsed.warnCount !== 1 ? 'ão' : ''} importado${parsed.warnCount !== 1 ? 's' : ''} sem categoria.`,
          duration: 6000,
        });
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  // ── Importação ────────────────────────────────────────────────────────────

  protected async startImport(): Promise<void> {
    const valid = this.validRows();
    if (!valid.length) return;

    this.state.set('importing');
    this.importTotal.set(valid.length);
    this.importDone.set(0);
    this.importErrors.set(0);
    this.importMessages.set([]);

    let successCount = 0;

    for (const row of valid) {
      if (!row.data) continue;
      try {
        await this.catalog.createProduct(row.data, [], []).toPromise();
        successCount++;
      } catch {
        this.importErrors.update(n => n + 1);
        this.importMessages.update(msgs => [
          ...msgs,
          `Linha ${row.line} (${row.raw['nome']}): erro ao salvar`,
        ]);
      }
      this.importDone.update(n => n + 1);
    }

    this.state.set('done');
    if (successCount > 0) this.imported.emit(successCount);
  }

  protected get progressPercent(): number {
    const total = this.importTotal();
    return total > 0 ? Math.round((this.importDone() / total) * 100) : 0;
  }

  // ── Reset / fechar ────────────────────────────────────────────────────────

  protected reset(): void {
    this.state.set('idle');
    this.rows.set([]);
    this.fileName.set('');
  }

  protected fechar(): void {
    this.reset();
    this.close.emit();
  }
}
