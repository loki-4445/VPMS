import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleLogService } from '../../core/services/vehicle-log.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { SlotService } from '../../core/services/slot.service';
import { AuthService } from '../../core/services/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { VehicleLogResponse } from '../../models/vehicle-log.models';
import { CustomerBillDTO } from '../../models/invoice.models';
import { SlotResponse } from '../../models/slot.models';
import { ReservationResponse } from '../../models/reservation.models';

@Component({
  selector: 'app-vehicle-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-logs.component.html',
  styleUrls: ['./vehicle-logs.component.scss']
})
export class VehicleLogsComponent implements OnInit {
  private svc = inject(VehicleLogService);
  private invoiceSvc = inject(InvoiceService);
  private slotSvc = inject(SlotService);
  private resSvc = inject(ReservationService);
  auth = inject(AuthService);

  logs = signal<VehicleLogResponse[]>([]);
  availableSlots = signal<SlotResponse[]>([]);
  activeReservations = signal<ReservationResponse[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');

  filterStatus = '';
  searchVehicle = '';
  entrySearch = '';
  exitSearch = '';
  showEntryDropdown = false;
  showExitDropdown = false;

  showEntryModal = signal(false);
  showExitModal = signal(false);
  showInvoiceModal = signal(false);

  // Entry form — userId auto-filled from auth
  entryForm = { vehicleNumber: '', slotId: 0 };
  exitVehicleNumber = '';

  // After exit: invoice generation
  exitedLog = signal<VehicleLogResponse | null>(null);
  paymentMethod: 'UPI' | 'CASH' = 'UPI';
  generatedInvoice = signal<CustomerBillDTO | null>(null);
  generatingInvoice = signal(false);
  awaitingConfirmation = signal(false);
  paymentDone = signal(false);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    // STAFF can only access /logs/active; ADMIN gets all
    const obs = this.auth.isAdmin() ? this.svc.getAll() : this.svc.getActive();
    obs.subscribe({
      next: data => { this.logs.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load logs.'); this.loading.set(false); }
    });
  }

  get filtered() {
    return this.logs().filter(l => {
      const matchStatus = !this.filterStatus || l.status === this.filterStatus;
      const matchVehicle = !this.searchVehicle ||
        l.vehicleNumber.toLowerCase().includes(this.searchVehicle.toLowerCase());
      return matchStatus && matchVehicle;
    });
  }

  openEntryModal() {
    this.entryForm = { vehicleNumber: '', slotId: 0 };
    this.entrySearch = '';
    this.showEntryDropdown = false;
    this.resSvc.getActive().subscribe({
      next: res => this.activeReservations.set(res),
      error: () => this.activeReservations.set([])
    });
    this.slotSvc.getAll(undefined, -1).subscribe({
      next: slots => this.availableSlots.set(slots),
      error: () => {}
    });
    this.showEntryModal.set(true);
    this.error.set(''); this.success.set('');
  }

  selectReservation(id: string) {
    if (!id) { this.entryForm = { vehicleNumber: '', slotId: 0 }; return; }
    const res = this.activeReservations().find(r => r.id === +id);
    if (res) { this.entryForm.vehicleNumber = res.vehicleNumber; this.entryForm.slotId = res.slotId; }
  }

  selectReservationFromDropdown(res: import('../../models/reservation.models').ReservationResponse) {
    this.entryForm.vehicleNumber = res.vehicleNumber;
    this.entryForm.slotId = res.slotId;
    this.entrySearch = res.vehicleNumber;
    this.showEntryDropdown = false;
  }

  clearEntrySearch() {
    this.entrySearch = '';
    this.entryForm = { vehicleNumber: '', slotId: 0 };
    this.showEntryDropdown = false;
  }

  closeEntryDropdown() {
    setTimeout(() => { this.showEntryDropdown = false; }, 150);
  }

  selectExitFromDropdown(log: VehicleLogResponse) {
    this.exitVehicleNumber = log.vehicleNumber;
    this.exitSearch = log.vehicleNumber;
    this.showExitDropdown = false;
  }

  clearExitSearch() {
    this.exitSearch = '';
    this.exitVehicleNumber = '';
    this.showExitDropdown = false;
  }

  closeExitDropdown() {
    setTimeout(() => { this.showExitDropdown = false; }, 150);
  }

  openExitModal() {
    this.exitVehicleNumber = '';
    this.exitSearch = '';
    this.showExitDropdown = false;
    this.showExitModal.set(true);
    this.error.set(''); this.success.set('');
  }

  get activeVehicleLogs() {
    return this.logs().filter(l => l.status === 'ACTIVE');
  }

  get filteredReservations() {
    // exclude vehicles already inside (have an ACTIVE log entry)
    const parked = new Set(this.logs().filter(l => l.status === 'ACTIVE').map(l => l.vehicleNumber));
    const q = this.entrySearch.toLowerCase();
    return this.activeReservations()
      .filter(r => !parked.has(r.vehicleNumber))
      .filter(r => !q || r.vehicleNumber.toLowerCase().includes(q) || String(r.slotId).includes(q));
  }

  get filteredActiveLogs() {
    const q = this.exitSearch.toLowerCase();
    return this.activeVehicleLogs.filter(l =>
      !q || l.vehicleNumber.toLowerCase().includes(q) || String(l.slotId).includes(q)
    );
  }

  logEntry() {
    if (!this.entryForm.vehicleNumber || !this.entryForm.slotId) {
      this.error.set('Vehicle number and slot are required.'); return;
    }
    const userId = this.auth.getUserId();
    if (!userId) { this.error.set('User session expired. Please log in again.'); return; }

    this.saving.set(true); this.error.set('');
    this.svc.logEntry({
      vehicleNumber: this.entryForm.vehicleNumber,
      slotId: this.entryForm.slotId,
      userId
    }).subscribe({
      next: () => {
        this.success.set('Vehicle entry logged.');
        this.saving.set(false); this.showEntryModal.set(false); this.load();
      },
      error: err => { this.error.set(err.error?.message || 'Entry failed.'); this.saving.set(false); }
    });
  }

  logExit() {
    if (!this.exitVehicleNumber.trim()) { this.error.set('Vehicle number required.'); return; }
    this.saving.set(true); this.error.set('');
    this.svc.logExit({ vehicleNumber: this.exitVehicleNumber.trim() }).subscribe({
      next: log => {
        this.saving.set(false);
        this.showExitModal.set(false);
        this.exitedLog.set(log);
        this.paymentMethod = 'UPI';
        this.generatedInvoice.set(null);
        this.showInvoiceModal.set(true);
        this.load();
      },
      error: err => { this.error.set(err.error?.message || 'Exit failed.'); this.saving.set(false); }
    });
  }

  // Step 1 → Step 2: generate invoice, wait for staff confirmation
  proceedToConfirm() {
    const log = this.exitedLog();
    if (!log) return;
    this.generatingInvoice.set(true); this.error.set('');
    this.invoiceSvc.generate(log.userId, log.reservationId || 0, log.logId, log.slotId).subscribe({
      next: invoice => {
        this.generatedInvoice.set(invoice);
        this.generatingInvoice.set(false);
        this.awaitingConfirmation.set(true);
      },
      error: err => {
        this.error.set(err.error?.message || 'Invoice generation failed.');
        this.generatingInvoice.set(false);
      }
    });
  }

  // Step 2 → Step 3: staff confirmed payment received
  confirmAndPay() {
    const invoice = this.generatedInvoice();
    if (!invoice) return;
    this.generatingInvoice.set(true);
    this.invoiceSvc.pay({ invoiceId: invoice.invoiceId, paymentMethod: this.paymentMethod }).subscribe({
      next: () => {
        this.generatingInvoice.set(false);
        this.awaitingConfirmation.set(false);
        this.paymentDone.set(true);
      },
      error: () => { this.generatingInvoice.set(false); }
    });
  }

  // Step 2 → Step 1: go back to method selection
  // Note: invoice already created as PENDING — will appear in Invoices tab
  backToMethodSelect() {
    this.awaitingConfirmation.set(false);
    this.generatedInvoice.set(null);
  }

  closeInvoiceModal() {
    this.showInvoiceModal.set(false);
    this.exitedLog.set(null);
    this.generatedInvoice.set(null);
    this.awaitingConfirmation.set(false);
    this.paymentDone.set(false);
  }

  get activeCount() { return this.logs().filter(l => l.status === 'ACTIVE').length; }
  get completedCount() { return this.logs().filter(l => l.status === 'COMPLETED').length; }

  formatDuration(mins?: number) {
    if (!mins) return '—';
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
