import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallPanelComponent } from './call-panel.component';

describe('CallPanelComponent', () => {
  let component: CallPanelComponent;
  let fixture: ComponentFixture<CallPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CallPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CallPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
