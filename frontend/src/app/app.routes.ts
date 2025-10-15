import { Routes } from '@angular/router';
import { authCanMatch, authCanActivate, roleCanActivate } from './core/services/auth-guard';

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
        canActivate: [authCanActivate, roleCanActivate], // ✅ remplacement ici
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

    // --- Planning ---
    {
        path: 'manager/planning',
        canMatch: [authCanMatch],
        canActivate: [authCanActivate],
        loadComponent: () => import('./pages/planning/planning')
            .then(m => m.PlanningComponent),
    },

    // --- Default ---
    { path: '', pathMatch: 'full', redirectTo: 'login' },
    { path: '**', redirectTo: 'login' },
];
