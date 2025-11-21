import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AbsenceService, CreateAbsenceRequest, Absence } from '../../core/services/absence';
import { NotificationService } from '../../core/services/notification';

interface RequestAbsenceData {
  currentUserId: string;
  currentUserName: string;
  selectedStart?: string;
  selectedEnd?: string;
  selectedAllDay?: boolean;
}

@Component({
  selector: 'app-request-absence-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>Request an Absence</h2>
    
    <div mat-dialog-content>
      <form [formGroup]="form">
        <!-- Date range -->
        <div class="form-row">
          <mat-form-field appearance="fill">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate" readonly />
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate" readonly />
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <!-- Absence Type -->
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Absence Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="VACATION">Vacation</mat-option>
            <mat-option value="SICK_LEAVE">Sick Leave</mat-option>
            <mat-option value="PERSONAL">Personal</mat-option>
            <mat-option value="OTHER">Other</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Reason -->
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Reason (optional)</mat-label>
          <textarea matInput formControlName="reason" rows="3"></textarea>
        </mat-form-field>

        <!-- Period by date -->
        <div class="period-section" *ngIf="form.get('startDate')?.value && form.get('endDate')?.value">
          <h4>Adjust by date (optional)</h4>
          <div *ngFor="let date of periodDates" class="period-date">
            <label>{{ date | date: 'EEE dd/MM' }}</label>
            <mat-select [formControl]="getPeriodControl(date)">
              <mat-option value="FULL_DAY">Full Day</mat-option>
              <mat-option value="AM">AM only</mat-option>
              <mat-option value="PM">PM only</mat-option>
            </mat-select>
          </div>
        </div>
      </form>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!form.valid || submitting">
        <span *ngIf="!submitting">Request</span>
        <span *ngIf="submitting">Submitting...</span>
      </button>
    </div>
  `,
  styles: [`
    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    .period-section {
      margin-top: 1.5rem;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .period-section h4 {
      margin-top: 0;
      font-size: 0.9rem;
      color: #666;
    }

    .period-date {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      padding: 0.5rem 0;
    }

    .period-date label {
      font-weight: 500;
      min-width: 120px;
    }

    .period-date mat-select {
      width: 120px;
    }

    [mat-dialog-actions] {
      padding-top: 1rem;
    }
  `]
})
export class RequestAbsenceModalComponent {
  form: FormGroup;
  submitting = false;
  periodDates: Date[] = [];
  private periodControls = new Map<string, any>();

  constructor(
    private fb: FormBuilder,
    private absenceService: AbsenceService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<RequestAbsenceModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RequestAbsenceData
  ) {
    // Parse selected dates if provided
    const startDate = data.selectedStart ? new Date(data.selectedStart) : null;
    const endDate = data.selectedEnd ? new Date(data.selectedEnd) : null;

    this.form = this.fb.group({
      startDate: [startDate, Validators.required],
      endDate: [endDate, Validators.required],
      type: ['VACATION', Validators.required],
      reason: [''],
    });

    this.form.get('startDate')?.valueChanges.subscribe(() => this.updatePeriodDates());
    this.form.get('endDate')?.valueChanges.subscribe(() => this.updatePeriodDates());
    
    // Initialize period dates if dates were provided
    if (startDate && endDate) {
      this.updatePeriodDates();
    }
  }

  getPeriodControl(date: Date): any {
    const key = this.dateToKey(date);
    if (!this.periodControls.has(key)) {
      this.periodControls.set(key, this.fb.control('FULL_DAY'));
    }
    return this.periodControls.get(key);
  }

  private updatePeriodDates() {
    const start = this.form.get('startDate')?.value;
    const end = this.form.get('endDate')?.value;

    if (!start || !end) {
      this.periodDates = [];
      return;
    }

    const dates: Date[] = [];
    const current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    this.periodDates = dates;
  }

  private dateToKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onCancel() {
    this.dialogRef.close();
  }

  async onSubmit() {
    if (!this.form.valid) return;

    this.submitting = true;
    try {
      const start = this.form.get('startDate')?.value as Date;
      const end = this.form.get('endDate')?.value as Date;

      const periodByDate: Record<string, 'AM' | 'PM' | 'FULL_DAY'> = {};
      for (const [key, control] of this.periodControls.entries()) {
        periodByDate[key] = control.value;
      }

      const request: CreateAbsenceRequest = {
        startDate: this.dateToKey(start),
        endDate: this.dateToKey(end),
        type: this.form.get('type')?.value,
        reason: this.form.get('reason')?.value || undefined,
        ...(Object.keys(periodByDate).length > 0 && { periodByDate }),
      };

      const result = await this.absenceService.createAbsence(request).toPromise();
      this.notify.success('Absence request created successfully');
      this.dialogRef.close(result);
    } catch (err) {
      console.error('Error creating absence', err);
      this.notify.error('Failed to create absence request');
    } finally {
      this.submitting = false;
    }
  }
}
