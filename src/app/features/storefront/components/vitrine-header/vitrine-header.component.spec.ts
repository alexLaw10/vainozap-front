import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

import { StorefrontCartService } from '../../services/storefront-cart.service';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontCatalogUiService } from '../../services/storefront-catalog-ui.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontFiltersService } from '../../services/storefront-filters.service';
import { VitrineHeaderComponent } from './vitrine-header.component';

const catalogServiceMock = {
  load: () => {},
  listCategories: () => [],
  listProducts: () => [],
  loading: signal(false),
  getProduct: (_id: string) => of(null),
  isProductSoldOut: () => false,
};

describe('VitrineHeaderComponent', () => {
  let fixture: ComponentFixture<VitrineHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VitrineHeaderComponent],
      providers: [
        StorefrontContextService,
        StorefrontCartService,
        { provide: StorefrontCatalogService, useValue: catalogServiceMock },
        StorefrontCatalogUiService,
        StorefrontFiltersService,
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VitrineHeaderComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
