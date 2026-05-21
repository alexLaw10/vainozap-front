import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { ProductPageComponent } from './product-page.component';

const catalogServiceMock = {
  load: () => {},
  listCategories: () => [],
  listProducts: () => [],
  loading: signal(false),
  getProduct: (_id: string) => of(null),
  isProductSoldOut: () => false,
};

describe('ProductPageComponent', () => {
  let fixture: ComponentFixture<ProductPageComponent>;

  beforeEach(async () => {
    const pm = convertToParamMap({ productId: '1' });
    await TestBed.configureTestingModule({
      imports: [ProductPageComponent],
      providers: [
        provideRouter([]),
        { provide: StorefrontCatalogService, useValue: catalogServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(pm).asObservable(),
            snapshot: { paramMap: pm },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPageComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
