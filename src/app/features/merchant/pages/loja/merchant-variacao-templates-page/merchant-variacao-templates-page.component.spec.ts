import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantCatalogService } from '../../../services/merchant-catalog.service';
import { MerchantVariacaoTemplatesPageComponent } from './merchant-variacao-templates-page.component';

describe('MerchantVariacaoTemplatesPageComponent', () => {
  let fixture: ComponentFixture<MerchantVariacaoTemplatesPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantVariacaoTemplatesPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), MerchantCatalogService],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantVariacaoTemplatesPageComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/variacao-templates')).flush([]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
