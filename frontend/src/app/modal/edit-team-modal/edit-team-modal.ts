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
  selector: 'app-edit-team-modal',
  templateUrl: './edit-team-modal.html',
  styleUrls: ['./edit-team-modal.scss'],
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule] 
})
export class EditTeamModalComponent {
  team: any;
  newMemberId: string = '';
  newMemberName: string = '';
  name: string = '';
  description: string = '';
  members: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<EditTeamModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // On clone les données pour éviter les modifications directes
    this.team = { ...data.team, members: [...data.team.members] };
  }

  addMember() {
    const memberId = this.newMemberId.trim();
    if (!memberId) return;

    if (this.team.members.some((member: any) => String(member.id) === memberId)) {
      return;
    }

    const displayName = this.newMemberName.trim() || memberId;
    this.team.members.push({ id: memberId, name: displayName });
    this.newMemberId = '';
    this.newMemberName = '';
  }

  removeMember(index: number) {
    this.team.members.splice(index, 1);
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close(this.team);
    this.name = this.team.name;
    this.description = this.team.description;
    this.members = this.team.members;
  }
}
