import { Routes } from '@angular/router';

export const routes: Routes = [
    // Page de connexion
    {
        path: 'login',
        loadComponent: () =>
            import('./pages/login/login').then(m => m.LoginComponent),
    },

    // Dashboard employé
    {
        path: 'dashboard',
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
];
