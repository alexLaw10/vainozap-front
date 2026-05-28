import { Component, input, output } from '@angular/core';
import { IconComponent } from '@app/shared/ui';

@Component({
  selector: 'app-cart-share-modal',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './cart-share-modal.component.html',
  styleUrl: './cart-share-modal.component.scss',
})
export class CartShareModalComponent {
  open = input(false);

  close = output<void>();
  shareWhatsApp = output<void>();
  shareFacebook = output<void>();
  shareTelegram = output<void>();
  copyLink = output<void>();

  protected fechar(): void {
    this.close.emit();
  }
}
