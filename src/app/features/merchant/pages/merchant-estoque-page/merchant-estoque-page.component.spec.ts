import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { stubEmptyPage } from '../../../../testing/test-stubs';
import { MerchantCatalogService } from '../../services/merchant-catalog.service';
import { MerchantEstoquePageComponent } from './merchant-estoque-page.component';

describe('MerchantEstoquePageComponent', () => {
  let fixture: ComponentFixture<MerchantEstoquePageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantEstoquePageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), MerchantCatalogService],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantEstoquePageComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url.includes('/merchant/products') && r.params.get('size') === '200')
      .flush(stubEmptyPage());
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
