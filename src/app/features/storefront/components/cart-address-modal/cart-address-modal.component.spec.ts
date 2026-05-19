import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartAddressModalComponent } from './cart-address-modal.component';

describe('CartAddressModalComponent', () => {
  let fixture: ComponentFixture<CartAddressModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartAddressModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(CartAddressModalComponent);
    fixture.componentRef.setInput('corPrimaria', '#111111');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
