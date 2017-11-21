import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchStComponent } from './match-st.component';

describe('MatchStComponent', () => {
  let component: MatchStComponent;
  let fixture: ComponentFixture<MatchStComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MatchStComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatchStComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
