import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CartOrderSummaryComponent } from './cart-order-summary.component';

describe('CartOrderSummaryComponent', () => {
  let fixture: ComponentFixture<CartOrderSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartOrderSummaryComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(CartOrderSummaryComponent);
    fixture.componentRef.setInput('entrega', 'loja');
    fixture.componentRef.setInput('observacoes', '');
    fixture.componentRef.setInput('podeFinalizar', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
