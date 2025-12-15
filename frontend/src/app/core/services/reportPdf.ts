import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
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
export class ReportPdfService {

    private buildFileName(base: string, ext: string): string {
    const date = new Date().toISOString().slice(0, 10);
    return `Document-${base}-${date}.${ext}`;
  }

 private generateHeader(doc: jsPDF, title: string, subtitle?: string) {
  const width = 210;  
  const height = 48;

  const colorStops = [
    { pos: 0,   r: 167, g: 139, b: 250 }, 
    { pos: 0.5, r: 192, g: 132, b: 252 }, 
    { pos: 1,   r: 232, g: 121, b: 249 }  
  ];

  for (let x = 0; x < width; x++) {
    const t = x / width;
    let left = colorStops[0];
    let right = colorStops[colorStops.length - 1];

    for (let i = 0; i < colorStops.length - 1; i++) {
      if (t >= colorStops[i].pos && t <= colorStops[i + 1].pos) {
        left = colorStops[i];
        right = colorStops[i + 1];
        break;
      }
    }

    const localT = (t - left.pos) / (right.pos - left.pos);

    const r = Math.round(left.r + (right.r - left.r) * localT);
    const g = Math.round(left.g + (right.g - left.g) * localT);
    const b = Math.round(left.b + (right.b - left.b) * localT);

    doc.setFillColor(r, g, b);
    doc.rect(x, 0, 1, height, "F");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(245, 245, 255);
    doc.text(subtitle, 14, 30);
  }
}

  private addFooter(doc: jsPDF) {
    doc.setFontSize(9);
doc.setTextColor(130, 120, 200);
  }
    // ========================================================================
  // PDF — EMPLOYEE INDIVIDUAL
  // ========================================================================
  exportEmployeeReportPdf(employee: ReportableEmployee, chartImage?: string) {
  const doc = new jsPDF();
  const absenceValue = employee.absence ?? employee.absent ?? 0;

  doc.setFillColor(30, 29, 42);
  doc.rect(0, 0, 210, 297, "F");

  this.generateHeader(
    doc,
    `KPI report – ${employee.name}`,
    "Detailed performance analysis"
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);

  let infoY = 58;
  doc.text(`Generated on : ${new Date().toLocaleDateString()}`, 14, infoY);
  doc.text(`Team : ${employee.team ?? 'Not specified'}`, 14, infoY + 6);

  let y = infoY + 25;

  // =====================================================
  // SECTION 1 — Résumé KPI (Cards)
  // =====================================================
  const kpiCards = [
    {
      label: 'Attendance',
      value: `${employee.presence}%`,
      bg: [78, 110, 78]
    },
    {
      label: 'Delay',
      value: `${employee.late}%`,
      bg: [168, 122, 60] 
    },
    {
      label: 'Absences',
      value: `${absenceValue}`,
      bg: [138, 76, 76] 
    },
    {
      label: 'Productivity',
      value: `${employee.productivity ?? 0}%`,
      bg: [40, 90, 200],
    },
    {
      label: 'Hours / Week',
      value: `${employee.weeklyHours ?? 0}h`,
       bg: [120, 60, 200],
    },
    {
      label: 'Overtime',
      value: `${employee.overtime ?? 0}h`,
      bg: [100, 40, 150],
    }
  ];

  let x = 14;
  kpiCards.forEach((card, i) => {
    const [r, g, b] = card.bg;

  doc.setFillColor(r, g, b);
  doc.roundedRect(x, y, 58, 30, 4, 4, 'F');

  // Label
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`${card.label}`, x + 5, y + 10);
  doc.setFontSize(18);
  doc.text(`${card.value}`, x + 5, y + 24);

  // Move to next card
  x += 62;
  if ((i + 1) % 3 === 0) {
    x = 14;
    y += 40;
  }
  });

  y += 15;

  // =====================================================
  // SECTION 2 — Detailed Analysis
  // =====================================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(167, 139, 250);
  doc.text("Detailed analysis", 14, y);

