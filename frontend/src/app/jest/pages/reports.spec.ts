import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ReportsComponent } from '@pages/reports/reports';
import { ReportApiService } from '@core/services/report-api';
import { AuthService } from '@core/services/auth';
import { Report } from '@shared/models/graphql.types';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let reportApiMock: jest.Mocked<ReportApiService>;
  let mockSession: { user: { roles: string[] } | null } | null;

  const mockReports: Report[] = [
    {
      id: '1',
      title: 'Success Report',
      body: 'Test body 1',
      authorEmail: 'author@test.com',
      targetEmail: 'target@test.com',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      title: 'Error Report',
      body: 'Test body 2',
      authorEmail: 'author2@test.com',
      targetEmail: 'target2@test.com',
      createdAt: '2024-01-14T10:00:00Z',
    },
    {
      id: '3',
      title: 'Warning Report',
      body: 'Test body 3',
      authorEmail: 'author3@test.com',
      targetEmail: 'target3@test.com',
      createdAt: '2024-01-15T12:00:00Z',
    },
    {
      id: '4',
      title: 'Info Report',
      body: 'Test body 4',
      authorEmail: 'author4@test.com',
      targetEmail: 'target4@test.com',
      createdAt: '2024-01-13T10:00:00Z',
    },
    {
      id: '5',
      title: 'Default Report',
      body: 'Test body 5',
      authorEmail: 'author5@test.com',
      targetEmail: 'target5@test.com',
      createdAt: undefined,
    },
  ];

  beforeEach(async () => {
    reportApiMock = {
      getAllReports: jest.fn(),
      getReportsForMe: jest.fn(),
      getMyReports: jest.fn(),
    } as unknown as jest.Mocked<ReportApiService>;

    mockSession = { user: { roles: [] } };

    await TestBed.configureTestingModule({
      imports: [ReportsComponent, NoopAnimationsModule],
      providers: [
        { provide: ReportApiService, useValue: reportApiMock },
        {
          provide: AuthService,
          useValue: {
            get session() {
              return mockSession;
            },
          },
        },
      ],
    }).compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
  };

  describe('Initialization', () => {
    it('should create', () => {
      mockSession = { user: { roles: ['EMPLOYEE'] } };
      reportApiMock.getMyReports.mockReturnValue(of([]));
      createComponent();
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should call loadReports on init', () => {
      mockSession = { user: { roles: ['EMPLOYEE'] } };
      reportApiMock.getMyReports.mockReturnValue(of(mockReports));
      createComponent();
      const loadSpy = jest.spyOn(component, 'loadReports');
      component.ngOnInit();
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('userRoles getter', () => {
    it('should return roles from session', () => {
      mockSession = { user: { roles: ['ADMIN', 'MANAGER'] } };
      reportApiMock.getAllReports.mockReturnValue(of([]));
      createComponent();
      expect(component.userRoles).toEqual(['ADMIN', 'MANAGER']);
    });

    it('should return empty array when session is null', () => {
      mockSession = null;
      reportApiMock.getMyReports.mockReturnValue(of([]));
      createComponent();
      expect(component.userRoles).toEqual([]);
    });

    it('should return empty array when user is null', () => {
      mockSession = { user: null };
      reportApiMock.getMyReports.mockReturnValue(of([]));
      createComponent();
      expect(component.userRoles).toEqual([]);
    });
  });

  describe('isAdmin getter', () => {
    it('should return true when user has ADMIN role', () => {
      mockSession = { user: { roles: ['ADMIN'] } };
      reportApiMock.getAllReports.mockReturnValue(of([]));
      createComponent();
      expect(component.isAdmin).toBe(true);
    });

    it('should return false when user does not have ADMIN role', () => {
      mockSession = { user: { roles: ['EMPLOYEE'] } };
      reportApiMock.getMyReports.mockReturnValue(of([]));
      createComponent();
      expect(component.isAdmin).toBe(false);
    });
  });

  describe('isManager getter', () => {
    it('should return true when user has MANAGER role', () => {
      mockSession = { user: { roles: ['MANAGER'] } };
      reportApiMock.getReportsForMe.mockReturnValue(of([]));
      reportApiMock.getMyReports.mockReturnValue(of([]));
      createComponent();
      expect(component.isManager).toBe(true);
    });

    it('should return false when user does not have MANAGER role', () => {
      mockSession = { user: { roles: ['EMPLOYEE'] } };
      reportApiMock.getMyReports.mockReturnValue(of([]));
      createComponent();
      expect(component.isManager).toBe(false);
    });
  });

  describe('loadReports - Admin', () => {
    beforeEach(() => {
      mockSession = { user: { roles: ['ADMIN'] } };
    });

    it('should load all reports for admin', fakeAsync(() => {
      reportApiMock.getAllReports.mockReturnValue(of(mockReports));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(reportApiMock.getAllReports).toHaveBeenCalled();
      expect(component.reports).toEqual(mockReports);
      expect(component.isLoading).toBe(false);
    }));

    it('should handle error when loading reports for admin', fakeAsync(() => {
      const errorMessage = 'Network error';
      reportApiMock.getAllReports.mockReturnValue(throwError(() => ({ message: errorMessage })));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.reports).toEqual([]);
      expect(component.filteredReports).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.lastError).toBe(errorMessage);
    }));

    it('should set default error message when error has no message', fakeAsync(() => {
      reportApiMock.getAllReports.mockReturnValue(throwError(() => ({})));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.lastError).toBe('Unable to retrieve reports at this time.');
    }));
  });

  describe('loadReports - Manager', () => {
    beforeEach(() => {
      mockSession = { user: { roles: ['MANAGER'] } };
    });

    it('should load received and authored reports for manager', fakeAsync(() => {
      const receivedReports = [mockReports[0], mockReports[1]];
      const authoredReports = [mockReports[2], mockReports[3]];

      reportApiMock.getReportsForMe.mockReturnValue(of(receivedReports));
      reportApiMock.getMyReports.mockReturnValue(of(authoredReports));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(reportApiMock.getReportsForMe).toHaveBeenCalled();
      expect(reportApiMock.getMyReports).toHaveBeenCalled();
      expect(component.reports.length).toBe(4);
      expect(component.isLoading).toBe(false);
    }));

    it('should not duplicate reports that exist in both received and authored', fakeAsync(() => {
      const receivedReports = [mockReports[0]];
      const authoredReports = [mockReports[0], mockReports[1]];

      reportApiMock.getReportsForMe.mockReturnValue(of(receivedReports));
      reportApiMock.getMyReports.mockReturnValue(of(authoredReports));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.reports.length).toBe(2);
    }));

    it('should handle null responses for manager', fakeAsync(() => {
      reportApiMock.getReportsForMe.mockReturnValue(of(null as any));
      reportApiMock.getMyReports.mockReturnValue(of(null as any));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.reports).toEqual([]);
    }));

    it('should handle error for manager', fakeAsync(() => {
      const errorMessage = 'Manager error';
      reportApiMock.getReportsForMe.mockReturnValue(throwError(() => ({ message: errorMessage })));
      reportApiMock.getMyReports.mockReturnValue(of([]));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.reports).toEqual([]);
      expect(component.lastError).toBe(errorMessage);
    }));

    it('should set default error message for manager when error has no message', fakeAsync(() => {
      reportApiMock.getReportsForMe.mockReturnValue(throwError(() => ({})));
      reportApiMock.getMyReports.mockReturnValue(of([]));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.lastError).toBe('Unable to retrieve reports at this time.');
    }));
  });

  describe('loadReports - Employee', () => {
    beforeEach(() => {
      mockSession = { user: { roles: ['EMPLOYEE'] } };
    });

    it('should load only authored reports for employee', fakeAsync(() => {
      reportApiMock.getMyReports.mockReturnValue(of(mockReports));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(reportApiMock.getMyReports).toHaveBeenCalled();
      expect(component.reports).toEqual(mockReports);
      expect(component.isLoading).toBe(false);
    }));

    it('should handle error for employee', fakeAsync(() => {
      const errorMessage = 'Employee error';
      reportApiMock.getMyReports.mockReturnValue(throwError(() => ({ message: errorMessage })));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.reports).toEqual([]);
      expect(component.lastError).toBe(errorMessage);
    }));

    it('should set default error message for employee when error has no message', fakeAsync(() => {
      reportApiMock.getMyReports.mockReturnValue(throwError(() => ({})));
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.lastError).toBe('Unable to retrieve reports at this time.');
    }));
  });

  describe('applyFilter', () => {
    beforeEach(() => {
      mockSession = { user: { roles: ['ADMIN'] } };
      reportApiMock.getAllReports.mockReturnValue(of(mockReports));
    });

    it('should show all reports when search term is empty', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.searchTerm = '';
      component.applyFilter();

      expect(component.filteredReports.length).toBe(mockReports.length);
    }));

    it('should filter by title', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.searchTerm = 'Success';
      component.applyFilter();

      expect(component.filteredReports.length).toBe(1);
      expect(component.filteredReports[0].title).toBe('Success Report');
    }));

    it('should filter by body', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.searchTerm = 'body 2';
      component.applyFilter();

      expect(component.filteredReports.length).toBe(1);
    }));

    it('should filter by authorEmail', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.searchTerm = 'author2@test.com';
      component.applyFilter();

      expect(component.filteredReports.length).toBe(1);
    }));

    it('should filter by targetEmail', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.searchTerm = 'target3@test.com';
      component.applyFilter();

      expect(component.filteredReports.length).toBe(1);
    }));

    it('should sort reports by date descending', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.applyFilter();

      const dates = component.filteredReports
        .filter(r => r.createdAt)
        .map(r => new Date(r.createdAt!).getTime());

      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    }));

    it('should handle reports with null createdAt during sorting', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.applyFilter();
      expect(component.filteredReports).toBeDefined();
    }));

    it('should trim search term', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.searchTerm = '   Success   ';
      component.applyFilter();

      expect(component.filteredReports.length).toBe(1);
    }));
  });

  describe('groupReportsByDate', () => {
    beforeEach(() => {
      mockSession = { user: { roles: ['ADMIN'] } };
      reportApiMock.getAllReports.mockReturnValue(of(mockReports));
    });

    it('should group reports by date', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.groupedReports.length).toBeGreaterThan(0);
    }));

    it('should skip reports without createdAt', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      const allGroupedReports = component.groupedReports.flatMap(g => g.reports);
      const hasUndefinedDate = allGroupedReports.some(r => !r.createdAt);
      expect(hasUndefinedDate).toBe(false);
    }));

    it('should create correct displayDate', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.groupedReports.forEach(group => {
        expect(group.displayDate).toBeDefined();
        expect(group.date).toBeDefined();
      });
    }));
  });

  describe('searchReports', () => {
    it('should call applyFilter', fakeAsync(() => {
      mockSession = { user: { roles: ['EMPLOYEE'] } };
      reportApiMock.getMyReports.mockReturnValue(of(mockReports));
      createComponent();
      fixture.detectChanges();
      tick();

      const applyFilterSpy = jest.spyOn(component, 'applyFilter');
      component.searchReports();

      expect(applyFilterSpy).toHaveBeenCalled();
    }));
  });

  describe('selectReport', () => {
    beforeEach(() => {
      mockSession = { user: { roles: ['EMPLOYEE'] } };
      reportApiMock.getMyReports.mockReturnValue(of(mockReports));
    });

    it('should select a report', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.selectReport(mockReports[0]);

      expect(component.selectedReport).toEqual(mockReports[0]);
    }));

    it('should deselect when clicking same report', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.selectReport(mockReports[0]);
      component.selectReport(mockReports[0]);

      expect(component.selectedReport).toBeNull();
    }));

    it('should switch to different report', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      component.selectReport(mockReports[0]);
      component.selectReport(mockReports[1]);

      expect(component.selectedReport).toEqual(mockReports[1]);
    }));
  });

  describe('formatDate', () => {
    it('should format date string', fakeAsync(() => {
      mockSession = { user: { roles: ['EMPLOYEE'] } };
      reportApiMock.getMyReports.mockReturnValue(of([]));
      createComponent();
      fixture.detectChanges();
      tick();

      const result = component.formatDate('2024-01-15T10:00:00Z');
      expect(result).toBeDefined();
    }));

    it('should handle undefined date', fakeAsync(() => {
      mockSession = { user: { roles: ['EMPLOYEE'] } };
      reportApiMock.getMyReports.mockReturnValue(of([]));
      createComponent();
      fixture.detectChanges();
      tick();

      const result = component.formatDate(undefined);
      expect(result).toBeDefined();
    }));
  });

  describe('getReportTypeChip', () => {
    beforeEach(() => {
      mockSession = { user: { roles: ['EMPLOYEE'] } };
      reportApiMock.getMyReports.mockReturnValue(of([]));
    });

    it('should return success for success title', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.getReportTypeChip('Success Report')).toBe('success');
    }));

    it('should return error for error title', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.getReportTypeChip('Error Report')).toBe('error');
    }));

    it('should return warning for warning title', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.getReportTypeChip('Warning Report')).toBe('warning');
    }));

    it('should return info for info title', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.getReportTypeChip('Info Report')).toBe('info');
    }));

    it('should return default for other titles', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.getReportTypeChip('Regular Report')).toBe('default');
    }));

    it('should return default for undefined title', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      tick();

      expect(component.getReportTypeChip(undefined)).toBe('default');
    }));
  });
});
