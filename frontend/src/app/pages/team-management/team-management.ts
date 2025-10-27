import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { CreateTeamModal } from '../../modal/create-team-modal/create-team-modal';
import { EditTeamModalComponent } from '../../modal/edit-team-modal/edit-team-modal';
import { DeleteTeamModalComponent } from '../../modal/delete-team-modal/delete-team-modal';
import { EnterpriseService } from '../../core/services/enterprise';

@Component({
  selector: 'app-team-management',
  imports: [MatIconModule, MatButtonModule , CommonModule, FormsModule, MatCardModule,
    MatFormFieldModule, MatInputModule, ],
  templateUrl: './team-management.html',
  styleUrl: './team-management.scss'
})
export class TeamManagement {
  searchTerm: string = '';
  teamSelected: number = -1;
  showAddTeamForm: boolean = false;
  teams = [
  {
    id: 0,
    name: 'Développement Web',
    members: [
      { name: 'Alice', photo: 'assets/members/alice.jpg' },
      { name: 'Lucas', photo: 'assets/members/lucas.jpg' },
      { name: 'Sophie', photo: 'assets/members/sophie.jpg' },
      { name: 'Rayan', photo: 'assets/members/rayan.jpg' },
      { name: 'Noa', photo: 'assets/members/noa.jpg' },
      { name: 'Mia', photo: 'assets/members/mia.jpg' },
    ],
  },
  {
    id: 1,
    name: 'Marketing Digital',
    members: [
      { name: 'Chloé', photo: 'assets/members/chloe.jpg' },
      { name: 'Mathis', photo: 'assets/members/mathis.jpg' },
    ],
  },
];
filteredTeams = this.teams;


  constructor(private router: Router, private auth: AuthService, private modal: MatDialog,
    private enterpriseService : EnterpriseService
  ) {}

  onInit() {
    this.refreshTeams();
  }

  refreshTeams() {
    console.log('Refreshing team list');
    this.filteredTeams = this.teams;
    try {
    this.enterpriseService.getEmployees().then(employees => {
      console.log('Fetched employees:', employees);
      // Update teams based on fetched employees if necessary
    });
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
    // Request to backend to get updated team list
  }

  searchTeams() {
    this.filteredTeams = this.teams.filter(team =>
      team.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    console.log('Searching for teams with term:', this.searchTerm);
  }
  viewTeamDetails(teamId: number) {
    console.log('Viewing team with ID:', teamId);
    // Navigate to team detail page
  }
  openModal() {
    console.log('Opening modal to create a new team');
    this.showAddTeamForm = true;
    // Open modal logic
  }
  closeModal() {
    this.showAddTeamForm = false;
  }

  // ---- Crud ----
  addTeam(teamName: string, members: any[]) {
    console.log('Adding new team');
    this.teams.push({
      id: this.teams.length,
      name: teamName,
      members: members
    });
    // Request to backend to add new team
    this.refreshTeams();
  }

  editTeam(teamId: number , teamData?: any) {
    console.log('Editing team with ID:', teamId);
    console.log('New team data:', teamData);
    this.teams[teamId] = teamData;
    // requete backend pour modifier l'equipe
  }

  deleteTeam(teamId: number) {
    this.teams.splice(teamId, 1);
    console.log('Deleting team :', this.teams);
    this.refreshTeams();
    // Request to backend to delete team
  }

  // ---- Modal ----

  openEditTeamModal(team: any) {
  const dialogRef = this.modal.open(EditTeamModalComponent, {
    width: '500px',
    data: { team }
  });

  dialogRef.afterClosed().subscribe(updatedTeam => {
    if (updatedTeam) {
      console.log('Équipe mise à jour :', updatedTeam);
      this.editTeam(updatedTeam.id, updatedTeam);
    }
  });
}

openDeleteTeamModal(team: any) {
  const dialogRef = this.modal.open(DeleteTeamModalComponent, {
    width: '500px',
    data: { team }
  });

  dialogRef.afterClosed().subscribe((updatedTeam) => {
    if (updatedTeam && updatedTeam.isDestroyed) {
      console.log('Équipe supprimée :', updatedTeam , "bool:", updatedTeam.isDestroyed);
      this.deleteTeam(updatedTeam.id);
    }
  });
}
  showAddModal() {
    const dialogRef = this.modal.open(CreateTeamModal, {
    width: '400px'
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('Nouvelle équipe créée :', result);
      this.addTeam(result.name, []);
    }
  });

  }
  showEditModal(teamId: number) {
    this.teamSelected = teamId;
    this.showAddTeamForm = true;
    console.log('Editing team with ID:', this.teamSelected);


  }

}
