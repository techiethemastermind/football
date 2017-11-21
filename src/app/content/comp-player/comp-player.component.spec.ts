import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompPlayerComponent } from './comp-player.component';

describe('CompPlayerComponent', () => {
  let component: CompPlayerComponent;
  let fixture: ComponentFixture<CompPlayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompPlayerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
