import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule, NgIf, NgStyle } from '@angular/common';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';

// aunth service
import { AuthService, Role } from '../../core/services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { NotificationService } from '@core/services/notification';

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  m: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NgIf, NgStyle,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule, MatDividerModule,
    MatCheckboxModule, MatRippleModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);

  hidePwd = signal(true);
  loading = signal(false);
  theme = signal<'light' | 'dark'>('light');

  bubbles: Bubble[] = [];
  private animationId?: number;

  mouse = { x: 0, y: 0, active: false };

  ngOnInit() {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('tm-theme') as 'light' | 'dark' | null;
    this.setTheme(saved ?? (prefersDark ? 'dark' : 'light'));

    this.initBubbles();
    this.animate();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId!);
  }

  initBubbles() {
    const width = window.innerWidth * 0.55;
    const height = window.innerHeight;

    const bubbleCount = 3 + Math.random() * 7;
    this.bubbles = Array.from({ length: bubbleCount }).map(() => {
      const r = 20 + Math.random() * 80;
      return {
        x: Math.random() * (width - r * 2),
        y: Math.random() * (height - r * 2),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        r,
        m: r * 0.5
      };
    });
  }


  onMouseMove(event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
    this.mouse.active = true;
  }

  onMouseLeave() {
    this.mouse.active = false;
  }

  animate() {
    const width = window.innerWidth * 0.55;
    const height = window.innerHeight;

    const loop = () => {
      this.bubbles.forEach(b => {
        if (this.mouse.active) {
          const dx = b.x + b.r - this.mouse.x;
          const dy = b.y + b.r - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = b.r * 1.8;

          if (dist < minDist) {
            const force = (1 - dist / minDist) * 2.5;
            const nx = dx / dist;
            const ny = dy / dist;
            b.vx += nx * force;
            b.vy += ny * force;
          }
        }

        b.vx = Math.max(Math.min(b.vx, 3), -3);
        b.vy = Math.max(Math.min(b.vy, 3), -3);

        b.x += b.vx * 1.8;
        b.y += b.vy * 1.8;

        if (b.x < 0) { b.x = 0; b.vx *= -1; }
        if (b.x + b.r * 2 > width) { b.x = width - b.r * 2; b.vx *= -1; }
        if (b.y < 0) { b.y = 0; b.vy *= -1; }
        if (b.y + b.r * 2 > height) { b.y = height - b.r * 2; b.vy *= -1; }
      });

      for (let i = 0; i < this.bubbles.length; i++) {
        for (let j = i + 1; j < this.bubbles.length; j++) {
          this.handleCollision(this.bubbles[i], this.bubbles[j]);
        }
      }

      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  handleCollision(a: Bubble, b: Bubble) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = a.r + b.r;

    if (dist < minDist) {
      const nx = dx / dist;
      const ny = dy / dist;
      const p = 2 * (a.vx * nx + a.vy * ny - b.vx * nx - b.vy * ny) / (a.m + b.m);

      a.vx -= p * b.m * nx;
      a.vy -= p * b.m * ny;
      b.vx += p * a.m * nx;
      b.vy += p * a.m * ny;

      const overlap = 0.5 * (minDist - dist + 0.1);
      a.x -= overlap * nx;
      a.y -= overlap * ny;
      b.x += overlap * nx;
      b.y += overlap * ny;
    }
  }

  getBubbleStyle(i: number) {
    const b = this.bubbles[i];
    return {
      transform: `translate(${b.x}px, ${b.y}px)`,
      width: `${b.r * 2}px`,
      height: `${b.r * 2}px`
    };
  }

  toggleTheme() {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  private setTheme(next: 'light' | 'dark') {
    this.theme.set(next);
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(next === 'dark' ? 'theme-dark' : 'theme-light');
    root.setAttribute('data-theme', next);
    localStorage.setItem('tm-theme', next);
  }

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);

    (async () => {
      try {
        const email = this.form.value.email!;
        const password = this.form.value.password!;
        const remember = !!this.form.value.remember;

        const session = await this.auth.login(email, password, remember);
        const roles = session.user.roles ?? [];
        const has = (role: Role) => roles.includes(role);

        if (has('ADMIN')) {
          this.router.navigate(['/app/enterprise']);
        } else if (has('MANAGER')) {
          this.router.navigate(['/app/employee']);
        } else if (has('EMPLOYEE')) {
          this.router.navigate(['/app/employee']);
        } else {
          this.router.navigate(['/']);
          console.error('Unknown user roles:', roles);
        }

      } catch (e) {
        this.notify.error('Identifiants invalides ou service indisponible.');
        console.error(e);
      } finally {
        this.loading.set(false);
      }
    })();
  }


  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }

  loginWithMicrosoft() {
    window.location.href = `${environment.AZURE_URL}/oauth2/authorization/azure-dev`;
  }

}

