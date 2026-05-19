import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantCatalogService } from '../../services/merchant-catalog.service';
import { MerchantCategoriesPageComponent } from './merchant-categories-page.component';

describe('MerchantCategoriesPageComponent', () => {
  let fixture: ComponentFixture<MerchantCategoriesPageComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantCategoriesPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), MerchantCatalogService],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantCategoriesPageComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/merchant/categories')).flush([]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
