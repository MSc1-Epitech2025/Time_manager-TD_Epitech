import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth';

@Component({
  selector: 'app-log-history',
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './log-history.html',
  styleUrl: './log-history.scss'
})
export class LogHistory {
  logs = [
    { employeeName: 'Richard', date: '2024-10-01', checkIn: '09:00', checkOut: '17:00', totalHours: '8h', type: 'On time' },
    { employeeName: 'Joe', date: '2024-10-02', checkIn: '09:15', checkOut: '17:00', totalHours: '7h 45m', type: 'Late' },
  ];
  filteredLog = [
    { employeeName: 'Richard', date: '2024-10-01', checkIn: '09:00', checkOut: '17:00', totalHours: '8h', type: 'On time' },
  ];
  searchValue: string = '';

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    this.filteredLog = this.logs;
  }

  filterSearch() {
    this.filteredLog = this.logs.filter(log =>
      log.employeeName.toLowerCase().includes(this.searchValue.toLowerCase())
    );
    console.log('Filtering logs', this.searchValue);
  }

  goToDashboard() {
    this.router.navigate(['/enterprise']);
  }
  goToCalendar() {
    this.router.navigate(['/calendar']);
  }
  goToTeamManagement() {
    this.router.navigate(['/teams']);
  }

  goToPlanning() {
    this.router.navigate(['/planning']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

}
