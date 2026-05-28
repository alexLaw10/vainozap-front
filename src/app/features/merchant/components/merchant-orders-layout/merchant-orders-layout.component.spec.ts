import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MerchantOrdersLayoutComponent } from './merchant-orders-layout.component';

describe('MerchantOrdersLayoutComponent', () => {
  let fixture: ComponentFixture<MerchantOrdersLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantOrdersLayoutComponent],
      providers: [provideRouter([{ path: '**', component: MerchantOrdersLayoutComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantOrdersLayoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
