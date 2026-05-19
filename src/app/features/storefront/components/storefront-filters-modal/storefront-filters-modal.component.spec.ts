import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorefrontFiltersService } from '../../services/storefront-filters.service';
import { StorefrontFiltersModalComponent } from './storefront-filters-modal.component';

describe('StorefrontFiltersModalComponent', () => {
  let fixture: ComponentFixture<StorefrontFiltersModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorefrontFiltersModalComponent],
      providers: [StorefrontFiltersService],
    }).compileComponents();

    fixture = TestBed.createComponent(StorefrontFiltersModalComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
