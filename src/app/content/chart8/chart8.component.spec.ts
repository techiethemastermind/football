import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Chart8Component } from './chart8.component';

describe('Chart8Component', () => {
  let component: Chart8Component;
  let fixture: ComponentFixture<Chart8Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Chart8Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Chart8Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
