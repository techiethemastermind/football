import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Chart2ClubComponent } from './chart2-club.component';

describe('Chart2ClubComponent', () => {
  let component: Chart2ClubComponent;
  let fixture: ComponentFixture<Chart2ClubComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Chart2ClubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Chart2ClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
