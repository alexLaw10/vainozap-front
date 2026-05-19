import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MerchantOrdersPageComponent } from './merchant-orders-page.component';

describe('MerchantOrdersPageComponent', () => {
  let fixture: ComponentFixture<MerchantOrdersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantOrdersPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantOrdersPageComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
