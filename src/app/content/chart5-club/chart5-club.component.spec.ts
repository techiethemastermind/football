import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Chart5ClubComponent } from './chart5-club.component';

describe('Chart5ClubComponent', () => {
  let component: Chart5ClubComponent;
  let fixture: ComponentFixture<Chart5ClubComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Chart5ClubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Chart5ClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
