import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Chart7ClubComponent } from './chart7-club.component';

describe('Chart7ClubComponent', () => {
  let component: Chart7ClubComponent;
  let fixture: ComponentFixture<Chart7ClubComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Chart7ClubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Chart7ClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
