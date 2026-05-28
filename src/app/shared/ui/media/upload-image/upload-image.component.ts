import { Component, input, model, OnDestroy, output } from '@angular/core';

let _seq = 0;

@Component({
  selector: 'app-upload-image',
  standalone: true,
  imports: [],
  templateUrl: './upload-image.component.html',
  styleUrl: './upload-image.component.scss',
})
export class UploadImageComponent implements OnDestroy {
  readonly label       = input('');
  readonly hint        = input('');
  readonly accept      = input('image/jpeg,image/png,image/webp');
  /** 'square' → compact slot (logo/favicon); 'wide' → banner strip */
  readonly aspect      = input<'square' | 'wide'>('square');
  readonly placeholder = input('Adicionar imagem');
  readonly disabled    = input(false);

  /** Current preview URL — initialise with a saved URL; updated on pick/remove */
  readonly preview = model<string | null>(null);

  readonly filePicked = output<File>();
  readonly removed    = output<void>();

  protected readonly _uid = `ui-upload-${++_seq}`;
  private _objectUrl: string | null = null;

  ngOnDestroy(): void {
    if (this._objectUrl) URL.revokeObjectURL(this._objectUrl);
  }

  protected pick(): void {
    if (this.disabled()) return;
    const inp = document.createElement('input');
    inp.type   = 'file';
    inp.accept = this.accept();
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) return;
      if (this._objectUrl) URL.revokeObjectURL(this._objectUrl);
      this._objectUrl = URL.createObjectURL(f);
      this.preview.set(this._objectUrl);
      this.filePicked.emit(f);
    };
    inp.click();
  }

  protected remove(ev: Event): void {
    ev.stopPropagation();
    if (this._objectUrl) { URL.revokeObjectURL(this._objectUrl); this._objectUrl = null; }
    this.preview.set(null);
    this.removed.emit();
  }
}
