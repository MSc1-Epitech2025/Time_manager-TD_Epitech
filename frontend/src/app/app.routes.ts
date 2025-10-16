// app.routes.ts
import { Routes } from '@angular/router';
import { authCanMatch, authCanActivate, roleCanActivate, planningUrlGuard } from './core/guards/auth-guard';
import { ShellComponent } from './layout/shell/shell';

export const routes: Routes = [
    // --- Login ---
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
    },

    {
        path: '',
        component: ShellComponent,
        canMatch: [authCanMatch],
        canActivate: [authCanActivate],
        children: [
            // Employee dashboard
            {
                path: 'employee',
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

    // --- Enterprise dashboard ---
    {
        path: 'enterprise',
        
        
        loadComponent: () => import('./pages/enterprise-dashboard/enterprise-dashboard')
            .then(m => m.EnterpriseDashboard),
    },

            // Manager detail
            {
                path: 'manager/employee/:id',
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

            // Default
            { path: '', pathMatch: 'full', redirectTo: 'planning' },
            { path: '**', redirectTo: 'planning' },
        ],
    },
];
