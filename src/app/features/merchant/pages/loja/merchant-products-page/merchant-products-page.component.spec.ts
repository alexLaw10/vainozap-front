import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { stubEmptyPage } from '../../../../../testing/test-stubs';
import { MerchantCatalogService } from '../../../services/merchant-catalog.service';
import { MerchantProductsPageComponent } from './merchant-products-page.component';

describe('MerchantProductsPageComponent', () => {
  let fixture: ComponentFixture<MerchantProductsPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantProductsPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MerchantCatalogService,
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MerchantProductsPageComponent);
    fixture.detectChanges();

    http.expectOne((r) => r.url.includes('/merchant/products')).flush(stubEmptyPage());
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
