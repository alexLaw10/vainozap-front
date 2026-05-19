import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { ProductPageComponent } from './product-page.component';

describe('ProductPageComponent', () => {
  let fixture: ComponentFixture<ProductPageComponent>;

  beforeEach(async () => {
    const pm = convertToParamMap({ productId: '1' });
    await TestBed.configureTestingModule({
      imports: [ProductPageComponent],
      providers: [
        provideRouter([]),
        StorefrontCatalogService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new BehaviorSubject(pm).asObservable(),
            snapshot: { paramMap: pm },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPageComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
