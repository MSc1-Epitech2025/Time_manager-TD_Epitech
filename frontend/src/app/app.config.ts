import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

// services + interceptor (chemins à adapter si besoin)
import { AuthService } from './core/auth';
import { TimerService } from './core/timer';
import { AuthInterceptor } from './core/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),

    // Active la chaîne d'interceptors (dont AuthInterceptor)
    provideHttpClient(withInterceptorsFromDi()),

    // Interceptor qui ajoute le Bearer token et gère les 401
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },

    // Réhydrate l'auth au boot (avant premier rendu)
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.hydrateFromStorage(),
      deps: [AuthService],
      multi: true,
    },

    // Relance proprement le timer après reload
    {
      provide: APP_INITIALIZER,
      useFactory: (t: TimerService) => () => t.hydrate(),
      deps: [TimerService],
      multi: true,
    },
  ],
};
