import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.add(prefersDark ? 'theme-dark' : 'theme-light');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
