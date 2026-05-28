import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';

import { stubPedidoApi } from '../../../../../testing/test-stubs';
import { MerchantOrdersService } from '../../../services/merchant-orders.service';
import { MerchantOrderDetailPageComponent } from './merchant-order-detail-page.component';

describe('MerchantOrderDetailPageComponent', () => {
  let fixture: ComponentFixture<MerchantOrderDetailPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantOrderDetailPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MerchantOrdersService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (k: string) => (k === 'id' ? 'ped-1' : null) } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantOrderDetailPageComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/merchant/orders/ped-1')).flush(stubPedidoApi());
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
