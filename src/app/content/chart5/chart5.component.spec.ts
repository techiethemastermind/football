import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Chart5Component } from './chart5.component';

describe('Chart5Component', () => {
  let component: Chart5Component;
  let fixture: ComponentFixture<Chart5Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Chart5Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Chart5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