  autoTable(doc, {
    startY: y + 6,
    head: [['Indicator', 'Value', 'Analysis']],
    body: [
      ['Attendance', `${employee.presence}%`,
        employee.presence > 85 ? 'Very good' :
        employee.presence > 60 ? 'Correct' : 'Needs improvement'
      ],
      ['Delay', `${employee.late}%`,
        employee.late > 20 ? 'Frequent' :
        employee.late > 10 ? 'Moderate' : 'Rare'
      ],
      ['Absences', `${absenceValue}`,
        absenceValue > 3 ? 'Frequent' : 'Normal'
      ],
      ['Hours / Week', `${employee.weeklyHours ?? 0}h`,
        (employee.weeklyHours ?? 0) > 8 ? 'Overload' : 'Normal'
      ],
      ['Productivity', `${employee.productivity}%`,
        (employee.productivity ?? 0) > 80 ? 'Good' : 'Needs improvement'
      ],
      ['Overtime', `${employee.overtime ?? 0}h`,
        employee.overtime && employee.overtime > 5 ? 'Too much' : 'Normal'
      ]
    ],
    styles: {
      fontSize: 10,
      textColor: [230, 230, 255],
      fillColor: [25, 20, 35]
    },
    headStyles: {
      fillColor: [120, 90, 230],
      textColor: 255
    },
    alternateRowStyles: {
      fillColor: [35, 30, 50]
    },
    margin: { left: 14, right: 14 }
  });

  let chartStartY = doc.lastAutoTable.finalY + 16;

  // =====================================================
  // SECTION 3 — Recommandations
  // =====================================================
  doc.setFontSize(16);
  doc.setTextColor(167, 139, 250);
  doc.text("Recommandations", 14, chartStartY + 10);

  doc.setFontSize(12);
  doc.setTextColor(230, 230, 255);

  const recommendations = [
    employee.late > 20 ? "- Reducing delays through logistical maintenance." : null,
    employee.productivity && employee.productivity < 70 ? "- Improve productivity through better planning." : null,
    absenceValue > 3 ? "- Investigate the cause of frequent absences." : null,
    employee.presence < 60 ? "- Monitor attendance to avoid a drop in performance." : null
  ].filter(Boolean);

  if (recommendations.length === 0) recommendations.push("No alerts. The indicators are satisfactory.");

  recommendations.forEach((line, i) => {
    doc.text(line!, 14, chartStartY + 18 + i * 6);
  });

  this.addFooter(doc);
  doc.save(this.buildFileName(`report-${employee.name}`, 'pdf'));
}

