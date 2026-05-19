import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartOrderConfirmModalComponent } from './cart-order-confirm-modal.component';

describe('CartOrderConfirmModalComponent', () => {
  let fixture: ComponentFixture<CartOrderConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartOrderConfirmModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(CartOrderConfirmModalComponent);
    fixture.componentRef.setInput('snap', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
