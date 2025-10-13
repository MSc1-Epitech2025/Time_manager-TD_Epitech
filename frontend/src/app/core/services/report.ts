import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReportService {
  exportEmployeeReport(employee: any) {
    const data = [
      ['Nom', 'Équipe', 'Présence (%)', 'Retards (%)', 'Absence (%)'],
      [employee.name, employee.team, employee.presence, employee.late, employee.absent]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `rapport-${employee.name}.xlsx`);
  }
}
