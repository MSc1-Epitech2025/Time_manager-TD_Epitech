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
import { MatChipsModule } from '@angular/material/chips';
import { MeetingService, CreateMeetingRequest, Meeting } from '../../core/services/meeting';
import { NotificationService } from '../../core/services/notification';

interface CreateMeetingData {
  teamMembers?: Array<{ id: string; name: string }>;
  selectedStart?: string; // ISO date string
  selectedEnd?: string; // ISO date string
  selectedAllDay?: boolean;
}

@Component({
  selector: 'app-create-meeting-modal',
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
    MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title>Schedule a Meeting</h2>
    
    <div mat-dialog-content>
      <form [formGroup]="form">
        <!-- Title -->
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Meeting Title</mat-label>
          <input matInput formControlName="title" placeholder="e.g., Team Standup" />
        </mat-form-field>

        <!-- Description -->
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <!-- Date/Time Range -->
        <div class="form-row">
          <div class="date-time-group">
            <mat-form-field appearance="fill">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate" readonly />
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Start Time</mat-label>
              <input matInput type="time" formControlName="startTime" />
            </mat-form-field>
          </div>

          <div class="date-time-group">
            <mat-form-field appearance="fill">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate" readonly />
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>End Time</mat-label>
              <input matInput type="time" formControlName="endTime" />
            </mat-form-field>
          </div>
        </div>

        <!-- Attendees -->
        <div class="attendees-section" *ngIf="teamMembers && teamMembers.length > 0">
          <label>Attendees (optional)</label>
          <div class="attendees-chips">
            <mat-chip
              *ngFor="let member of teamMembers"
              [highlighted]="isAttendeeSelected(member.id)"
              (click)="toggleAttendee(member.id)"
              [ngClass]="{'attendee-chip-selected': isAttendeeSelected(member.id)}"
              class="attendee-chip"
            >
              {{ member.name }}
              <mat-icon *ngIf="isAttendeeSelected(member.id)" matChipRemove>close</mat-icon>
            </mat-chip>
          </div>
        </div>
      </form>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!form.valid || submitting">
        <span *ngIf="!submitting">Create Meeting</span>
        <span *ngIf="submitting">Creating...</span>
      </button>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .date-time-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .date-time-group mat-form-field {
      width: 100%;
    }

    .attendees-section {
      margin-top: 1.5rem;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .attendees-section label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #374151;
    }

    .attendees-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .attendee-chip {
      cursor: pointer;
      background-color: #dbeafe !important;
      color: #0c4a6e !important;
      transition: all 0.2s ease;
    }

    .attendee-chip-selected {
      background-color: #3b82f6 !important;
      color: white !important;
    }

    [mat-dialog-actions] {
      padding-top: 1rem;
    }
  `]
})
export class CreateMeetingModalComponent {
  form: FormGroup;
  submitting = false;
  teamMembers: Array<{ id: string; name: string }> = [];
  selectedAttendees = new Set<string>();

  constructor(
    private fb: FormBuilder,
    private meetingService: MeetingService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<CreateMeetingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateMeetingData
  ) {
    // Parse selected dates if provided
    const startDate = data.selectedStart ? new Date(data.selectedStart) : null;
    const endDate = data.selectedEnd ? new Date(data.selectedEnd) : null;
    
    // Prepare default start time (or use provided time)
    let startTime = '09:00';
    let endTime = '10:00';
    
    if (startDate && !data.selectedAllDay) {
      startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    }
    
    if (endDate && !data.selectedAllDay) {
      endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    }

    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      startDate: [startDate, Validators.required],
      startTime: [startTime, Validators.required],
      endDate: [endDate, Validators.required],
      endTime: [endTime, Validators.required],
    });

    this.teamMembers = data.teamMembers || [];
  }

  isAttendeeSelected(memberId: string): boolean {
    return this.selectedAttendees.has(memberId);
  }

  toggleAttendee(memberId: string) {
    if (this.selectedAttendees.has(memberId)) {
      this.selectedAttendees.delete(memberId);
    } else {
      this.selectedAttendees.add(memberId);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  async onSubmit() {
    if (!this.form.valid) return;

    this.submitting = true;
    try {
      const startDate = this.form.get('startDate')?.value as Date;
      const endDate = this.form.get('endDate')?.value as Date;
      const startTime = this.form.get('startTime')?.value as string;
      const endTime = this.form.get('endTime')?.value as string;

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startDateTime = new Date(startDate);
      startDateTime.setHours(startHour, startMinute, 0);

      const endDateTime = new Date(endDate);
      endDateTime.setHours(endHour, endMinute, 0);

      const request: CreateMeetingRequest = {
        title: this.form.get('title')?.value,
        description: this.form.get('description')?.value || undefined,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        attendees: Array.from(this.selectedAttendees),
      };

      const result = await this.meetingService.createMeeting(request).toPromise();
      this.notify.success('Meeting created successfully');
      this.dialogRef.close(result);
    } catch (err) {
      console.error('Error creating meeting', err);
      this.notify.error('Failed to create meeting');
    } finally {
      this.submitting = false;
    }
  }
}
