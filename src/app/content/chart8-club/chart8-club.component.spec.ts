import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Chart8ClubComponent } from './chart8-club.component';

describe('Chart8ClubComponent', () => {
  let component: Chart8ClubComponent;
  let fixture: ComponentFixture<Chart8ClubComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Chart8ClubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Chart8ClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
