import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontFiltersService } from '../../services/storefront-filters.service';
import { VitrineFooterComponent } from './vitrine-footer.component';

describe('VitrineFooterComponent', () => {
  let fixture: ComponentFixture<VitrineFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VitrineFooterComponent],
      providers: [StorefrontContextService, StorefrontFiltersService, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(VitrineFooterComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
