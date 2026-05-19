import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MerchantShellComponent } from './merchant-shell.component';

describe('MerchantShellComponent', () => {
  let fixture: ComponentFixture<MerchantShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantShellComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
