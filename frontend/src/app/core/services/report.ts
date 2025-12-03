import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Injectable } from '@angular/core';

type ReportableEmployee = {
  name: string;
  team?: string;
  presence: number;
  late: number;
  absence?: number;
  absent?: number;
};

@Injectable({ providedIn: 'root' })
export class ReportService {
  exportEmployeeReport(employee: ReportableEmployee) {
    const absenceValue = employee.absence ?? employee.absent ?? 0;
    const data = [
      ['Nom', 'Equipe', 'Presence (%)', 'Retards (%)', 'Absence (%)'],
      [
        employee.name,
        employee.team ?? 'Non renseignee',
        employee.presence,
        employee.late,
        absenceValue,
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `rapport-${employee.name}.xlsx`);
  }

  exportEmployeeKpiReport(kpiData: any) {
    const data = [
      ['Employee KPI Report'],
      [''],
      ['Name', kpiData.fullName],
      ['Period', `${kpiData.periodStart} to ${kpiData.periodEnd}`],
      [''],
      ['Metric', 'Value'],
      ['Presence Rate (%)', kpiData.presenceRate?.toFixed(1) || '0.0'],
      ['Avg Hours/Day', kpiData.avgHoursPerDay?.toFixed(1) || '0.0'],
      ['Overtime (hours)', kpiData.overtimeHours?.toFixed(1) || '0.0'],
      ['Punctuality (%)', (100 - (kpiData.punctuality?.lateRate || 0)).toFixed(1)],
      ['Avg Delay (minutes)', kpiData.punctuality?.avgDelayMinutes?.toFixed(0) || '0'],
      ['Absence Days', kpiData.absenceDays?.toFixed(1) || '0.0'],
      ['Reports Authored', kpiData.reportsAuthored || 0],
      ['Reports Received', kpiData.reportsReceived || 0],
    ];

    if (kpiData.absenceByType && kpiData.absenceByType.length > 0) {
      data.push(['']);
      data.push(['Absence Breakdown']);
      data.push(['Type', 'Days']);
      kpiData.absenceByType.forEach((item: any) => {
        data.push([item.type, item.days?.toFixed(1) || '0.0']);
      });
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KPI Report');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `kpi-report-${kpiData.fullName}.xlsx`);
  }
}

