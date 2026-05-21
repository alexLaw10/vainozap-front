import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

import { ShellComponent } from './shell.component';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontCatalogUiService } from '../../services/storefront-catalog-ui.service';
import { StorefrontFiltersService } from '../../services/storefront-filters.service';

const catalogServiceMock = {
  load: () => {},
  listCategories: () => [],
  listProducts: () => [],
  loading: signal(false),
  getProduct: (_id: string) => of(null),
  isProductSoldOut: () => false,
};

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter([])],
    })
      .overrideComponent(ShellComponent, {
        set: {
          providers: [
            { provide: StorefrontCatalogService, useValue: catalogServiceMock },
            StorefrontCatalogUiService,
            StorefrontFiltersService,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
