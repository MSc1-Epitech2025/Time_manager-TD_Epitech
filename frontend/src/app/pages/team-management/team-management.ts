import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-team-management',
  imports: [MatIconModule, MatButtonModule , CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule],
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


  constructor(private router: Router, private auth: AuthService) {}

  searchTeams() {
    console.log('Searching for teams with term:', this.searchTerm);
    // Request to backend to search teams
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
  addTeam() {
    console.log('Adding new team');
    // Request to backend to add new team
  }

  editTeam(teamId: number) {
    
    // requete backend pour modifier l'equipe
  }

  deleteTeam(teamId: number) {
    console.log('Deleting team with ID:', teamId);
    // Request to backend to delete team
  }

  // ---- Modal ----
  showEditModal(teamId: number) {
    this.teamSelected = teamId;
    this.showAddTeamForm = true;
    console.log('Editing team with ID:', this.teamSelected);
    

  }


// ---------- routes ----------
  
  goToPlanning() {
    this.router.navigate(['/manager/planning']);
  }
  goToPresenceLogs() {
    this.router.navigate(['/manager/presence-logs']);
  }
  goToDashboard() {
    this.router.navigate(['/manager']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

}
