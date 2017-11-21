import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Chart3ClubComponent } from './chart3-club.component';

describe('Chart3ClubComponent', () => {
  let component: Chart3ClubComponent;
  let fixture: ComponentFixture<Chart3ClubComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Chart3ClubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Chart3ClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
