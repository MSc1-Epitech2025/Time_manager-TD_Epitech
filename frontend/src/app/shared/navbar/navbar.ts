import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService, Role, Session } from '../../core/services/auth';
import { WeatherBadgeComponent } from '../components/weather-badge/weather-badge';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatToolbarModule, WeatherBadgeComponent],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  sessionSig = toSignal<Session | null>(this.auth.sessionChanges$, { initialValue: null });

  private roles = computed<Role[]>(() => this.sessionSig()?.user?.roles ?? []);

  private hasRole(role: Role): boolean {
    return this.roles().includes(role);
  }

  isManager = computed(() => this.hasRole('MANAGER') || this.hasRole('ADMIN'));
  isAdmin = computed(() => this.hasRole('ADMIN'));
  isEmployee = computed(() =>
    this.hasRole('EMPLOYEE') || this.hasRole('MANAGER') || this.hasRole('ADMIN')
  );

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
