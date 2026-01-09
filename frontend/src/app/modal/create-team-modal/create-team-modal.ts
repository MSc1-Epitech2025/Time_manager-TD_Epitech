import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SecurityValidationService } from '@core/services/security-validation';

@Component({
  selector: 'app-create-team-modal',
  templateUrl: './create-team-modal.html',
  styleUrls: ['./create-team-modal.scss'],
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule]
})
export class CreateTeamModal {
  teamName: string = '';
  description: string = '';

  constructor(
    private dialogRef: MatDialogRef<CreateTeamModal>,
    private security: SecurityValidationService
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.teamName.trim()) {
      try {
        this.security.validateTeam({
          name: this.teamName,
          description: this.description
        });
      } catch (err: any) {
        alert(err?.message || 'Invalid input detected');
        return;
      }
      
      this.dialogRef.close({
        name: this.teamName,
        description: this.description
      });
    }
  }
}
