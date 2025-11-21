import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { AbsenceService, Absence } from '../../core/services/absence';
import { NotificationService } from '../../core/services/notification';

interface ApproveAbsenceData {
  absence: Absence;
  employeeName: string;
}

@Component({
  selector: 'app-approve-absence-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title>Approve/Reject Absence Request</h2>
    
    <div mat-dialog-content class="absence-details">
      <mat-card class="detail-card">
        <mat-card-content>
          <div class="detail-row">
            <span class="label">Employee:</span>
            <span class="value">{{ data.employeeName }}</span>
          </div>

          <div class="detail-row">
            <span class="label">Type:</span>
            <mat-chip class="type-chip" [ngClass]="'type-' + data.absence.type.toLowerCase()">
              {{ data.absence.type }}
            </mat-chip>
          </div>

          <div class="detail-row">
            <span class="label">Period:</span>
            <span class="value">
              {{ data.absence.startDate }} to {{ data.absence.endDate }}
            </span>
          </div>

          <div class="detail-row">
            <span class="label">Days Requested:</span>
            <span class="value">{{ calculateDays() }} day(s)</span>
          </div>

          <div class="detail-row" *ngIf="data.absence.reason">
            <span class="label">Reason:</span>
            <span class="value reason-text">{{ data.absence.reason }}</span>
          </div>

          <div class="detail-row">
            <span class="label">Status:</span>
            <mat-chip class="status-chip" [ngClass]="'status-' + data.absence.status.toLowerCase()">
              {{ data.absence.status }}
            </mat-chip>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="onReject()" [disabled]="submitting">
        <mat-icon>close</mat-icon>
        <span *ngIf="!submitting">Reject</span>
        <span *ngIf="submitting">Rejecting...</span>
      </button>
      <button mat-raised-button color="primary" (click)="onApprove()" [disabled]="submitting">
        <mat-icon>check</mat-icon>
        <span *ngIf="!submitting">Approve</span>
        <span *ngIf="submitting">Approving...</span>
      </button>
    </div>
  `,
  styles: [`
    .absence-details {
      padding: 1rem 0;
    }

    .detail-card {
      background-color: #f9fafb;
    }

    mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .label {
      font-weight: 600;
      min-width: 120px;
      color: #374151;
    }

    .value {
      flex: 1;
      color: #1f2937;
    }

    .reason-text {
      white-space: pre-wrap;
      word-break: break-word;
    }

    mat-chip {
      height: auto;
      padding: 0.25rem 0.75rem;
    }

    .type-chip {
      background-color: #dbeafe !important;
      color: #0c4a6e !important;
    }

    .type-chip.type-vacation {
      background-color: #dcfce7 !important;
      color: #166534 !important;
    }

    .type-chip.type-sick_leave {
      background-color: #fed7aa !important;
      color: #92400e !important;
    }

    .type-chip.type-personal {
      background-color: #f3e8ff !important;
      color: #6b21a8 !important;
    }

    .status-chip {
      background-color: #fef3c7 !important;
      color: #92400e !important;
    }

    .status-chip.status-approved {
      background-color: #dcfce7 !important;
      color: #166534 !important;
    }

    .status-chip.status-rejected {
      background-color: #fee2e2 !important;
      color: #7f1d1d !important;
    }

    [mat-dialog-actions] {
      padding-top: 1rem;
      gap: 0.5rem;
    }

    button mat-icon {
      margin-right: 0.5rem;
    }
  `]
})
export class ApproveAbsenceModalComponent {
  submitting = false;

  constructor(
    private absenceService: AbsenceService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<ApproveAbsenceModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ApproveAbsenceData
  ) {}

  calculateDays(): number {
    const start = new Date(this.data.absence.startDate);
    const end = new Date(this.data.absence.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  onCancel() {
    this.dialogRef.close();
  }

  async onApprove() {
    if (this.submitting) return;
    this.submitting = true;

    try {
      const result = await this.absenceService
        .approveAbsence(this.data.absence.id, 'APPROVED')
        .toPromise();
      this.notify.success('Absence approved successfully');
      this.dialogRef.close(result);
    } catch (err) {
      console.error('Error approving absence', err);
      this.notify.error('Failed to approve absence');
      this.submitting = false;
    }
  }

  async onReject() {
    if (this.submitting) return;
    this.submitting = true;

    try {
      const result = await this.absenceService
        .approveAbsence(this.data.absence.id, 'REJECTED')
        .toPromise();
      this.notify.success('Absence rejected');
      this.dialogRef.close(result);
    } catch (err) {
      console.error('Error rejecting absence', err);
      this.notify.error('Failed to reject absence');
      this.submitting = false;
    }
  }
}
