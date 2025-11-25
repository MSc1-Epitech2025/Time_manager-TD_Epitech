import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DeleteUserModalData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

@Component({
  selector: 'app-delete-user-modal',
  standalone: true,
  templateUrl: './delete-user-modal.html',
  styleUrls: ['./delete-user-modal.scss'],
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule] 
})
export class DeleteUserModalComponent {
  user: DeleteUserModalData['user'];

  constructor(
    private dialogRef: MatDialogRef<DeleteUserModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteUserModalData
  ) {
    this.user = data.user;
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  onConfirm() {
    this.dialogRef.close(true);
  }
}
