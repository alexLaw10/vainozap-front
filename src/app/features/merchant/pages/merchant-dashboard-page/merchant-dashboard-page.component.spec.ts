import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MerchantConfigService } from '../../services/merchant-config.service';
import { MerchantContextService } from '../../services/merchant-context.service';
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

    // MerchantContextService lê o contexto do JWT — sem chamada HTTP para /settings.
    // Somente o resumo do dashboard é carregado nesta página.
    http.expectOne((r) => r.url.includes('/dashboard/resumo')).flush({
      pedidosHoje: 0,
      pedidosPendentes: 0,
      vendasMes: 0,
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
