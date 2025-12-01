import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ReportableEmployee = {
  name: string;
  team?: string;
  presence: number;
  late: number;
  absence?: number;
  absent?: number;
  weeklyHours?: number;
  productivity?: number;
  tasksDone?: number;
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

  // ========================================================
  // EXCEL — Un employé
  // ========================================================
  exportEmployeeReport(employee: ReportableEmployee) {
    const absenceValue = employee.absence ?? employee.absent ?? 0;

    const data = [
      ['Nom', 'Equipe', 'Présence (%)', 'Retards (%)', 'Absence (%)'],
      [
        employee.name,
        employee.team ?? 'Non renseignée',
        employee.presence.toString(),
        employee.late.toString(),
        absenceValue.toString()
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/octet-stream'
    });

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

  // ========================================================
  // PDF — Un employé | Version stylée
  // ========================================================
  exportEmployeeReportPdf(employee: ReportableEmployee) {
    const emp = employee;
    const absenceValue = emp.absence ?? emp.absent ?? 0;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // HEADER
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(`Rapport KPI - ${emp.name}`, 14, 16);

    // KPI CARDS VISUELS
    const kpiCards = [
      { label: 'Présence', value: `${emp.presence}%`, color: [76, 175, 80] },
      { label: 'Retards', value: `${emp.late}%`, color: [255, 152, 0] },
      { label: 'Absence', value: `${absenceValue}%`, color: [244, 67, 54] },
      { label: 'Heures / Semaine', value: `${emp.weeklyHours ?? 0}h`, color: [33, 150, 243] },
      { label: 'Productivité', value: `${emp.productivity ?? 0}%`, color: [156, 39, 176] },
      { label: 'Tâches réalisées', value: `${emp.tasksDone ?? 0}`, color: [0, 188, 212] }
    ];

    let x = 14;
    let y = 35;
    doc.setFontSize(12);

    kpiCards.forEach((card, i) => {
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.roundedRect(x, y, 60, 22, 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.text(card.label, x + 4, y + 8);

      doc.setFontSize(16);
      doc.text(card.value, x + 4, y + 18);

      x += 68;
      if ((i + 1) % 3 === 0) {
        x = 14;
        y += 30;
      }
      doc.setFontSize(12);
    });

    // TABLE INFO
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Informations détaillées', 14, y + 25);

    autoTable(doc, {
      startY: y + 30,
      head: [['Champ', 'Valeur']],
      body: [
        ['Nom', emp.name.toString()],
        ['Équipe', (emp.team ?? 'Non renseignée').toString()],
        ['Présence', `${emp.presence}%`],
        ['Retards', `${emp.late}%`],
        ['Absence', `${absenceValue}%`],
        ['Heures / semaine', `${emp.weeklyHours ?? 0}h`],
        ['Productivité', `${emp.productivity ?? 0}%`],
        ['Tâches réalisées', `${emp.tasksDone ?? 0}`],
      ].map(row => row.map(v => v.toString()))
    });

    doc.save(`rapport-${emp.name}.pdf`);
  }

  // ========================================================
  // PDF — Un employé AVEC GRAPHIQUE Chart.js
  // ========================================================
  exportEmployeeReportPdfWithChart(employee: ReportableEmployee, chartImage: string) {
    const emp = employee;
    const absenceValue = emp.absence ?? emp.absent ?? 0;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // HEADER
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(`Rapport KPI - ${emp.name}`, 14, 16);

    // KPI CARDS
    const cards = [
      { label: 'Présence', value: `${emp.presence}%`, color: [76, 175, 80] },
      { label: 'Retards', value: `${emp.late}%`, color: [255, 152, 0] },
      { label: 'Absence', value: `${absenceValue}%`, color: [244, 67, 54] },
      { label: 'Heures / semaine', value: `${emp.weeklyHours ?? 0}h`, color: [33, 150, 243] },
      { label: 'Productivité', value: `${emp.productivity ?? 0}%`, color: [156, 39, 176] },
      { label: 'Tâches réalisées', value: `${emp.tasksDone ?? 0}`, color: [0, 188, 212] },
    ];

    let x = 14;
    let y = 35;

    cards.forEach((card, i) => {
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.roundedRect(x, y, 60, 22, 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(card.label, x + 4, y + 8);

      doc.setFontSize(16);
      doc.text(card.value, x + 4, y + 18);

      x += 68;
      if ((i + 1) % 3 === 0) {
        x = 14;
        y += 30;
      }
    });

    // TABLE INFO
    autoTable(doc, {
      startY: y + 30,
      head: [['Champ', 'Valeur']],
      body: [
        ['Nom', emp.name],
        ['Équipe', emp.team ?? 'Non renseignée'],
        ['Présence', `${emp.presence}%`],
        ['Retards', `${emp.late}%`],
        ['Absence', `${absenceValue}%`],
        ['Heures / semaine', `${emp.weeklyHours ?? 0}h`],
        ['Productivité', `${emp.productivity ?? 0}%`],
        ['Tâches réalisées', `${emp.tasksDone ?? 0}`],
      ]
    });

    // CHART IMAGE
    const chartY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(18);
    doc.text('Graphique KPI', 14, chartY);

    doc.addImage(chartImage, 'PNG', 14, chartY + 5, 180, 80);

    doc.save(`rapport-${emp.name}-avec-graphique.pdf`);
  }

  // ========================================================
  // EXCEL — Plusieurs employés
  // ========================================================
  exportEmployeesReport(employees: ReportableEmployee[]) {
    const data = [
      ['Nom', 'Equipe', 'Présence (%)', 'Retards (%)', 'Absence (%)'],
      ...employees.map(e => [
        e.name,
        e.team ?? 'Non renseignée',
        e.presence.toString(),
        e.late.toString(),
        (e.absence ?? e.absent ?? 0).toString()
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/octet-stream'
    });

    saveAs(blob, `rapport-employes.xlsx`);
  }

  // ========================================================
  // PDF — Plusieurs employés
  // ========================================================
  exportEmployeesReportPdf(employees: ReportableEmployee[]) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Rapport des employés', 14, 20);

    const rows = employees.map(e => [
      e.name,
      e.team ?? 'Non renseignée',
      `${e.presence}%`,
      `${e.late}%`,
      `${e.absence ?? e.absent ?? 0}`
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Nom', 'Equipe', 'Présence', 'Retards', 'Absence']],
      body: rows
    });

    doc.save(`rapport-employes.pdf`);
  }
}
