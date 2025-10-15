// app.routes.ts
import { Routes } from '@angular/router';
import { authCanMatch, authCanActivate, roleCanActivate, planningUrlGuard } from './core/services/auth-guard';

export const routes: Routes = [
    // --- Login ---
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
    },

    // --- Employee dashboard ---
    {
        path: 'employee',
        canMatch: [authCanMatch],
        canActivate: [authCanActivate],
        loadComponent: () => import('./pages/employee-dashboard/employee-dashboard')
            .then(m => m.EmployeeDashboard),
    },

    // --- Manager dashboard ---
    {
        path: 'manager',
        canMatch: [authCanMatch],
        canActivate: [authCanActivate, roleCanActivate],
        loadComponent: () => import('./pages/manager-dashboard/manager-dashboard')
            .then(m => m.ManagerDashboard),
    },

    // --- Manager detail ---
    {
        path: 'manager/employee/:id',
        canMatch: [authCanMatch],
        canActivate: [authCanActivate],
        loadComponent: () => import('./pages/employee-detail/employee-detail')
            .then(m => m.EmployeeDetailComponent),
    },

    // --- Planning (page principale) ---
    {
        path: 'planning',
        canMatch: [authCanMatch],
        canActivate: [authCanActivate, planningUrlGuard], // <- pas de roleCanActivate ici
        loadComponent: () => import('./pages/planning/planning')
            .then(m => m.PlanningComponent),
    },

    // --- Default ---
    { path: '', pathMatch: 'full', redirectTo: 'planning' }, // optionnel mais recommandé
    { path: '**', redirectTo: 'planning' },
];
