import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MerchantPlaceholderPageComponent } from './merchant-placeholder-page.component';

describe('MerchantPlaceholderPageComponent', () => {
  let fixture: ComponentFixture<MerchantPlaceholderPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantPlaceholderPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { data: of({ sectionTitle: 'Teste', sectionLead: '', backLink: null }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantPlaceholderPageComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
