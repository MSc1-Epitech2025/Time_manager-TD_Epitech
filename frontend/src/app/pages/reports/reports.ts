import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReportApiService } from '@core/services/report-api';
import { AuthService, Role } from '@core/services/auth';
import { Report } from '@shared/models/graphql.types';
import { formatDateTime, formatDateGroup } from '@shared/utils/date.utils';

interface ReportGroup {
  date: string;
  displayDate: string;
  reports: Report[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatExpansionModule,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class ReportsComponent implements OnInit {
  searchTerm = '';
  reports: Report[] = [];
  filteredReports: Report[] = [];
  groupedReports: ReportGroup[] = [];
  isLoading = false;
  lastError: string | null = null;
  selectedReport: Report | null = null;

  constructor(
    private readonly reportApi: ReportApiService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  get userRoles(): Role[] {
    return this.auth.session?.user?.roles || [];
  }

  get isAdmin(): boolean {
    return this.userRoles.includes('ADMIN');
  }

  get isManager(): boolean {
    return this.userRoles.includes('MANAGER');
  }

  loadReports(): void {
    this.isLoading = true;
    this.lastError = null;

    if (this.isAdmin) {
      this.reportApi.getAllReports().subscribe({
        next: (reports: Report[]) => {
          this.reports = reports;
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('[ReportsComponent] Error fetching reports:', error);
          this.reports = [];
          this.filteredReports = [];
          this.isLoading = false;
          this.lastError = error?.message ?? 'Unable to retrieve reports at this time.';
        },
      });
    } else if (this.isManager) {
      // managers: load both received and authored
      Promise.all([
        this.reportApi.getReportsForMe().toPromise(),
        this.reportApi.getMyReports().toPromise(),
      ])
        .then(([received, authored]) => {
          const receivedIds = new Set((received || []).map((r: Report) => r.id));
          const allReports = [...(received || [])];
          
          // add authored only if not in received
          (authored || []).forEach((report: Report) => {
            if (!receivedIds.has(report.id)) {
              allReports.push(report);
            }
          });

          this.reports = allReports;
          this.applyFilter();
          this.isLoading = false;
        })
        .catch((error: any) => {
          console.error('[ReportsComponent] Error fetching reports:', error);
          this.reports = [];
          this.filteredReports = [];
          this.isLoading = false;
          this.lastError = error?.message ?? 'Unable to retrieve reports at this time.';
        });
    } else {
      // employees: only authored
      this.reportApi.getMyReports().subscribe({
        next: (reports: Report[]) => {
          this.reports = reports;
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('[ReportsComponent] Error fetching reports:', error);
          this.reports = [];
          this.filteredReports = [];
          this.isLoading = false;
          this.lastError = error?.message ?? 'Unable to retrieve reports at this time.';
        },
      });
    }
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredReports = [...this.reports];
    } else {
      this.filteredReports = this.reports.filter(
        (report) =>
          report.title?.toLowerCase().includes(term) ||
          report.body?.toLowerCase().includes(term) ||
          report.authorEmail?.toLowerCase().includes(term) ||
          report.targetEmail?.toLowerCase().includes(term)
      );
    }
    
    // sort by date desc
    this.filteredReports.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // group by date
    this.groupedReports = this.groupReportsByDate(this.filteredReports);
  }

  groupReportsByDate(reports: Report[]): ReportGroup[] {
    const groups = new Map<string, Report[]>();
    
    reports.forEach(report => {
      if (!report.createdAt) return;
      
      const date = new Date(report.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(report);
    });
    
    return Array.from(groups.entries()).map(([dateKey, reports]) => {
      const date = new Date(dateKey);
      return {
        date: dateKey,
        displayDate: formatDateGroup(date),
        reports: reports
      };
    });
  }

  searchReports(): void {
    this.applyFilter();
  }

  selectReport(report: Report): void {
    this.selectedReport = this.selectedReport?.id === report.id ? null : report;
  }

  formatDate(dateStr?: string): string {
    return formatDateTime(dateStr);
  }

  getReportTypeChip(title?: string): string {
    if (!title) return 'default';
    const lower = title.toLowerCase();
    if (lower.includes('success')) return 'success';
    if (lower.includes('error')) return 'error';
    if (lower.includes('warning')) return 'warning';
    if (lower.includes('info')) return 'info';
    return 'default';
  }
}
