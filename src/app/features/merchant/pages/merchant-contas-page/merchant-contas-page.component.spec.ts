import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { stubTenantApi } from '../../../../testing/test-stubs';
import { MerchantConfigService } from '../../services/merchant-config.service';
import { MerchantContextService } from '../../services/merchant-context.service';
import { MerchantContasPageComponent } from './merchant-contas-page.component';

describe('MerchantContasPageComponent', () => {
  let fixture: ComponentFixture<MerchantContasPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantContasPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MerchantConfigService,
        MerchantContextService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantContasPageComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne((r) => r.url.includes('/merchant/settings')).flush(stubTenantApi());
    http.expectOne((r) => r.url.includes('/merchant/me')).flush({
      email: 'a@b.com',
      nomeProprietario: 'Nome',
      telefone: null,
      planoTipo: 'FREE',
      trialEndsAt: null,
    });
    http.expectOne((r) => r.url.includes('/merchant/my-stores')).flush([]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
