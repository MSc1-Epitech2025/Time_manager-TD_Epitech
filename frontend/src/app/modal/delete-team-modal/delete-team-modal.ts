import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-delete-team-modal',
  templateUrl: './delete-team-modal.html',
  styleUrls: ['./delete-team-modal.scss'],
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule] 
})
export class DeleteTeamModalComponent {
  team: any;
  isDestroyed: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<DeleteTeamModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.team = { 
      ...data.team, 
      members: data.team.members ? [...data.team.members] : [],
      isDestroyed: false
    };
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.team.isDestroyed = true;
    this.dialogRef.close(this.team);
  }
}
