import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { StorefrontCartService } from '../../services/storefront-cart.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { CartPageComponent } from './cart-page.component';

describe('CartPageComponent', () => {
  let fixture: ComponentFixture<CartPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [provideRouter([]), StorefrontCartService, StorefrontContextService],
    }).compileComponents();

    fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
