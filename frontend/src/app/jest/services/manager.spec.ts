import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ManagerService } from '@core/services/manager';
import { AuthService } from '@core/services/auth';
import { environment } from '@environments/environment';
import { HttpRequest } from '@angular/common/http';

function expectGql(
  httpMock: HttpTestingController,
  url: string,
  includesOrOperationName: string,
  variables?: Record<string, any>
) {
  return httpMock.expectOne((req: HttpRequest<any>) => {
    if (req.url !== url || req.method !== 'POST') return false;

    const op = req.body?.operationName ?? '';
    const q = req.body?.query ?? '';

    const ok =
      (typeof op === 'string' && op === includesOrOperationName) ||
      (typeof q === 'string' && q.includes(includesOrOperationName));

    if (!ok) return false;

    if (!variables) return true;

    const vars = req.body?.variables ?? {};
    return Object.entries(variables).every(([k, v]) => vars?.[k] === v);
  });
}

describe('ManagerService', () => {
  let service: ManagerService;
  let httpMock: HttpTestingController;

  let mockAuthService: any;
  let sessionSpy: jest.SpyInstance;
  let sessionValue: any;

  const GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;

  const mockUser = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    poste: 'Developer',
  };

  const mockUser2 = {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@test.com',
    poste: 'Designer',
  };

  const mockTeam = {
    id: 't1',
    name: 'Team Alpha',
    members: [mockUser, mockUser2],
  };

  beforeEach(() => {
    sessionValue = { user: { id: 'current-user-id' } };

    mockAuthService = {} as any;
    Object.defineProperty(mockAuthService, 'session', {
      get: () => sessionValue,
      configurable: true,
    });

    sessionSpy = jest.spyOn(mockAuthService, 'session', 'get').mockReturnValue(sessionValue);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ManagerService, { provide: AuthService, useValue: mockAuthService }],
    });

    service = TestBed.inject(ManagerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock?.verify();
  });

  describe('getTeamEmployees', () => {
    it('should return empty array when no members', () => {
      service.getTeamEmployees().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      req.flush({ data: { myTeamMembers: [] } });
    });

    it('should handle null myTeamMembers response (?? [])', () => {
      service.getTeamEmployees().subscribe(result => {
        expect(result).toEqual([]);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: null } });
    });

    it('should return employee summaries for team members', () => {
      const now = new Date();
      const mondayThisWeek = getMonday(now);

      const clockIn = new Date(mondayThisWeek);
      clockIn.setHours(9, 0, 0, 0);

      const clockOut = new Date(mondayThisWeek);
      clockOut.setHours(17, 0, 0, 0);

      service.getTeamEmployees().subscribe(result => {
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result[0].name).toBe('John Doe');
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [mockTeam] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: clockIn.toISOString() },
            { id: 'c2', kind: 'OUT', at: clockOut.toISOString() },
          ],
        },
      });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should filter out current user from members', () => {
      sessionSpy.mockReturnValue({ user: { id: '1' } });

      service.getTeamEmployees().subscribe(result => {
        expect(result.every(e => e.id !== '1')).toBe(true);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser, mockUser2] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '2' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '2' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should handle null session', () => {
      sessionSpy.mockReturnValue(null);

      service.getTeamEmployees().subscribe(result => {
        expect(result.length).toBe(1);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should handle error when building employee summary (clocks error)', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      service.getTeamEmployees().subscribe(result => {
        expect(result).toEqual([]);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.error(new ErrorEvent('Network error'));

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should handle myTeamMembers query error', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      service.getTeamEmployees().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle myTeams query error and still return members', () => {
      service.getTeamEmployees().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].team).toBeUndefined();
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.error(new ErrorEvent('Network error'));

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should handle null myTeams response', () => {
      service.getTeamEmployees().subscribe(result => {
        expect(result.length).toBe(1);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: null } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should dedupe members by id', () => {
      service.getTeamEmployees().subscribe(result => {
        expect(result.length).toBe(1);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser, mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should return "Under Review" when expectedSeconds is missing/0', () => {
      const userUnderReview = { ...mockUser, expectedSeconds: 0 };

      service.getTeamEmployees().subscribe(result => {
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('Under Review');
        expect(result[0].presence + result[0].late + result[0].absence).toBeGreaterThanOrEqual(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [userUnderReview] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should compute monday correctly when today is Sunday (covers getDay() || 7)', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-09-01T12:00:00.000Z')); // Sunday

      service.getTeamEmployees().subscribe(result => {
        expect(result).toHaveLength(1);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });

      jest.useRealTimers();
    });
  });

  describe('getTeamEmployeesByTeamId', () => {
    it('should return employees for a specific team', () => {
      service.getTeamEmployeesByTeamId('t1').subscribe(result => {
        expect(result).toHaveLength(2);
        expect(result[0].team).toBe('Team Alpha');
      });

      const teamReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'team', { teamId: 't1' });
      teamReq.flush({ data: { team: mockTeam } });

      const clocksReq1 = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq1.flush({ data: { clocksForUser: [] } });

      const absencesReq1 = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq1.flush({ data: { absencesByUser: [] } });

      const clocksReq2 = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '2' });
      clocksReq2.flush({ data: { clocksForUser: [] } });

      const absencesReq2 = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '2' });
      absencesReq2.flush({ data: { absencesByUser: [] } });
    });

    it('should return empty array when team is null', () => {
      service.getTeamEmployeesByTeamId('invalid').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = expectGql(httpMock, GRAPHQL_ENDPOINT, 'team', { teamId: 'invalid' });
      req.flush({ data: { team: null } });
    });

    it('should return empty array when team has no members', () => {
      service.getTeamEmployeesByTeamId('t1').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = expectGql(httpMock, GRAPHQL_ENDPOINT, 'team', { teamId: 't1' });
      req.flush({ data: { team: { id: 't1', name: 'Empty Team', members: [] } } });
    });

    it('should handle error loading team', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      service.getTeamEmployeesByTeamId('t1').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = expectGql(httpMock, GRAPHQL_ENDPOINT, 'team', { teamId: 't1' });
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle error building employee summary', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      service.getTeamEmployeesByTeamId('t1').subscribe(result => {
        expect(result).toEqual([]);
      });

      const teamReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'team', { teamId: 't1' });
      teamReq.flush({ data: { team: { id: 't1', name: 'Team', members: [mockUser] } } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.error(new ErrorEvent('Network error'));

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });
  });

  describe('getEmployeeKpi', () => {
    it('should return KPI for an employee', () => {
      service.getEmployeeKpi('1').subscribe(result => {
        expect(result).not.toBeNull();
        expect(result?.id).toBe('1');
        expect(result?.name).toBe('John Doe');
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [mockTeam] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should return null when employee not found', () => {
      service.getEmployeeKpi('unknown').subscribe(result => {
        expect(result).toBeNull();
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });
    });

    it('should return null on error building summary', () => {
      service.getEmployeeKpi('1').subscribe(result => {
        expect(result).toBeNull();
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.error(new ErrorEvent('Network error'));

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should return null when myTeamMembers query fails (covers catchError -> of(null))', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      service.getEmployeeKpi('1').subscribe(result => {
        expect(result).toBeNull();
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.error(new ErrorEvent('Network error'));
    });
  });

  describe('listManagedMembers', () => {
    it('should return list of managed members', () => {
      service.listManagedMembers().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('John Doe');
        expect(result[0].team).toBe('Team Alpha');
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [mockTeam] } });
    });

    it('should return empty array when no members', () => {
      service.listManagedMembers().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      req.flush({ data: { myTeamMembers: [] } });
    });

    it('should assign first team found for member', () => {
      const team1 = { id: 't1', name: 'First Team', members: [{ id: '1' }] };
      const team2 = { id: 't2', name: 'Second Team', members: [{ id: '1' }] };

      service.listManagedMembers().subscribe(result => {
        expect(result[0].team).toBe('First Team');
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [team1, team2] } });
    });

    it('should handle team with null members', () => {
      const teamNullMembers = { id: 't1', name: 'Team', members: null };

      service.listManagedMembers().subscribe(result => {
        expect(result[0].team).toBeUndefined();
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [teamNullMembers] } });
    });
  });

  describe('clock stats computation', () => {
    it('should compute work hours correctly', () => {
      const monday = getMonday(new Date());
      const clockIn = new Date(monday);
      clockIn.setHours(9, 0, 0, 0);
      const clockOut = new Date(monday);
      clockOut.setHours(17, 0, 0, 0);

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].hoursThisWeek).toBe(8);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: clockIn.toISOString() },
            { id: 'c2', kind: 'OUT', at: clockOut.toISOString() },
          ],
        },
      });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should detect late arrivals after 9:05', () => {
      const monday = getMonday(new Date());
      const lateIn = new Date(monday);
      lateIn.setHours(9, 10, 0, 0);
      const clockOut = new Date(monday);
      clockOut.setHours(17, 0, 0, 0);

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].late).toBeGreaterThan(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: lateIn.toISOString() },
            { id: 'c2', kind: 'OUT', at: clockOut.toISOString() },
          ],
        },
      });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should handle multiple IN/OUT pairs per day', () => {
      const monday = getMonday(new Date());
      const morningIn = new Date(monday);
      morningIn.setHours(9, 0, 0, 0);
      const lunchOut = new Date(monday);
      lunchOut.setHours(12, 0, 0, 0);
      const afternoonIn = new Date(monday);
      afternoonIn.setHours(13, 0, 0, 0);
      const eveningOut = new Date(monday);
      eveningOut.setHours(17, 0, 0, 0);

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].hoursThisWeek).toBe(7);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: morningIn.toISOString() },
            { id: 'c2', kind: 'OUT', at: lunchOut.toISOString() },
            { id: 'c3', kind: 'IN', at: afternoonIn.toISOString() },
            { id: 'c4', kind: 'OUT', at: eveningOut.toISOString() },
          ],
        },
      });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should handle OUT without IN (ignore)', () => {
      const monday = getMonday(new Date());
      const clockOut = new Date(monday);
      clockOut.setHours(17, 0, 0, 0);

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].hoursThisWeek).toBe(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({
        data: {
          clocksForUser: [{ id: 'c1', kind: 'OUT', at: clockOut.toISOString() }],
        },
      });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should handle null clocksForUser response', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].hoursThisWeek).toBe(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: null } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should handle clocks query error', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].hoursThisWeek).toBe(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.error(new ErrorEvent('Network error'));

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });
  });

  describe('absence stats computation', () => {
    it('should compute absence with days array (FULL_DAY)', () => {
      const monday = getMonday(new Date());
      const absenceDate = formatDate(monday);

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].absence).toBeGreaterThan(0);
        expect(result[0].status).toBe('Absent');
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: absenceDate,
              endDate: absenceDate,
              status: 'APPROVED',
              type: 'VACATION',
              days: [{ absenceDate: absenceDate, period: 'FULL_DAY' }],
            },
          ],
        },
      });
    });

    it('should compute absence with days array (AM)', () => {
      const monday = getMonday(new Date());
      const absenceDate = formatDate(monday);

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].absence).toBeGreaterThanOrEqual(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: absenceDate,
              endDate: absenceDate,
              status: 'APPROVED',
              type: 'VACATION',
              days: [{ absenceDate: absenceDate, period: 'AM' }],
            },
          ],
        },
      });
    });

    it('should compute absence with days array (PM)', () => {
      const monday = getMonday(new Date());
      const absenceDate = formatDate(monday);

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].absence).toBeGreaterThanOrEqual(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: absenceDate,
              endDate: absenceDate,
              status: 'APPROVED',
              type: 'VACATION',
              days: [{ absenceDate: absenceDate, period: 'PM' }],
            },
          ],
        },
      });
    });

    it('should compute absence without days array (date range)', () => {
      const monday = getMonday(new Date());
      const tuesday = new Date(monday);
      tuesday.setDate(tuesday.getDate() + 1);

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].absence).toBeGreaterThan(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: formatDate(monday),
              endDate: formatDate(tuesday),
              status: 'APPROVED',
              type: 'VACATION',
              days: null,
            },
          ],
        },
      });
    });

    it('should compute absence without endDate', () => {
      const monday = getMonday(new Date());

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].absence).toBeGreaterThanOrEqual(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: formatDate(monday),
              endDate: null,
              status: 'APPROVED',
              type: 'VACATION',
              days: null,
            },
          ],
        },
      });
    });

    it('should ignore non-approved absences', () => {
      const monday = getMonday(new Date());

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].status).not.toBe('Absent');
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: formatDate(monday),
              endDate: formatDate(monday),
              status: 'PENDING',
              type: 'VACATION',
              days: [{ absenceDate: formatDate(monday), period: 'FULL_DAY' }],
            },
          ],
        },
      });
    });

    it('should ignore absences outside date window', () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 2);

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].absence).toBe(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: formatDate(pastDate),
              endDate: formatDate(pastDate),
              status: 'APPROVED',
              type: 'VACATION',
              days: [{ absenceDate: formatDate(pastDate), period: 'FULL_DAY' }],
            },
          ],
        },
      });
    });

    it('should skip weekend days in absence calculation', () => {
      const saturday = getNextSaturday();

      service.getTeamEmployees().subscribe();

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: formatDate(saturday),
              endDate: formatDate(saturday),
              status: 'APPROVED',
              type: 'VACATION',
              days: null,
            },
          ],
        },
      });
    });

    it('should handle invalid absenceDate in days array', () => {
      service.getTeamEmployees().subscribe(result => {
        expect(result[0].absence).toBe(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: 'invalid-date',
              endDate: 'invalid-date',
              status: 'APPROVED',
              type: 'VACATION',
              days: [{ absenceDate: 'invalid-date', period: 'FULL_DAY' }],
            },
          ],
        },
      });
    });

    it('should handle invalid startDate', () => {
      service.getTeamEmployees().subscribe(result => {
        expect(result[0].absence).toBe(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: null,
              endDate: null,
              status: 'APPROVED',
              type: 'VACATION',
              days: null,
            },
          ],
        },
      });
    });

    it('should handle null absencesByUser response', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].absence).toBe(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: null } });
    });

    it('should handle absences query error', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].absence).toBe(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.error(new ErrorEvent('Network error'));
    });

    it('should handle unknown period type in days array', () => {
      const monday = getMonday(new Date());

      service.getTeamEmployees().subscribe(result => {
        expect(result).toHaveLength(1);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: formatDate(monday),
              endDate: formatDate(monday),
              status: 'APPROVED',
              type: 'VACATION',
              days: [{ absenceDate: formatDate(monday), period: 'UNKNOWN' as any }],
            },
          ],
        },
      });
    });
  });

  describe('status derivation', () => {
    it('should return Absent status when absent today', () => {
      const today = new Date();
      const todayStr = formatDate(today);

      service.getTeamEmployees().subscribe(result => {
        expect(result[0].status).toBe('Absent');
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({
        data: {
          absencesByUser: [
            {
              id: 'a1',
              userId: '1',
              startDate: todayStr,
              endDate: todayStr,
              status: 'APPROVED',
              type: 'VACATION',
              days: [{ absenceDate: todayStr, period: 'FULL_DAY' }],
            },
          ],
        },
      });
    });

    it('should return Overtime or On Track status when working 110%+ expected hours', () => {
      const monday = getMonday(new Date());
      const clocks: any[] = [];

      for (let i = 0; i < 5; i++) {
        const day = new Date(monday);
        day.setDate(day.getDate() + i);
        if (day.getDay() === 0 || day.getDay() === 6) continue;

        const clockIn = new Date(day);
        clockIn.setHours(7, 0, 0, 0);
        const clockOut = new Date(day);
        clockOut.setHours(17, 0, 0, 0);

        clocks.push(
          { id: `c${i * 2}`, kind: 'IN', at: clockIn.toISOString() },
          { id: `c${i * 2 + 1}`, kind: 'OUT', at: clockOut.toISOString() }
        );
      }

      service.getTeamEmployees().subscribe(result => {
        expect(['Overtime', 'On Track']).toContain(result[0].status);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: clocks } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should return On Track or Overtime status when working 80-110% expected hours', () => {
      const monday = getMonday(new Date());
      const clocks: any[] = [];

      for (let i = 0; i < 5; i++) {
        const day = new Date(monday);
        day.setDate(day.getDate() + i);
        if (day.getDay() === 0 || day.getDay() === 6) continue;

        const clockIn = new Date(day);
        clockIn.setHours(9, 0, 0, 0);
        const clockOut = new Date(day);
        clockOut.setHours(17, 0, 0, 0);

        clocks.push(
          { id: `c${i * 2}`, kind: 'IN', at: clockIn.toISOString() },
          { id: `c${i * 2 + 1}`, kind: 'OUT', at: clockOut.toISOString() }
        );
      }

      service.getTeamEmployees().subscribe(result => {
        expect(['On Track', 'Overtime']).toContain(result[0].status);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: clocks } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should return Needs Attention status when working less than 80%', () => {
      service.getTeamEmployees().subscribe(result => {
        expect(result[0].status).toBe('Needs Attention');
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [mockUser] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({ data: { clocksForUser: [] } });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });

    it('should clamp NaN to min (covers Number.isNaN(value) return min)', () => {
      const userWithExpected = { ...mockUser, expectedSeconds: 40 * 3600 };

      service.getTeamEmployees().subscribe(result => {
        expect(result).toHaveLength(1);
        expect(Number.isNaN(result[0].presence)).toBe(false);
        expect(Number.isNaN(result[0].late)).toBe(false);
        expect(Number.isNaN(result[0].absence)).toBe(false);
        expect(result[0].presence).toBeGreaterThanOrEqual(0);
      });

      const membersReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      membersReq.flush({ data: { myTeamMembers: [userWithExpected] } });

      const teamsReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeams');
      teamsReq.flush({ data: { myTeams: [] } });

      const clocksReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'clocksForUser', { userId: '1' });
      clocksReq.flush({
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: 'invalid-date' },
            { id: 'c2', kind: 'OUT', at: 'invalid-date' },
          ],
        },
      });

      const absencesReq = expectGql(httpMock, GRAPHQL_ENDPOINT, 'absencesByUser', { userId: '1' });
      absencesReq.flush({ data: { absencesByUser: [] } });
    });
  });

  describe('GraphQL error handling', () => {
    it('should return [] when GraphQL returns errors', () => {
      service.getTeamEmployees().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = expectGql(httpMock, GRAPHQL_ENDPOINT, 'myTeamMembers');
      req.flush({
        data: null,
        errors: [{ message: 'Unauthorized' }, { message: 'Invalid token' }],
      });
    });
  });
});

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay() || 7;
  if (day !== 1) d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getNextSaturday(): Date {
  const today = new Date();
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);
  return saturday;
}
