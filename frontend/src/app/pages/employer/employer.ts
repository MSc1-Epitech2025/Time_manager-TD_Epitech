import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Material (assure-toi d'avoir @angular/material installé)
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

// Services (chemins à adapter si besoin)
import { TimerService } from '../../core/services/timer';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-employer',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDividerModule],
  templateUrl: './employer.html',
  styleUrls: ['./employer.scss'],
})
export class EmployerComponent {
  private timer = inject(TimerService);
  private auth = inject(AuthService);
  private router = inject(Router);

  // flux de secondes écoulées depuis le clock-in
  elapsed$ = this.timer.elapsedSec$;

  // pour l’affichage en sous-titre
  now = new Date();

  start(): void {
    this.timer.startClock(); // stocke l’heure actuelle et lance le ticker
  }

  stop(): void {
    this.timer.stopClock(); // efface le clock-in et remet à zéro l’affichage
  }

  logout(): void {
    this.timer.stopClock();   // optionnel mais propre
    this.auth.logout();       // efface la session
    this.router.navigate(['/login']);
  }

  // petit helper d'affichage HH:MM:SS
  formatSeconds(total: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
}
