import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Chart1ClubComponent } from './chart1-club.component';

describe('Chart1ClubComponent', () => {
  let component: Chart1ClubComponent;
  let fixture: ComponentFixture<Chart1ClubComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Chart1ClubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Chart1ClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
