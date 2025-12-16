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

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    try {

      const params = new URLSearchParams(window.location.search);

      const id = params.get("id");
      const email = params.get("email");
      const firstName = params.get("firstName");
      const lastName = params.get("lastName");
      const role = params.get("role");

      console.log("Query Params reçus :", { id, email, firstName, lastName, role });

      if (!id || !email) {
        console.error("Paramètres manquants dans la redirection OAuth.");
        this.router.navigate(['/login']);
        return;
      }

      const user = this.auth.normalizeUser({
        id,
        email,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        roles: this.auth.extractRoles(role ?? 'EMPLOYEE')
      });

      this.auth.loginSuccess({
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user
      }, true);

      const roles = user.roles ?? [];

      if (roles.includes('ADMIN')) {
        this.router.navigate(['/app/enterprise']);
      } else if (roles.includes('MANAGER')) {
        this.router.navigate(['/app/employee']);
      } else {
        this.router.navigate(['/app/employee']);
      }

    } catch (e) {
      console.error("Erreur callback OAuth", e);
      this.router.navigate(['/login']);
    }
  }
}
