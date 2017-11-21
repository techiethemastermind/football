import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Chart6ClubComponent } from './chart6-club.component';

describe('Chart6ClubComponent', () => {
  let component: Chart6ClubComponent;
  let fixture: ComponentFixture<Chart6ClubComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Chart6ClubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Chart6ClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
