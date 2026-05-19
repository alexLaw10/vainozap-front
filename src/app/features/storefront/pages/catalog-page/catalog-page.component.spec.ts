import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontCatalogUiService } from '../../services/storefront-catalog-ui.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontFiltersService } from '../../services/storefront-filters.service';
import { CatalogPageComponent } from './catalog-page.component';

describe('CatalogPageComponent', () => {
  let fixture: ComponentFixture<CatalogPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        StorefrontContextService,
        StorefrontCatalogService,
        StorefrontCatalogUiService,
        StorefrontFiltersService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogPageComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    TestBed.inject(StorefrontCatalogService).load();
    http.expectOne((r) => r.url.includes('/storefront/categories')).flush([]);
    http.expectOne((r) => r.url.includes('/storefront/products')).flush([]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
