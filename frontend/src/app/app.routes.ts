import { Routes } from '@angular/router';
import { authCanMatch, authCanActivate, planningUrlGuard, adminGuard, managerGuard } from './core/guards/auth-guard';
import { ShellComponent } from './layout/shell/shell';
import {AuthCallbackComponent} from './auth/callback';

export const routes: Routes = [
    // Homepage
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/homepage/homepage').then(m => m.HomepageComponent),
    },

    // Login
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
    },

    // First login reset
    {
        path: 'first-login-reset',
        loadComponent: () => import('./pages/first-login-reset/first-login-reset').then(m => m.FirstLoginResetComponent),
    },

    // Callback to microsoft connection
    {
      path: "auth/callback",
      loadComponent: () => import('./auth/callback').then(m => m.AuthCallbackComponent)
    },

    {
        path: 'app',
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

            // Manager dashboard
            {
                path: 'manager',
                canActivate: [managerGuard],
                loadComponent: () => import('./pages/manager-dashboard/manager-dashboard')
                    .then(m => m.ManagerDashboard),
            },

            // Admin dashboard
            {
                path: 'enterprise',
                canActivate: [adminGuard],
                loadComponent: () => import('./pages/enterprise-dashboard/enterprise-dashboard')
                    .then(m => m.EnterpriseDashboard),
            },

            // Manager detail
            {
                path: 'manager/employee/:id',
                canActivate: [managerGuard],
                loadComponent: () => import('./pages/employee-detail/employee-detail')
                    .then(m => m.EmployeeDetailComponent),
            },

            // Planning
            {
                path: 'planning',
                canActivate: [planningUrlGuard],
                loadComponent: () => import('./pages/planning/planning')
                    .then(m => m.PlanningComponent),
            },

            // Teams (Manager only)
            {
                path: 'teams',
                canActivate: [managerGuard],
                loadComponent: () => import('./pages/team-management/team-management')
                    .then(m => m.TeamManagement),
            },

            // Users (Admin only)
            {
                path: 'users',
                canActivate: [adminGuard],
                loadComponent: () => import('./pages/users/users')
                    .then(m => m.UsersComponent),
            },

            // Default
            { path: '', pathMatch: 'full', redirectTo: 'employee' },
        ]
    },

    // Catch all
    { path: '**', redirectTo: '' }
];
