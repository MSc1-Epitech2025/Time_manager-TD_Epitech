import * as XLSX from 'xlsx';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

// -----------------------------
// TYPES
// -----------------------------
export type ReportableEmployee = {
  name: string;
  team?: string;
  presence: number;
  late: number;
  absence?: number;
  absent?: number;
  weeklyHours?: number;
  productivity?: number;
  overtime?: number;
};

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
      [key: string]: any;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class ReportService {

  // ========================================================================
  // HELPERS — ENTÊTE / FOOTER
  // ========================================================================

  private buildFileName(base: string, ext: string): string {
    const date = new Date().toISOString().slice(0, 10);
    return `Document-${base}-${date}.${ext}`;
  }

 
  exportEmployeeKpiReport(kpiData: any) {
  const data = [
    ['Employee KPI Report'],
    [''],
    ['Name', kpiData.fullName],
    ['Period', `${kpiData.periodStart} → ${kpiData.periodEnd}`],
    [''],
    ['Metric', 'Value'],
    ['Presence Rate (%)', kpiData.presenceRate?.toFixed(1) ?? '0.0'],
    ['Avg Hours / Day', kpiData.avgHoursPerDay?.toFixed(1) ?? '0.0'],
    ['Overtime (hours)', kpiData.overtimeHours?.toFixed(1) ?? '0.0'],
    ['Punctuality (%)', (100 - (kpiData.punctuality?.lateRate || 0)).toFixed(1)],
    ['Avg Delay (minutes)', kpiData.punctuality?.avgDelayMinutes?.toFixed(0) ?? '0'],
    ['Absence Days', kpiData.absenceDays?.toFixed(1) ?? '0.0'],
    ['Reports Authored', kpiData.reportsAuthored ?? 0],
    ['Reports Received', kpiData.reportsReceived ?? 0],
  ];

  const hasAbsenceBreakdown =
    kpiData.absenceByType && kpiData.absenceByType.length > 0;

  if (hasAbsenceBreakdown) {
    data.push(['']);
    data.push(['Absence Breakdown']);
    data.push(['Type', 'Days']);
    kpiData.absenceByType.forEach((item: any) => {
      data.push([item.type, item.days?.toFixed(1) ?? '0.0']);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [{ wch: 30 }, { wch: 20 }];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
  ];

  const titleStyle = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: 'E6E6E6' } },
    alignment: { horizontal: 'center' },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  const cellStyle = {
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  const altCellStyle = {
    ...cellStyle,
    fill: { fgColor: { rgb: 'FAFAFA' } }
  };

 
  const range = XLSX.utils.decode_range(ws['!ref']!);

  for (let r = 0; r <= range.e.r; r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellRef];
      if (!cell) continue;

      // Titre
      if (r === 0) {
        cell.s = titleStyle;
        continue;
      }

      // Headers KPI + Absence
      if (
        (data[r][0] === 'Metric' && data[r][1] === 'Value') ||
        (data[r][0] === 'Type' && data[r][1] === 'Days')
      ) {
        cell.s = headerStyle;
        continue;
      }

      // Lignes de section
      if (data[r].length === 1) {
        cell.s = { font: { bold: true } };
        continue;
      }

      // Données
      cell.s = r % 2 === 0 ? altCellStyle : cellStyle;
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KPI Report');

  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true
  });

  saveAs(
    new Blob([buffer], { type: 'application/octet-stream' }),
    `kpi-report-${kpiData.fullName}.xlsx`
  );
}

  exportEmployeeReport(employee: ReportableEmployee) {
    const absenceValue = employee.absence ?? employee.absent ?? 0;

    const sheetData = [
      ['Name', 'Team', 'Attendance (%)', 'Delay (%)', 'Absence (%)'],
      [
        employee.name,
        employee.team ?? 'Not specified',
        employee.presence,
        employee.late,
        absenceValue
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport KPI');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([buffer], { type: 'application/octet-stream' }),
      this.buildFileName(`report-${employee.name}`, 'xlsx')
    );
  }

  exportEmployeesReport(employees: ReportableEmployee[]) {
  const sheetData = [
    ['Name', 'Team', 'Attendance (%)', 'Delay (%)', 'Absence (%)', 'Overtime (%)'],
    ...employees.map(e => [
      e.name,
      e.team ?? 'Not specified',
      e.presence,
      e.late,
      (e.absence ?? e.absent ?? 0),
      e.overtime ?? 0
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  
  ws['!cols'] = [
    { wch: 22 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 }
  ];

  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: 'center', vertical: 'center' },
    fill: { fgColor: { rgb: 'E6E6E6' } },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  const cellStyle = {
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  const altRowStyle = {
    ...cellStyle,
    fill: { fgColor: { rgb: 'F9F9F9' } }
  };

  const range = XLSX.utils.decode_range(ws['!ref']!);

  for (let row = 0; row <= range.e.r; row++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = ws[cellRef];
      if (!cell) continue;

      // Header
      if (row === 0) {
        cell.s = headerStyle;
      } else {
        cell.s = row % 2 === 0 ? altRowStyle : cellStyle;

        // Format %
        if (col >= 2) {
          cell.z = '0.00%';
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KPIs');

  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true
  });

  saveAs(
    new Blob([buffer]),
    this.buildFileName('rapport-employes', 'xlsx')
  );
}
}