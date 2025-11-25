import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Absence } from '../../core/services/absence';

export interface AbsenceApprovalData {
  absence: Absence;
}

export interface AbsenceApprovalResult {
  action: 'approve' | 'reject';
  absenceId: string;
}

@Component({
  selector: 'app-absence-approval-modal',
  templateUrl: './absence-approval-modal.html',
  styleUrls: ['./absence-approval-modal.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
})
export class AbsenceApprovalModal {
  constructor(
    private readonly dialogRef: MatDialogRef<AbsenceApprovalModal>,
    @Inject(MAT_DIALOG_DATA) public data: AbsenceApprovalData
  ) {}

  get absence(): Absence {
    return this.data.absence;
  }

  get userName(): string {
    const user = this.absence.user;
    if (user) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || this.absence.userId;
    }
    return this.absence.userId;
  }

  get dateRange(): string {
    const start = new Date(this.absence.startDate).toLocaleDateString('fr-FR');
    const end = new Date(this.absence.endDate).toLocaleDateString('fr-FR');
    return start === end ? start : `${start} - ${end}`;
  }

  get statusColor(): string {
    switch (this.absence.status) {
      case 'PENDING':
        return '#f59e0b';
      case 'APPROVED':
        return '#10b981';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  get typeLabel(): string {
    const typeMap: Record<string, string> = {
      SICK: 'Sick Leave',
      VACATION: 'Vacation',
      PERSONAL: 'Personal Leave',
      FORMATION: 'Formation',
      RTT: 'RTT',
      OTHER: 'Other',
    };
    return typeMap[this.absence.type] || this.absence.type;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApprove(): void {
    const result: AbsenceApprovalResult = {
      action: 'approve',
      absenceId: this.absence.id,
    };
    this.dialogRef.close(result);
  }

  onReject(): void {
    const result: AbsenceApprovalResult = {
      action: 'reject',
      absenceId: this.absence.id,
    };
    this.dialogRef.close(result);
  }
}
