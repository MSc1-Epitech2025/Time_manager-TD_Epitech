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
}

