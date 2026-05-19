import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartLineMenuComponent } from './cart-line-menu.component';

describe('CartLineMenuComponent', () => {
  let fixture: ComponentFixture<CartLineMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartLineMenuComponent] }).compileComponents();
    fixture = TestBed.createComponent(CartLineMenuComponent);
    fixture.componentRef.setInput('line', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
