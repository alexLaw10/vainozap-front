import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MerchantConfigService } from '../../../services/merchant-config.service';
import { MerchantContextService } from '../../../services/merchant-context.service';
import { MerchantDashboardPageComponent } from './merchant-dashboard-page.component';

describe('MerchantDashboardPageComponent', () => {
  let fixture: ComponentFixture<MerchantDashboardPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantDashboardPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MerchantConfigService,
        MerchantContextService,
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MerchantDashboardPageComponent);
    fixture.detectChanges();

    // Resumo do dashboard
    http.expectOne((r) => r.url.includes('/dashboard/resumo')).flush({
      pedidosHoje: 0,
      pedidosPendentes: 0,
      vendasMes: 0,
    });
    // Checagem de produtos para o onboarding progress
    http.expectOne((r) => r.url.includes('/merchant/products')).flush({
      content: [], totalElements: 0, totalPages: 0, number: 0, size: 1,
    });
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
