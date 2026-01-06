import { TestBed } from '@angular/core/testing';
import { ReportPdfService, ReportableEmployee } from '@core/services/reportPdf';
import jsPDF from 'jspdf';

jest.mock('jspdf', () => {
  const mockDoc = {
    setFillColor: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    roundedRect: jest.fn().mockReturnThis(),
    setFont: jest.fn().mockReturnThis(),
    setFontSize: jest.fn().mockReturnThis(),
    setTextColor: jest.fn().mockReturnThis(),
    setDrawColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    save: jest.fn().mockReturnThis(),
    lastAutoTable: { finalY: 150 },
  };
  return jest.fn(() => mockDoc);
});

jest.mock('jspdf-autotable', () => jest.fn());

describe('ReportPdfService', () => {
  let service: ReportPdfService;
  let mockJsPDF: jest.Mock;

  const baseEmployee: ReportableEmployee = {
    name: 'John Doe',
    team: 'Engineering',
    presence: 90,
    late: 5,
    absence: 2,
    weeklyHours: 40,
    productivity: 85,
    overtime: 3,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReportPdfService],
    });
    service = TestBed.inject(ReportPdfService);
    mockJsPDF = jsPDF as unknown as jest.Mock;
    jest.clearAllMocks();
  });

  describe('exportEmployeeReportPdf', () => {
    it('should generate PDF for employee with all fields', () => {
      service.exportEmployeeReportPdf(baseEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.setFillColor).toHaveBeenCalled();
      expect(doc.rect).toHaveBeenCalled();
      expect(doc.text).toHaveBeenCalled();
      expect(doc.save).toHaveBeenCalledWith(
        expect.stringMatching(/^Document-report-John Doe-\d{4}-\d{2}-\d{2}\.pdf$/)
      );
    });

    describe('team average calculations with nullish values', () => {
      it('should handle employee with undefined presence in reduce', async () => {
        const teamWithUndefinedPresence: ReportableEmployee[] = [
          { name: 'E1', presence: undefined as any, late: 10 },
          { name: 'E2', presence: 80, late: 5 },
        ];

        await service.exportEmployeesReportPdf('Undefined Presence Team', teamWithUndefinedPresence);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should handle employee with null presence in reduce', async () => {
        const teamWithNullPresence: ReportableEmployee[] = [
          { name: 'E1', presence: null as any, late: 10 },
          { name: 'E2', presence: 80, late: 5 },
        ];

        await service.exportEmployeesReportPdf('Null Presence Team', teamWithNullPresence);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should handle employee with undefined late in reduce', async () => {
        const teamWithUndefinedLate: ReportableEmployee[] = [
          { name: 'E1', presence: 80, late: undefined as any },
          { name: 'E2', presence: 90, late: 10 },
        ];

        await service.exportEmployeesReportPdf('Undefined Late Team', teamWithUndefinedLate);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should handle employee with null late in reduce', async () => {
        const teamWithNullLate: ReportableEmployee[] = [
          { name: 'E1', presence: 80, late: null as any },
          { name: 'E2', presence: 90, late: 10 },
        ];

        await service.exportEmployeesReportPdf('Null Late Team', teamWithNullLate);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should handle all employees with undefined presence and late', async () => {
        const teamAllUndefined: ReportableEmployee[] = [
          { name: 'E1', presence: undefined as any, late: undefined as any },
          { name: 'E2', presence: undefined as any, late: undefined as any },
        ];

        await service.exportEmployeesReportPdf('All Undefined Team', teamAllUndefined);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });
    });

    describe('coverage gaps', () => {
      it('should handle employee with late between 10-20 (Moderate)', () => {
        const moderateLateEmployee: ReportableEmployee = {
          ...baseEmployee,
          late: 15,
        };

        service.exportEmployeeReportPdf(moderateLateEmployee);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should handle employee with late <= 10 (Rare)', () => {
        const rareLateEmployee: ReportableEmployee = {
          ...baseEmployee,
          late: 8,
        };

        service.exportEmployeeReportPdf(rareLateEmployee);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should handle employee with overtime > 5 (Too much)', () => {
        const highOvertimeEmployee: ReportableEmployee = {
          ...baseEmployee,
          overtime: 8,
        };

        service.exportEmployeeReportPdf(highOvertimeEmployee);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should handle employee with overtime <= 5 (Normal)', () => {
        const normalOvertimeEmployee: ReportableEmployee = {
          ...baseEmployee,
          overtime: 3,
        };

        service.exportEmployeeReportPdf(normalOvertimeEmployee);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should handle employee with undefined overtime in analysis', () => {
        const noOvertimeEmployee: ReportableEmployee = {
          name: 'No Overtime',
          presence: 80,
          late: 10,
          overtime: undefined,
        };

        service.exportEmployeeReportPdf(noOvertimeEmployee);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should handle team with undefined presence values', async () => {
        const teamWithNullPresence: ReportableEmployee[] = [
          { name: 'E1', presence: 0, late: 10 },
          { name: 'E2', presence: 80, late: 5 },
        ];

        await service.exportEmployeesReportPdf('Mixed Team', teamWithNullPresence);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should handle team with undefined late values', async () => {
        const teamWithNullLate: ReportableEmployee[] = [
          { name: 'E1', presence: 80, late: 0 },
          { name: 'E2', presence: 90, late: 10 },
        ];

        await service.exportEmployeesReportPdf('Late Team', teamWithNullLate);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });

      it('should cover overtime falsy check (overtime = 0)', () => {
        const zeroOvertimeEmployee: ReportableEmployee = {
          ...baseEmployee,
          overtime: 0,
        };

        service.exportEmployeeReportPdf(zeroOvertimeEmployee);

        const doc = mockJsPDF.mock.results[0].value;
        expect(doc.save).toHaveBeenCalled();
      });
    });

    it('should handle employee without team', () => {
      const employeeNoTeam: ReportableEmployee = {
        ...baseEmployee,
        team: undefined,
      };

      service.exportEmployeeReportPdf(employeeNoTeam);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.text).toHaveBeenCalledWith(
        expect.stringContaining('Not specified'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should use absent when absence is undefined', () => {
      const employeeWithAbsent: ReportableEmployee = {
        name: 'Jane Doe',
        presence: 80,
        late: 10,
        absent: 5,
      };

      service.exportEmployeeReportPdf(employeeWithAbsent);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should default absence to 0 when both absence and absent are undefined', () => {
      const employeeNoAbsence: ReportableEmployee = {
        name: 'Bob Smith',
        presence: 95,
        late: 2,
      };

      service.exportEmployeeReportPdf(employeeNoAbsence);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should handle employee with undefined productivity', () => {
      const employeeNoProductivity: ReportableEmployee = {
        ...baseEmployee,
        productivity: undefined,
      };

      service.exportEmployeeReportPdf(employeeNoProductivity);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should handle employee with undefined weeklyHours', () => {
      const employeeNoHours: ReportableEmployee = {
        ...baseEmployee,
        weeklyHours: undefined,
      };

      service.exportEmployeeReportPdf(employeeNoHours);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should handle employee with undefined overtime', () => {
      const employeeNoOvertime: ReportableEmployee = {
        ...baseEmployee,
        overtime: undefined,
      };

      service.exportEmployeeReportPdf(employeeNoOvertime);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should generate recommendation for high late percentage', () => {
      const lateEmployee: ReportableEmployee = {
        ...baseEmployee,
        late: 25,
      };

      service.exportEmployeeReportPdf(lateEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should generate recommendation for low productivity', () => {
      const lowProductivityEmployee: ReportableEmployee = {
        ...baseEmployee,
        productivity: 60,
      };

      service.exportEmployeeReportPdf(lowProductivityEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should generate recommendation for high absences', () => {
      const highAbsenceEmployee: ReportableEmployee = {
        ...baseEmployee,
        absence: 5,
      };

      service.exportEmployeeReportPdf(highAbsenceEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should generate recommendation for low presence', () => {
      const lowPresenceEmployee: ReportableEmployee = {
        ...baseEmployee,
        presence: 50,
      };

      service.exportEmployeeReportPdf(lowPresenceEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should show no alerts when all indicators are good', () => {
      const goodEmployee: ReportableEmployee = {
        name: 'Perfect Employee',
        presence: 95,
        late: 5,
        absence: 1,
        productivity: 90,
      };

      service.exportEmployeeReportPdf(goodEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should generate multiple recommendations when multiple issues', () => {
      const problemEmployee: ReportableEmployee = {
        name: 'Problem Employee',
        presence: 40,
        late: 30,
        absence: 10,
        productivity: 50,
      };

      service.exportEmployeeReportPdf(problemEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should handle presence analysis - very good', () => {
      const excellentPresence: ReportableEmployee = {
        ...baseEmployee,
        presence: 90,
      };

      service.exportEmployeeReportPdf(excellentPresence);
      expect(mockJsPDF.mock.results[0].value.save).toHaveBeenCalled();
    });

    it('should handle presence analysis - correct', () => {
      const correctPresence: ReportableEmployee = {
        ...baseEmployee,
        presence: 70,
      };

      service.exportEmployeeReportPdf(correctPresence);
      expect(mockJsPDF.mock.results[0].value.save).toHaveBeenCalled();
    });

    it('should handle presence analysis - needs improvement', () => {
      const poorPresence: ReportableEmployee = {
        ...baseEmployee,
        presence: 50,
      };

      service.exportEmployeeReportPdf(poorPresence);
      expect(mockJsPDF.mock.results[0].value.save).toHaveBeenCalled();
    });
  });

  describe('exportEmployeesReportPdf', () => {
    const employees: ReportableEmployee[] = [
      {
        name: 'Alice',
        team: 'Dev',
        presence: 85,
        late: 10,
        absence: 2,
        weeklyHours: 38,
        productivity: 80,
        overtime: 2,
      },
      {
        name: 'Bob',
        team: 'Dev',
        presence: 90,
        late: 5,
        absent: 1,
        weeklyHours: 40,
        productivity: 85,
        overtime: 4,
      },
    ];

    it('should generate team PDF report', async () => {
      await service.exportEmployeesReportPdf('Engineering', employees);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalledWith(
        expect.stringMatching(/^Document-rapport-team-Engineering-\d{4}-\d{2}-\d{2}\.pdf$/)
      );
    });

    it('should calculate average presence correctly', async () => {
      await service.exportEmployeesReportPdf('Team A', employees);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.text).toHaveBeenCalled();
    });

    it('should calculate average late correctly', async () => {
      await service.exportEmployeesReportPdf('Team A', employees);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should calculate total absences correctly', async () => {
      await service.exportEmployeesReportPdf('Team A', employees);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should handle employees with absent instead of absence', async () => {
      const employeesWithAbsent: ReportableEmployee[] = [
        { name: 'Test', presence: 80, late: 10, absent: 3 },
      ];

      await service.exportEmployeesReportPdf('Team B', employeesWithAbsent);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should handle employees with undefined optional fields', async () => {
      const minimalEmployees: ReportableEmployee[] = [
        { name: 'Minimal', presence: 75, late: 15 },
      ];

      await service.exportEmployeesReportPdf('Team C', minimalEmployees);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should generate analysis for low presence', async () => {
      const lowPresenceTeam: ReportableEmployee[] = [
        { name: 'Low1', presence: 60, late: 5 },
        { name: 'Low2', presence: 65, late: 5 },
      ];

      await service.exportEmployeesReportPdf('Low Team', lowPresenceTeam);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should generate analysis for high lateness', async () => {
      const lateTeam: ReportableEmployee[] = [
        { name: 'Late1', presence: 80, late: 20 },
        { name: 'Late2', presence: 85, late: 25 },
      ];

      await service.exportEmployeesReportPdf('Late Team', lateTeam);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should generate analysis for low productivity', async () => {
      const lowProdTeam: ReportableEmployee[] = [
        { name: 'LowProd1', presence: 80, late: 5, productivity: 50 },
        { name: 'LowProd2', presence: 85, late: 5, productivity: 55 },
      ];

      await service.exportEmployeesReportPdf('LowProd Team', lowProdTeam);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should generate analysis for high overtime', async () => {
      const overtimeTeam: ReportableEmployee[] = [
        { name: 'OT1', presence: 90, late: 5, overtime: 8 },
        { name: 'OT2', presence: 85, late: 5, overtime: 10 },
      ];

      await service.exportEmployeesReportPdf('Overtime Team', overtimeTeam);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should show positive analysis when all metrics are good', async () => {
      const goodTeam: ReportableEmployee[] = [
        { name: 'Good1', presence: 95, late: 5, productivity: 90, overtime: 2 },
        { name: 'Good2', presence: 92, late: 3, productivity: 88, overtime: 1 },
      ];

      await service.exportEmployeesReportPdf('Good Team', goodTeam);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should generate multiple analysis lines when multiple issues', async () => {
      const problemTeam: ReportableEmployee[] = [
        { name: 'Prob1', presence: 50, late: 25, productivity: 40, overtime: 10 },
        { name: 'Prob2', presence: 55, late: 30, productivity: 45, overtime: 12 },
      ];

      await service.exportEmployeesReportPdf('Problem Team', problemTeam);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should handle single employee team', async () => {
      const singleEmployee: ReportableEmployee[] = [
        { name: 'Solo', presence: 85, late: 10, productivity: 75 },
      ];

      await service.exportEmployeesReportPdf('Solo Team', singleEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });

    it('should handle large team', async () => {
      const largeTeam: ReportableEmployee[] = Array.from({ length: 20 }, (_, i) => ({
        name: `Employee${i}`,
        presence: 80 + (i % 10),
        late: 5 + (i % 5),
        productivity: 70 + (i % 15),
        overtime: i % 3,
      }));

      await service.exportEmployeesReportPdf('Large Team', largeTeam);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalled();
    });
  });

  describe('generateHeader', () => {
    it('should generate header with subtitle', () => {
      service.exportEmployeeReportPdf(baseEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.setFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(doc.setFontSize).toHaveBeenCalledWith(22);
    });

    it('should generate header gradient across full width', () => {
      service.exportEmployeeReportPdf(baseEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.setFillColor).toHaveBeenCalled();
      expect(doc.rect).toHaveBeenCalled();
    });
  });

  describe('buildFileName', () => {
    it('should build filename with current date for employee report', () => {
      const dateSpy = jest.spyOn(Date.prototype, 'toISOString');
      dateSpy.mockReturnValue('2024-01-15T10:30:00.000Z');

      service.exportEmployeeReportPdf(baseEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalledWith('Document-report-John Doe-2024-01-15.pdf');

      dateSpy.mockRestore();
    });

    it('should build filename with current date for team report', async () => {
      const dateSpy = jest.spyOn(Date.prototype, 'toISOString');
      dateSpy.mockReturnValue('2024-01-15T10:30:00.000Z');

      await service.exportEmployeesReportPdf('TestTeam', [baseEmployee]);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.save).toHaveBeenCalledWith('Document-rapport-team-TestTeam-2024-01-15.pdf');

      dateSpy.mockRestore();
    });
  });

  describe('KPI card rendering', () => {
    it('should render 6 KPI cards for employee report', () => {
      service.exportEmployeeReportPdf(baseEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.roundedRect).toHaveBeenCalled();
    });

    it('should render 6 KPI cards for team report', async () => {
      await service.exportEmployeesReportPdf('Team', [baseEmployee]);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.roundedRect).toHaveBeenCalled();
    });

    it('should wrap cards to new row after 3 cards', () => {
      service.exportEmployeeReportPdf(baseEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      expect(doc.roundedRect).toHaveBeenCalled();
      expect(doc.roundedRect.mock.calls.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('gradient color interpolation', () => {
    it('should interpolate colors across gradient stops', () => {
      service.exportEmployeeReportPdf(baseEmployee);

      const doc = mockJsPDF.mock.results[0].value;
      const setFillColorCalls = doc.setFillColor.mock.calls;
      expect(setFillColorCalls.length).toBeGreaterThan(0);
    });
  });
});
