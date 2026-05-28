import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { stubVendasResumo } from '../../../../../testing/test-stubs';
import { MerchantVendasService } from '../../../services/merchant-vendas.service';
import { MerchantVendasPageComponent } from './merchant-vendas-page.component';

describe('MerchantVendasPageComponent', () => {
  let fixture: ComponentFixture<MerchantVendasPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantVendasPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), MerchantVendasService],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantVendasPageComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/merchant/vendas/resumo')).flush(stubVendasResumo());
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
