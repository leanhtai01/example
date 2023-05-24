import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiExpansionSelectComponent } from './multi-expansion-select.component';

describe('MultiExpansionSelectComponent', () => {
  let component: MultiExpansionSelectComponent;
  let fixture: ComponentFixture<MultiExpansionSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MultiExpansionSelectComponent]
    });
    fixture = TestBed.createComponent(MultiExpansionSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
