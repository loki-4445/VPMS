import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../core/services/reservation.service';
import { SlotService } from '../../core/services/slot.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ReservationResponse } from '../../models/reservation.models';
import { SlotResponse } from '../../models/slot.models';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.css']
})
export class ReservationsComponent implements OnInit {
  private svc = inject(ReservationService);
  private slotSvc = inject(SlotService);
  private userSvc = inject(UserService);
  auth = inject(AuthService);

  reservations = signal<ReservationResponse[]>([]);
  availableSlots = signal<SlotResponse[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  startTimeError = signal('');

  filterStatus = '';
  searchVehicle = '';

  showModal = signal(false);
  editMode = signal(false);
  selectedRes = signal<ReservationResponse | null>(null);

  // ── Custom confirm dialog ──
  confirmVisible  = signal(false);
  confirmMessage  = signal('');
  confirmTitle    = signal('');
  private pendingAction: (() => void) | null = null;

  showConfirm(title: string, message: string, action: () => void) {
    this.confirmTitle.set(title);
    this.confirmMessage.set(message);
    this.pendingAction = action;
    this.confirmVisible.set(true);
  }
  confirmYes() { this.confirmVisible.set(false); this.pendingAction?.(); this.pendingAction = null; }
  confirmNo()  { this.confirmVisible.set(false); this.pendingAction = null; }

  form = {
    vehicleNumber: '',
    startTime: '',
    slotId: 0,
    slotType: '2W' as '2W' | '4W'
  };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    if (this.auth.isAdmin() || this.auth.isStaff()) {
      this.svc.getAll().subscribe({
        next: data => { this.reservations.set(data); this.loading.set(false); },
        error: () => { this.error.set('Failed to load reservations.'); this.loading.set(false); }
      });
      return;
    }
    const userId = this.auth.getUserId();
    if (!userId) {
      this.userSvc.getMe().subscribe({
        next: me => { this.auth.setUserId(me.id); this.loadForUser(me.id); },
        error: () => { this.error.set('Failed to load reservations.'); this.loading.set(false); }
      });
      return;
    }
    this.loadForUser(userId);
  }

  private loadForUser(userId: number) {
    this.svc.getByUser(userId).subscribe({
      next: data => { this.reservations.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load reservations.'); this.loading.set(false); }
    });
  }

  get filtered() {
    return this.reservations().filter(r => {
      const matchStatus = !this.filterStatus || r.status === this.filterStatus;
      const matchVehicle = !this.searchVehicle ||
        r.vehicleNumber.toLowerCase().includes(this.searchVehicle.toLowerCase());
      return matchStatus && matchVehicle;
    });
  }

  openAdd() {
    this.editMode.set(false);
    this.selectedRes.set(null);
    this.form = { vehicleNumber: '', startTime: '', slotId: 0, slotType: '2W' };
    this.loadAvailableSlots('2W');
    this.showModal.set(true);
    this.error.set(''); this.success.set(''); this.startTimeError.set('');
  }

  openEdit(r: ReservationResponse) {
    this.editMode.set(true);
    this.selectedRes.set(r);
    this.form = {
      vehicleNumber: r.vehicleNumber,
      startTime: r.startTime ? r.startTime.substring(0, 16) : '',
      slotId: r.slotId,
      slotType: (r.slotType === '2W' || r.slotType === '4W') ? r.slotType : '2W'
    };
    this.loadAvailableSlots(this.form.slotType);
    this.showModal.set(true);
    this.error.set(''); this.success.set(''); this.startTimeError.set('');
  }

  loadAvailableSlots(type: string) {
    this.slotSvc.getAvailable(type).subscribe({
      next: slots => this.availableSlots.set(slots),
      error: () => {}
    });
  }

  onTypeChange() { this.loadAvailableSlots(this.form.slotType); this.form.slotId = 0; }

  /** Called every time the start-time input changes — blocks past selections immediately */
  validateStartTime() {
    if (this.form.startTime && this.form.startTime < this.minDateTime) {
      this.startTimeError.set('Start time cannot be in the past.');
    } else {
      this.startTimeError.set('');
    }
  }

  save() {
    if (!this.form.vehicleNumber || !this.form.startTime || !this.form.slotId) {
      this.error.set('Please fill all required fields.'); return;
    }
    if (this.form.startTime < this.minDateTime) {
      this.startTimeError.set('Start time cannot be in the past.'); return;
    }
    this.saving.set(true); this.error.set('');

    const payload = {
      vehicleNumber: this.form.vehicleNumber,
      startTime: this.form.startTime
    };

    if (this.editMode() && this.selectedRes()) {
      this.svc.update(this.selectedRes()!.id, payload as any).subscribe({
        next: () => { this.success.set('Reservation updated.'); this.saving.set(false); this.showModal.set(false); this.load(); },
        error: err => { this.error.set(err.error?.message || 'Update failed.'); this.saving.set(false); }
      });
    } else {
      const userId = this.auth.getUserId();
      if (!userId) { this.error.set('Session error: user ID not found. Please log out and log in again.'); this.saving.set(false); return; }
      this.svc.create(userId, this.form.slotId, payload as any).subscribe({
        next: () => { this.success.set('Reservation created.'); this.saving.set(false); this.showModal.set(false); this.load(); },
        error: err => { this.error.set(err.error?.message || 'Create failed.'); this.saving.set(false); }
      });
    }
  }

  cancel(r: ReservationResponse) {
    this.showConfirm(
      'Cancel Reservation',
      `Are you sure you want to cancel reservation #${r.id} for vehicle ${r.vehicleNumber}?`,
      () => {
        this.svc.cancel(r.id).subscribe({
          next: () => { this.success.set('Reservation cancelled.'); this.load(); },
          error: err => this.error.set(err.error?.message || 'Cancel failed.')
        });
      }
    );
  }

  /** Returns current local datetime in YYYY-MM-DDTHH:mm — used as [min] on datetime-local inputs */
  get minDateTime(): string {
    const now = new Date();
    // toISOString() gives UTC; we need local time so the browser min check matches what the user sees
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().substring(0, 16);
  }

  statusBadge(s: string) {
    return s === 'CONFIRMED' ? 'success' : s === 'CANCELLED' ? 'danger' : 'secondary';
  }
}
