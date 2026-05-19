import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorefrontContextService } from '../../services/storefront-context.service';
import { FloatingStoreActionsComponent } from './floating-store-actions.component';

describe('FloatingStoreActionsComponent', () => {
  let fixture: ComponentFixture<FloatingStoreActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingStoreActionsComponent],
      providers: [StorefrontContextService],
    }).compileComponents();

    fixture = TestBed.createComponent(FloatingStoreActionsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
