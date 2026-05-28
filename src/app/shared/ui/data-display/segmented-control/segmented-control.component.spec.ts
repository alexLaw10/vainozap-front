import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SegmentedControlComponent } from './segmented-control.component';

describe('SegmentedControlComponent', () => {
  let fixture: ComponentFixture<SegmentedControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SegmentedControlComponent] }).compileComponents();
    fixture = TestBed.createComponent(SegmentedControlComponent);
    fixture.componentRef.setInput('options', [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    fixture.componentRef.setInput('value', 'a');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
