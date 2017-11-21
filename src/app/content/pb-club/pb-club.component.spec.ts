import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PbClubComponent } from './pb-club.component';

describe('PbClubComponent', () => {
  let component: PbClubComponent;
  let fixture: ComponentFixture<PbClubComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PbClubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PbClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
