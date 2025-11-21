import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

interface SelectEventTypeData {
  selection: any;
}

@Component({
  selector: 'app-select-event-type-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Create Event</h2>
    
    <div mat-dialog-content>
      <p>What would you like to create?</p>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="onSelectAbsence()">
        <mat-icon>sick</mat-icon>
        Request Absence
      </button>
      <button mat-raised-button color="primary" (click)="onSelectMeeting()">
        <mat-icon>event</mat-icon>
        Create Meeting
      </button>
    </div>
  `,
  styles: [`
    [mat-dialog-actions] {
      gap: 0.5rem;
    }

    button mat-icon {
      margin-right: 0.5rem;
    }
  `]
})
export class SelectEventTypeModalComponent {
  constructor(
    public dialogRef: MatDialogRef<SelectEventTypeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SelectEventTypeData
  ) {}

  onCancel() {
    this.dialogRef.close();
  }

  onSelectAbsence() {
    this.dialogRef.close({ type: 'absence' });
  }

  onSelectMeeting() {
    this.dialogRef.close({ type: 'meeting' });
  }
}
