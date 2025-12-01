import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div style="text-align: center; padding-top: 50px;">
      <h2>Connexion via Microsoft...</h2>
      <p>Veuillez patienter...</p>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    try {
      const me = await this.auth.refreshProfile();
      console.log("me", me)

      if (!me) {
        this.router.navigate(['/fdsfsfsfsfsfssfsd']);
        return;
      }

      const roles = me.roles ?? [];

      if (roles.includes('ADMIN')) {
        this.router.navigate(['/enterprise']);
      } else if (roles.includes('MANAGER')) {
        this.router.navigate(['/employee']);
      } else {
        this.router.navigate(['/employee']);
      }

    } catch (e) {
      console.error(e);
      this.router.navigate(['/login']);
    }
  }
}
