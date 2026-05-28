import { Component, computed, input, model, OnDestroy } from '@angular/core';

import { IconComponent } from '../../primitives/icon/icon.component';

export interface MediaSlot {
  /** Saved URL (empty string when it is a new pending file) */
  url:     string;
  /** Non-null = pending upload */
  file:    File | null;
  /** Object URL (new file) or saved URL (existing) — use for <img>/<video> src */
  preview: string;
}

let _seq = 0;

@Component({
  selector: 'app-media-slots',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './media-slots.component.html',
  styleUrl: './media-slots.component.scss',
})
export class MediaSlotsComponent implements OnDestroy {
  /** 'image' renders <img> slots; 'video' renders <video> slots */
  readonly type     = input<'image' | 'video'>('image');
  readonly maxSlots = input(10);
  /** Override the file-picker accept string; defaults to sensible value for type */
  readonly accept   = input('');
  readonly label    = input('');

  /** Two-way binding — parent reads this to extract pending files and existing URLs */
  readonly slots = model<MediaSlot[]>([]);

  protected readonly _name = `ms-${++_seq}`;

  protected readonly allSlots = computed(() =>
    Array.from({ length: this.maxSlots() }, (_, i) => i),
  );
  protected readonly count        = computed(() => this.slots().length);
  protected readonly pendingCount = computed(() => this.slots().filter((s) => s.file !== null).length);

  protected slotAt(i: number): MediaSlot | null { return this.slots()[i] ?? null; }

  // ── File picking ───────────────────────────────────────────────────────────
  private get effectiveAccept(): string {
    return this.accept() || (
      this.type() === 'image'
        ? 'image/jpeg,image/png,image/webp,image/gif'
        : 'video/mp4,video/webm,video/quicktime,video/avi'
    );
  }

  protected openAdd(): void {
    if (this.count() >= this.maxSlots()) return;
    this.pickFile((file) => {
      const preview = URL.createObjectURL(file);
      this.slots.update((arr) => [...arr, { url: '', file, preview }]);
    });
  }

  protected openReplace(i: number): void {
    this.pickFile((file) => {
      const preview = URL.createObjectURL(file);
      this.slots.update((arr) => {
        const next = [...arr];
        const old  = next[i];
        if (old?.file) URL.revokeObjectURL(old.preview);
        next[i] = { url: '', file, preview };
        return next;
      });
    });
  }

  protected removeSlot(i: number, ev: Event): void {
    ev.stopPropagation();
    this.slots.update((arr) => {
      const next = [...arr];
      const old  = next[i];
      if (old?.file) URL.revokeObjectURL(old.preview);
      next.splice(i, 1);
      return next;
    });
  }

  private pickFile(cb: (f: File) => void): void {
    const inp    = document.createElement('input');
    inp.type     = 'file';
    inp.accept   = this.effectiveAccept;
    inp.onchange = () => { const f = inp.files?.[0]; if (f) cb(f); };
    inp.click();
  }

  ngOnDestroy(): void {
    this.slots().forEach((s) => { if (s.file) URL.revokeObjectURL(s.preview); });
  }
}
