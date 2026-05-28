import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { stubTenantApi } from '../../../../../testing/test-stubs';
import { MerchantConfigService } from '../../../services/merchant-config.service';
import { MerchantContextService } from '../../../services/merchant-context.service';
import { MerchantVitrinePageComponent } from './merchant-vitrine-page.component';

describe('MerchantVitrinePageComponent', () => {
  let fixture: ComponentFixture<MerchantVitrinePageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantVitrinePageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MerchantConfigService,
        MerchantContextService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantVitrinePageComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne((r) => r.url.includes('/merchant/settings')).flush(stubTenantApi());
    fixture.detectChanges();

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
