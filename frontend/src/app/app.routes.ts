import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./pages/login/login').then(m => m.LoginComponent),
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./pages/employee-dashboard/employee-dashboard').then(m => m.EmployeeDashboard),
    },
    { path: '', pathMatch: 'full', redirectTo: 'login' },
    { path: 'dashboard', pathMatch: 'full', redirectTo: 'dashboard' },
    { path: '**', redirectTo: 'login' },

];
