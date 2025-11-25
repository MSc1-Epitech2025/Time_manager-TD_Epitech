import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AbsenceType, AbsencePeriod } from '../../core/services/absence';

export interface AbsenceRequestData {
  startDate?: Date;
  endDate?: Date;
}

export interface AbsenceRequestResult {
  startDate: string;
  endDate: string;
  type: AbsenceType;
  reason?: string;
  periodByDate?: Array<{ date: string; period: AbsencePeriod }>;
}

@Component({
  selector: 'app-absence-request-modal',
  templateUrl: './absence-request-modal.html',
  styleUrls: ['./absence-request-modal.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class AbsenceRequestModal implements OnInit {
  startDate: Date | null = null;
  endDate: Date | null = null;
  absenceType: AbsenceType = 'VACATION';
  reason: string = '';
  period: AbsencePeriod = 'FULL_DAY';

  absenceTypes: Array<{ value: AbsenceType; label: string }> = [
    { value: 'VACATION', label: 'Vacation' },
    { value: 'SICK', label: 'Sick Leave' },
    { value: 'PERSONAL', label: 'Personal Leave' },
    { value: 'FORMATION', label: 'Formation' },
    { value: 'RTT', label: 'RTT' },
    { value: 'OTHER', label: 'Other' },
  ];

  periods: Array<{ value: AbsencePeriod; label: string }> = [
    { value: 'FULL_DAY', label: 'Full Day' },
    { value: 'AM', label: 'Morning (AM)' },
    { value: 'PM', label: 'Afternoon (PM)' },
  ];

  constructor(
    private readonly dialogRef: MatDialogRef<AbsenceRequestModal>,
    @Inject(MAT_DIALOG_DATA) public data?: AbsenceRequestData
  ) {}

  ngOnInit(): void {
    if (this.data?.startDate) {
      this.startDate = this.data.startDate;
    }
    if (this.data?.endDate) {
      this.endDate = this.data.endDate;
    }
    if (!this.endDate && this.startDate) {
      this.endDate = new Date(this.startDate);
    }
  }

  get isSingleDay(): boolean {
    if (!this.startDate || !this.endDate) return true;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return start.getTime() === end.getTime();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.startDate || !this.endDate || !this.absenceType) {
      return;
    }

    const result: AbsenceRequestResult = {
      startDate: this.formatDate(this.startDate),
      endDate: this.formatDate(this.endDate),
      type: this.absenceType,
      reason: this.reason.trim() || undefined,
    };

    if (this.isSingleDay && this.period !== 'FULL_DAY') {
      result.periodByDate = [
        {
          date: this.formatDate(this.startDate),
          period: this.period,
        },
      ];
    }

    this.dialogRef.close(result);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
