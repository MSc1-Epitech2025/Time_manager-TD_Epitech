import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService, Session } from '../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  sessionSig = toSignal<Session | null>(this.auth.sessionChanges$, { initialValue: null });

  roleRaw = computed<unknown>(() => this.sessionSig()?.user?.role ?? null);

  roleText = computed<string>(() => {
    const r = this.roleRaw();
    if (Array.isArray(r)) return r.map(v => String(v)).join(' ').toUpperCase();
    if (typeof r === 'string') return r.toUpperCase();
    return String(r ?? '').toUpperCase();
  });

  has = (name: string) => this.roleText().includes(name.toUpperCase());

  isManager = computed(() => this.has('MANAGER'));
  isAdmin = computed(() => this.has('ADMIN'));
  isEmployee = computed(() => this.has('EMPLOYEE') || this.has('MANAGER') || this.has('ADMIN'));

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
