import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartShareModalComponent } from './cart-share-modal.component';

describe('CartShareModalComponent', () => {
  let fixture: ComponentFixture<CartShareModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartShareModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(CartShareModalComponent);
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
