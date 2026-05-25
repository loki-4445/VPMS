import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationsComponent } from './reservations.component';

/**
 * ──────────────────────────────────────────────────────────────────────────
 * ReservationsComponent Tests
 *
 * What we test:
 *  1. Component renders
 *  2. Signals start at correct initial values
 *  3. openAdd() resets form and opens modal
 *  4. openEdit() populates form with existing reservation data
 *  5. minDateTime always returns a string in correct format
 *  6. validateStartTime() sets / clears startTimeError signal
 *  7. Custom confirm dialog — showConfirm, confirmYes, confirmNo
 *  8. filtered getter — filters by status and vehicle number
 *  9. statusBadge() returns correct CSS class string
 * ──────────────────────────────────────────────────────────────────────────
 */
describe('ReservationsComponent', () => {
  let component: ReservationsComponent;
  let fixture: ComponentFixture<ReservationsComponent>;

  // Minimal fake reservation object
  const fakeReservation = {
    id: 999,
    vehicleNumber: 'TN01AB1234',
    slotId: 5,
    slotType: '2W' as '2W' | '4W',
    userId: 1,
    userName: 'Test User',
    startTime: '2026-12-01T10:00',
    endTime: null,
    status: 'CONFIRMED'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReservationsComponent,
        FormsModule
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationsComponent);
    component = fixture.componentInstance;
    // Do NOT call detectChanges() here to avoid triggering ngOnInit HTTP call
  });

  // ── 1. Component created 
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── 2. Initial signal values 
  it('showModal signal should start as false', () => {
    expect(component.showModal()).toBeFalse();
  });

  it('editMode signal should start as false', () => {
    expect(component.editMode()).toBeFalse();
  });

  it('saving signal should start as false', () => {
    expect(component.saving()).toBeFalse();
  });

  it('error signal should start as empty string', () => {
    expect(component.error()).toBe('');
  });

  it('startTimeError signal should start as empty string', () => {
    expect(component.startTimeError()).toBe('');
  });

  it('confirmVisible signal should start as false', () => {
    expect(component.confirmVisible()).toBeFalse();
  });

  // ── 3. openAdd() resets form and opens modal 
  it('openAdd() should open modal and set editMode to false', () => {
    // stub slot loading to prevent real HTTP call
    spyOn(component, 'loadAvailableSlots').and.stub();

    component.openAdd();

    expect(component.showModal()).toBeTrue();
    expect(component.editMode()).toBeFalse();
  });

  it('openAdd() should reset form fields to empty values', () => {
    spyOn(component, 'loadAvailableSlots').and.stub();

    component.form.vehicleNumber = 'OLD_VALUE';
    component.openAdd();

    expect(component.form.vehicleNumber).toBe('');
    expect(component.form.startTime).toBe('');
    expect(component.form.slotId).toBe(0);
  });

  it('openAdd() should clear error and startTimeError signals', () => {
    spyOn(component, 'loadAvailableSlots').and.stub();
    component.error.set('old error');
    component.startTimeError.set('old time error');

    component.openAdd();

    expect(component.error()).toBe('');
    expect(component.startTimeError()).toBe('');
  });

  // ── 4. openEdit() populates form 
  it('openEdit() should open modal in edit mode', () => {
    spyOn(component, 'loadAvailableSlots').and.stub();

    component.openEdit(fakeReservation as any);

    expect(component.showModal()).toBeTrue();
    expect(component.editMode()).toBeTrue();
  });

  it('openEdit() should populate form with reservation data', () => {
    spyOn(component, 'loadAvailableSlots').and.stub();

    component.openEdit(fakeReservation as any);

    expect(component.form.vehicleNumber).toBe('TN01AB1234');
    expect(component.form.slotId).toBe(5);
    expect(component.form.slotType).toBe('2W');
  });

  it('openEdit() should truncate startTime to 16 characters (YYYY-MM-DDTHH:mm)', () => {
    spyOn(component, 'loadAvailableSlots').and.stub();

    component.openEdit(fakeReservation as any);

    expect(component.form.startTime.length).toBeLessThanOrEqual(16);
  });

  // ── 5. minDateTime getter 
  it('minDateTime should return a string in YYYY-MM-DDTHH:mm format', () => {
    const result = component.minDateTime;
    // Matches: 2026-05-22T14:30
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('minDateTime should be close to current local time (within 1 minute)', () => {
    const result = component.minDateTime;
    const resultMs = new Date(result).getTime();
    const nowMs = Date.now();
    // Should be within 60 seconds of now
    expect(Math.abs(resultMs - nowMs)).toBeLessThan(60000);
  });

  // ── 6. validateStartTime() 
  it('validateStartTime() should set startTimeError when past time is given', () => {
    // Set a past time
    component.form.startTime = '2020-01-01T10:00';
    component.validateStartTime();
    expect(component.startTimeError()).toBe('Start time cannot be in the past.');
  });

  it('validateStartTime() should clear startTimeError when future time is given', () => {
    component.startTimeError.set('Start time cannot be in the past.');
    // Set a far-future time
    component.form.startTime = '2099-12-31T23:59';
    component.validateStartTime();
    expect(component.startTimeError()).toBe('');
  });

  // ── 7. Custom confirm dialog 
  it('showConfirm() should set confirmVisible to true and store title/message', () => {
    component.showConfirm('Test Title', 'Test message?', () => {});
    expect(component.confirmVisible()).toBeTrue();
    expect(component.confirmTitle()).toBe('Test Title');
    expect(component.confirmMessage()).toBe('Test message?');
  });

  it('confirmNo() should close the dialog without running the action', () => {
    let actionRan = false;
    component.showConfirm('Title', 'Msg', () => { actionRan = true; });
    component.confirmNo();
    expect(component.confirmVisible()).toBeFalse();
    expect(actionRan).toBeFalse();
  });

  it('confirmYes() should close the dialog AND run the pending action', () => {
    let actionRan = false;
    component.showConfirm('Title', 'Msg', () => { actionRan = true; });
    component.confirmYes();
    expect(component.confirmVisible()).toBeFalse();
    expect(actionRan).toBeTrue();
  });

  // ── 8. filtered getter 
  it('filtered should return all reservations when no filter is set', () => {
    component.reservations.set([fakeReservation as any]);
    component.filterStatus = '';
    component.searchVehicle = '';
    expect(component.filtered.length).toBe(1);
  });

  it('filtered should filter by status', () => {
    const cancelled = { ...fakeReservation, id: 2, status: 'CANCELLED' };
    component.reservations.set([fakeReservation as any, cancelled as any]);
    component.filterStatus = 'CONFIRMED';
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].status).toBe('CONFIRMED');
  });

  it('filtered should filter by vehicle number (case-insensitive)', () => {
    const other = { ...fakeReservation, id: 2, vehicleNumber: 'KL01AB5678' };
    component.reservations.set([fakeReservation as any, other as any]);
    component.searchVehicle = 'tn01';   // lowercase search
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].vehicleNumber).toBe('TN01AB1234');
  });

  // ── 9. statusBadge() 
  it('statusBadge() should return "success" for CONFIRMED status', () => {
    expect(component.statusBadge('CONFIRMED')).toBe('success');
  });

  it('statusBadge() should return "danger" for CANCELLED status', () => {
    expect(component.statusBadge('CANCELLED')).toBe('danger');
  });

  it('statusBadge() should return "secondary" for COMPLETED status', () => {
    expect(component.statusBadge('COMPLETED')).toBe('secondary');
  });
});