// ========================================================================
  // PDF — Employees Report
  // ========================================================================
  async exportEmployeesReportPdf(teamName: string,
  employees: ReportableEmployee[],
  chartImagePresence?: string,
  chartImageProductivity?: string) {
    const doc = new jsPDF();

  const now = new Date().toLocaleDateString();
  const totalEmployees = employees.length;
  doc.setFillColor(30, 29, 42);
  doc.rect(0, 0, 210, 297, "F");

  this.generateHeader(
    doc,
    `KPI Report – Team ${teamName}`,
    "Comprehensive analysis of team indicators"
  );

doc.setFont("helvetica", "normal");
doc.setFontSize(11);
doc.setTextColor(255, 255, 255);

let infoY = 58;

doc.text(`Generate on : ${now}`, 200, infoY, { align: "right" });
doc.text(`Team : ${teamName}`, 200, infoY + 6, { align: "right" });
doc.text(`Number of employee : ${totalEmployees}`, 200, infoY + 12, { align: "right" });

let y = infoY + 22;
let x = 14;

  // =========================================================
  // SECTION 1 — KPI Overview
  // =========================================================

doc.setFont("helvetica", "bold");
doc.setFontSize(15);
doc.setTextColor(167, 139, 250);
doc.text("KPI Overview", 14, y - 5);

  const avgPresence = Math.round(
    employees.reduce((s, e) => s + (e.presence ?? 0), 0) / totalEmployees
  );

  const avgLate = Math.round(
    employees.reduce((s, e) => s + (e.late ?? 0), 0) / totalEmployees
  );

  const totalAbsence = employees.reduce(
    (s, e) => s + (e.absence ?? e.absent ?? 0),
    0
  );

  const avgHours = Math.round(
    employees.reduce((s, e) => s + (e.weeklyHours ?? 0), 0) / totalEmployees
  );

  const avgProductivity = Math.round(
    employees.reduce((s, e) => s + (e.productivity ?? 0), 0) / totalEmployees
  );

  const totalOvertime = employees.reduce((s, e) => s + (e.overtime ?? 0), 0);
  const avgOvertime = Math.round(totalOvertime / totalEmployees);
  
  const kpiCards = [
     {
    label: "Attendance Avg",
    value: `${avgPresence}%`,
    bg: [78, 110, 78],
  },
  {
    label: "Late Avg",
    value: `${avgLate}%`,
    bg: [168, 122, 60],
  },
  {
    label: "Absences",
    value: `${totalAbsence}`,
    bg: [138, 76, 76],
  },
  {
    label: "Productivity Avg",
    value: `${avgProductivity}%`,
    bg: [40, 90, 200],
  },
  {
    label: "Hours/Day Avg",
    value: `${avgHours}h`,
    bg: [120, 60, 200],
  },
  {
    label: "Overtime Avg",
    value: `${avgOvertime}h`,
    bg: [100, 40, 150],
  }
];

kpiCards.forEach((card, i) => {
  const [r, g, b] = card.bg;

  doc.setFillColor(r, g, b);
  doc.roundedRect(x, y, 58, 30, 4, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`${card.label}`, x + 5, y + 10);

  doc.setFontSize(18);
  doc.text(`${card.value}`, x + 5, y + 24);

  x += 62;
  if ((i + 1) % 3 === 0) {
    x = 14;
    y += 40;
  }
});

  // =========================================================
  // SECTION 2 — Detailed Employee Table
  // =========================================================

  doc.setFont("helvetica", "bold");
doc.setFontSize(15);
doc.setTextColor(167, 139, 250);
doc.text("Details by employee", 14, y);


  const tableRows = employees.map(e => [
    e.name,
    `${e.presence}%`,
    `${e.late}%`,
    `${e.absence ?? e.absent ?? 0}`,
    `${e.productivity}%`,
    `${e.weeklyHours ?? 0}h`,
    `${e.overtime ?? 0}`
  ]);

  autoTable(doc, {
  startY: y + 6,
  head: [['Name', 'Attendance', 'Delays', 'Absences', 'Productivity', 'Hours/D', 'Overtime']],
  body: employees.map(e => [
    e.name,
    `${e.presence}%`,
    `${e.late}%`,
    `${e.absence ?? e.absent ?? 0}`,
    `${e.productivity}%`,
    `${e.weeklyHours ?? 0}h`,
    `${e.overtime ?? 0}h`,
  ]),
  styles: {
    fontSize: 10,
    textColor: [230, 230, 255],      
    fillColor: [25, 20, 35],         
  },
  headStyles: {
    fillColor: [120, 90, 230],       
    textColor: 255,
    fontSize: 11,
  },
  alternateRowStyles: {
    fillColor: [20, 16, 30],         
  },
  margin: { left: 14, right: 14 },
  tableWidth: 'auto'
});


  let chartY = doc.lastAutoTable.finalY;

  // ==============================================
// SECTION 3 — Analysis
// ==============================================

doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.setTextColor(167, 139, 250);
doc.text("Team Analysis", 14, chartY + 15);

const analysisStartY = chartY + 22;
const analysisHeight = 10 + employees.length * 4 + 20;
doc.setFillColor(25, 20, 35);
doc.setDrawColor(120, 90, 230);
doc.roundedRect(12, analysisStartY, 186, analysisHeight, 4, 4, "FD");

doc.setFont("helvetica", "normal");
doc.setFontSize(11);
doc.setTextColor(230, 230, 255);

let lineY = analysisStartY + 10;

const analysisLines = [];

if (avgPresence < 70) analysisLines.push("• Low presence rate – the team may lack stability.");
if (avgLate > 15) analysisLines.push("• High lateness – punctuality needs improvement.");
if (avgProductivity < 60) analysisLines.push("• Productivity below expected standards.");
if (avgOvertime > 5) analysisLines.push("• High overtime – risk of overload.");
if (analysisLines.length === 0) analysisLines.push("• The team's performance indicators are stable and positive.");

analysisLines.forEach(line => {
  doc.text(line, 18, lineY);
  lineY += 7;
});
  this.addFooter(doc);
  doc.save(this.buildFileName(`rapport-team-${teamName}`, 'pdf'));
  }
}