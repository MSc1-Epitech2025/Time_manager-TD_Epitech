import { Routes } from '@angular/router';
import { authCanMatch, authCanActivate } from './core/auth-guard'; // <- même nom que ton fichier

export const routes: Routes = [
    // login
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
    },
    // employer test
    {
        path: 'employer',
        canMatch: [authCanMatch],
        canActivate: [authCanActivate],
        loadComponent: () => import('./pages/employer/employer').then(m => m.EmployerComponent),
    },
    { path: '', pathMatch: 'full', redirectTo: 'employer' },
    { path: '**', redirectTo: 'login' },
    // employee dashboard
    {
        path: 'empDashboard',
        loadComponent: () =>
            import('./pages/employee-dashboard/employee-dashboard')
                .then(m => m.EmployeeDashboard),
    },

    // Dashboard manager (vue principale)
    {
        path: 'manager',
        loadComponent: () =>
            import('./pages/manager-dashboard/manager-dashboard')
                .then(m => m.ManagerDashboard),
    },

    // Détail d’un employé (vue KPI et export Excel)
    {
        path: 'manager/employee/:id',
        loadComponent: () =>
            import('./pages/employee-detail/employee-detail')
                .then(m => m.EmployeeDetailComponent),
    },

    // Gestion du planning
    {
        path: 'manager/planning',
        loadComponent: () =>
            import('./pages/planning/planning')
                .then(m => m.PlanningComponent),
    },

    // Redirections
    { path: '', pathMatch: 'full', redirectTo: 'login' },
    { path: '**', redirectTo: 'login' },


    {
        path: 'employee',
        canMatch: [authCanMatch],       // empêche le chargement si non-auth
        canActivate: [authCanActivate], // ceinture + bretelles
        loadComponent: () =>
            import('./pages/employer/employer').then((m) => m.EmployerComponent),
    },

    // Par défaut on va sur la page privée : si pas de token, le guard renvoie vers /login
    { path: '', pathMatch: 'full', redirectTo: 'employer' },
    { path: '**', redirectTo: 'employer' },
];
