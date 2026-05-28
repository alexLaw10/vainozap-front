import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { stubTenantApi } from '../../../../../testing/test-stubs';
import { MerchantConfigService } from '../../../services/merchant-config.service';
import { MerchantConfigurarPageComponent } from './merchant-configurar-page.component';

describe('MerchantConfigurarPageComponent', () => {
  let fixture: ComponentFixture<MerchantConfigurarPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantConfigurarPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), MerchantConfigService],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantConfigurarPageComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/merchant/settings')).flush(stubTenantApi());
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
