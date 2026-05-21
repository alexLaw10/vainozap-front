import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

import { PRODUTOS_MOCK } from '../../../../mock/produtos.mock';
import { StorefrontCartService } from '../../services/storefront-cart.service';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { ProductCardComponent } from './product-card.component';

const catalogServiceMock = {
  load: () => {},
  listCategories: () => [],
  listProducts: () => [],
  loading: signal(false),
  getProduct: (_id: string) => of(null),
  isProductSoldOut: () => false,
};

describe('ProductCardComponent', () => {
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        { provide: StorefrontCatalogService, useValue: catalogServiceMock },
        StorefrontCartService,
        StorefrontContextService,
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', PRODUTOS_MOCK[0]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
