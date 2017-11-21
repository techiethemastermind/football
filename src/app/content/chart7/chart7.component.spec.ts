import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Chart7Component } from './chart7.component';

describe('Chart7Component', () => {
  let component: Chart7Component;
  let fixture: ComponentFixture<Chart7Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Chart7Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Chart7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
