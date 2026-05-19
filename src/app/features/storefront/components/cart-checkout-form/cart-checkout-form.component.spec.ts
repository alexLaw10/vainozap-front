import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartCheckoutFormComponent } from './cart-checkout-form.component';

describe('CartCheckoutFormComponent', () => {
  let fixture: ComponentFixture<CartCheckoutFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartCheckoutFormComponent] }).compileComponents();
    fixture = TestBed.createComponent(CartCheckoutFormComponent);
    fixture.componentRef.setInput('corSecundaria', '#222222');
    fixture.componentRef.setInput('nome', '');
    fixture.componentRef.setInput('cpfCnpj', '');
    fixture.componentRef.setInput('telefone', '');
    fixture.componentRef.setInput('formaPagamento', 'PIX');
    fixture.componentRef.setInput('cartTrocoPara', '');
    fixture.componentRef.setInput('cartModoCartao', 'presencial');
    fixture.componentRef.setInput('cartParcelas', '1');
    fixture.componentRef.setInput('cartBandeira', '');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
