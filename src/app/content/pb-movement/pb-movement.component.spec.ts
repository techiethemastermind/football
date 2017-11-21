import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PbMovementComponent } from './pb-movement.component';

describe('PbMovementComponent', () => {
  let component: PbMovementComponent;
  let fixture: ComponentFixture<PbMovementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PbMovementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PbMovementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
