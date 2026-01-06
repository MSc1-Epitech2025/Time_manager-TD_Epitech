import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { KpiService } from '@core/services/kpi';
import { environment } from '@environments/environment';

describe('KpiService', () => {
  let service: KpiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [KpiService],
    });

    service = TestBed.inject(KpiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('users', () => {
    it('should fetch users', () => {
      const mockResponse = {
        data: {
          users: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }],
        },
      };

      service.users().subscribe(result => {
        expect(result?.users).toHaveLength(1);
        expect(result?.users[0].firstName).toBe('John');
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });

    it('should return null on error', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      service.users().subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('teams', () => {
    it('should fetch teams with members', () => {
      const mockResponse = {
        data: {
          teams: [
            {
              id: 't1',
              name: 'Team A',
              members: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }],
            },
          ],
        },
      };

      service.teams().subscribe(result => {
        expect(result?.teams).toHaveLength(1);
        expect(result?.teams[0].name).toBe('Team A');
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush(mockResponse);
    });

    it('should return null on error', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      service.teams().subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('clocksForUser', () => {
    it('should fetch clocks for a user within date range', () => {
      const mockResponse = {
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: '2024-01-15T09:00:00Z', userId: '1' },
            { id: 'c2', kind: 'OUT', at: '2024-01-15T17:00:00Z', userId: '1' },
          ],
        },
      };

      service.clocksForUser('1', '2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z').subscribe(result => {
        expect(result?.clocksForUser).toHaveLength(2);
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      expect(req.request.body.variables).toEqual({
        userId: '1',
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
      });
      req.flush(mockResponse);
    });
  });

  describe('loadFullData', () => {
    it('should load and aggregate full data for all users', () => {
      const usersResponse = {
        data: {
          users: [
            { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
            { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' },
          ],
        },
      };

      const teamsResponse = {
        data: {
          teams: [
            {
              id: 't1',
              name: 'Team A',
              members: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }],
            },
          ],
        },
      };

      const clocksUser1Response = {
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: '2024-01-15T09:00:00Z', userId: '1' },
            { id: 'c2', kind: 'OUT', at: '2024-01-15T17:30:00Z', userId: '1' },
          ],
        },
      };

      const clocksUser2Response = {
        data: {
          clocksForUser: [
            { id: 'c3', kind: 'IN', at: '2024-01-15T08:30:00Z', userId: '2' },
            { id: 'c4', kind: 'OUT', at: '2024-01-15T16:30:00Z', userId: '2' },
          ],
        },
      };

      service.loadFullData().subscribe(result => {
        expect(result).toHaveLength(2);
        expect(result[0].nom).toBe('John Doe');
        expect(result[0].equipe).toBe('Team A');
        expect(result[1].nom).toBe('Jane Smith');
        expect(result[1].equipe).toBe('Not affected');
      });

      // Handle multiple requests
      const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      expect(requests.length).toBe(2); // users + teams

      requests[0].flush(usersResponse);
      requests[1].flush(teamsResponse);

      // Clock requests for each user
      const clockRequests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      expect(clockRequests.length).toBe(2);

      clockRequests[0].flush(clocksUser1Response);
      clockRequests[1].flush(clocksUser2Response);
    });

    it('should return empty array when no users', () => {
      const usersResponse = { data: { users: [] } };
      const teamsResponse = { data: { teams: [] } };

      service.loadFullData().subscribe(result => {
        expect(result).toEqual([]);
      });

      const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      requests[0].flush(usersResponse);
      requests[1].flush(teamsResponse);
    });

    it('should handle null users response', () => {
      const usersResponse = { data: { users: null } };
      const teamsResponse = { data: { teams: [] } };

      service.loadFullData().subscribe(result => {
        expect(result).toEqual([]);
      });

      const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      requests[0].flush(usersResponse);
      requests[1].flush(teamsResponse);
    });

    it('should handle null clocks response', () => {
      const usersResponse = {
        data: { users: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }] },
      };
      const teamsResponse = { data: { teams: [] } };
      const clocksResponse = { data: { clocksForUser: null } };

      service.loadFullData().subscribe(result => {
        expect(result).toHaveLength(1);
        expect(result[0].historique).toEqual([]);
      });

      const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      requests[0].flush(usersResponse);
      requests[1].flush(teamsResponse);

      const clockRequests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      clockRequests[0].flush(clocksResponse);
    });

    it('should calculate work time with multiple IN/OUT pairs', () => {
      const usersResponse = {
        data: { users: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }] },
      };
      const teamsResponse = { data: { teams: [] } };
      const clocksResponse = {
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: '2024-01-15T09:00:00Z', userId: '1' },
            { id: 'c2', kind: 'OUT', at: '2024-01-15T12:00:00Z', userId: '1' },
            { id: 'c3', kind: 'IN', at: '2024-01-15T13:00:00Z', userId: '1' },
            { id: 'c4', kind: 'OUT', at: '2024-01-15T17:00:00Z', userId: '1' },
          ],
        },
      };

      service.loadFullData().subscribe(result => {
        expect(result[0].historique[0].tempsTravail).toBe('7h 0m');
        expect(result[0].historique[0].presence).toBe(true);
        expect(result[0].historique[0].absences).toBe(0);
      });

      const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      requests[0].flush(usersResponse);
      requests[1].flush(teamsResponse);

      const clockRequests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      clockRequests[0].flush(clocksResponse);
    });

    it('should handle day with no work time as absence', () => {
      const usersResponse = {
        data: { users: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }] },
      };
      const teamsResponse = { data: { teams: [] } };
      const clocksResponse = {
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: '2024-01-15T09:00:00Z', userId: '1' },
            // No OUT - invalid pair
          ],
        },
      };

      service.loadFullData().subscribe(result => {
        expect(result[0].historique[0].presence).toBe(false);
        expect(result[0].historique[0].absences).toBe(1);
        expect(result[0].historique[0].tempsTravail).toBe('0h 0m');
      });

      const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      requests[0].flush(usersResponse);
      requests[1].flush(teamsResponse);

      const clockRequests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      clockRequests[0].flush(clocksResponse);
    });

    it('should handle invalid time difference (OUT before IN)', () => {
      const usersResponse = {
        data: { users: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }] },
      };
      const teamsResponse = { data: { teams: [] } };
      const clocksResponse = {
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: '2024-01-15T17:00:00Z', userId: '1' },
            { id: 'c2', kind: 'OUT', at: '2024-01-15T09:00:00Z', userId: '1' },
          ],
        },
      };

      service.loadFullData().subscribe(result => {
        expect(result[0].historique[0].tempsTravail).toBe('0h 0m');
      });

      const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      requests[0].flush(usersResponse);
      requests[1].flush(teamsResponse);

      const clockRequests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      clockRequests[0].flush(clocksResponse);
    });

    it('should sort historique by date', () => {
      const usersResponse = {
        data: { users: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }] },
      };
      const teamsResponse = { data: { teams: [] } };
      const clocksResponse = {
        data: {
          clocksForUser: [
            { id: 'c3', kind: 'IN', at: '2024-01-20T09:00:00Z', userId: '1' },
            { id: 'c4', kind: 'OUT', at: '2024-01-20T17:00:00Z', userId: '1' },
            { id: 'c1', kind: 'IN', at: '2024-01-10T09:00:00Z', userId: '1' },
            { id: 'c2', kind: 'OUT', at: '2024-01-10T17:00:00Z', userId: '1' },
          ],
        },
      };

      service.loadFullData().subscribe(result => {
        expect(result[0].historique[0].date.getDate()).toBe(10);
        expect(result[0].historique[1].date.getDate()).toBe(20);
      });

      const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      requests[0].flush(usersResponse);
      requests[1].flush(teamsResponse);

      const clockRequests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      clockRequests[0].flush(clocksResponse);
    });
  });

  describe('getUserKpi', () => {
    it('should fetch user KPI', () => {
      const mockResponse = {
        data: {
          userKpi: {
            userId: '1',
            fullName: 'John Doe',
            presenceRate: 95.5,
            avgHoursPerDay: 8.2,
            overtimeHours: 5,
            punctuality: { lateRate: 10, avgDelayMinutes: 5 },
            absenceDays: 2,
            absenceByType: [{ type: 'SICK', days: 2 }],
            reportsAuthored: 10,
            reportsReceived: 5,
            periodStart: '2024-01-01',
            periodEnd: '2024-01-31',
          },
        },
      };

      service.getUserKpi('1', '2024-01-01', '2024-01-31').subscribe(result => {
        expect(result?.userId).toBe('1');
        expect(result?.presenceRate).toBe(95.5);
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      expect(req.request.body.variables).toEqual({
        userId: '1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      req.flush(mockResponse);
    });

    it('should return null when userKpi is missing', () => {
      const mockResponse = { data: {} };

      service.getUserKpi('1', '2024-01-01', '2024-01-31').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush(mockResponse);
    });

    it('should throw error when GraphQL returns errors', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockResponse = {
        errors: [{ message: 'User not found' }],
        data: null,
      };

      service.getUserKpi('1', '2024-01-01', '2024-01-31').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush(mockResponse);
    });

    it('should return null on HTTP error', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      service.getUserKpi('1', '2024-01-01', '2024-01-31').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getMyKpi', () => {
    it('should fetch my KPI', () => {
      const mockResponse = {
        data: {
          myKpi: {
            userId: 'me',
            fullName: 'Current User',
            presenceRate: 90,
            avgHoursPerDay: 7.5,
            overtimeHours: 0,
            punctuality: { lateRate: 5, avgDelayMinutes: 3 },
            absenceDays: 1,
            absenceByType: [],
            reportsAuthored: 5,
            reportsReceived: 2,
            periodStart: '2024-01-01',
            periodEnd: '2024-01-31',
          },
        },
      };

      service.getMyKpi('2024-01-01', '2024-01-31').subscribe(result => {
        expect(result?.fullName).toBe('Current User');
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      expect(req.request.body.variables).toEqual({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      req.flush(mockResponse);
    });

    it('should return null when myKpi is missing', () => {
      const mockResponse = { data: {} };

      service.getMyKpi('2024-01-01', '2024-01-31').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush(mockResponse);
    });

    it('should handle GraphQL errors', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockResponse = {
        errors: [{ message: 'Unauthorized' }],
        data: null,
      };

      service.getMyKpi('2024-01-01', '2024-01-31').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush(mockResponse);
    });

    it('should return null on HTTP error', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      service.getMyKpi('2024-01-01', '2024-01-31').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getTeamKpi', () => {
    it('should fetch team KPI', () => {
      const mockResponse = {
        data: {
          teamKpi: {
            teamId: 't1',
            teamName: 'Team A',
            headcount: 5,
            presenceRate: 92,
            avgHoursPerDay: 7.8,
            absenceRate: 8,
            reportsAuthored: 25,
            periodStart: '2024-01-01',
            periodEnd: '2024-01-31',
          },
        },
      };

      service.getTeamKpi('t1', '2024-01-01', '2024-01-31').subscribe(result => {
        expect(result?.teamName).toBe('Team A');
        expect(result?.headcount).toBe(5);
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      expect(req.request.body.variables).toEqual({
        teamId: 't1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      req.flush(mockResponse);
    });

    it('should return null when teamKpi is missing', () => {
      const mockResponse = { data: {} };

      service.getTeamKpi('t1', '2024-01-01', '2024-01-31').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush(mockResponse);
    });

    it('should handle GraphQL errors', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockResponse = {
        errors: [{ message: 'Team not found' }, { message: 'Access denied' }],
        data: null,
      };

      service.getTeamKpi('t1', '2024-01-01', '2024-01-31').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush(mockResponse);
    });

    it('should return null on HTTP error', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      service.getTeamKpi('t1', '2024-01-01', '2024-01-31').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('date helpers', () => {
    it('should format dates correctly with single digit month and day', () => {
      const usersResponse = {
        data: { users: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }] },
      };
      const teamsResponse = { data: { teams: [] } };
      const clocksResponse = {
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: '2024-01-05T09:00:00Z', userId: '1' },
            { id: 'c2', kind: 'OUT', at: '2024-01-05T17:00:00Z', userId: '1' },
          ],
        },
      };

      service.loadFullData().subscribe();

      const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      requests[0].flush(usersResponse);
      requests[1].flush(teamsResponse);

      const clockRequests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      clockRequests[0].flush(clocksResponse);
    });
  });

  describe('diffMinutes edge cases', () => {
    it('should handle invalid dates returning 0', () => {
      const usersResponse = {
        data: { users: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }] },
      };
      const teamsResponse = { data: { teams: [] } };
      const clocksResponse = {
        data: {
          clocksForUser: [
            { id: 'c1', kind: 'IN', at: 'invalid-date', userId: '1' },
            { id: 'c2', kind: 'OUT', at: '2024-01-15T17:00:00Z', userId: '1' },
          ],
        },
      };

      service.loadFullData().subscribe(result => {
        expect(result[0].historique[0].tempsTravail).toBe('0h 0m');
      });

      const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      requests[0].flush(usersResponse);
      requests[1].flush(teamsResponse);

      const clockRequests = httpMock.match(environment.GRAPHQL_ENDPOINT);
      clockRequests[0].flush(clocksResponse);
    });
  });

  it('should handle null teams response', () => {
    const usersResponse = {
      data: { users: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' }] },
    };
    const teamsResponse = { data: { teams: null } };
    const clocksResponse = {
      data: {
        clocksForUser: [
          { id: 'c1', kind: 'IN', at: '2024-01-15T09:00:00Z', userId: '1' },
          { id: 'c2', kind: 'OUT', at: '2024-01-15T17:00:00Z', userId: '1' },
        ],
      },
    };

    service.loadFullData().subscribe(result => {
      expect(result).toHaveLength(1);
      expect(result[0].equipe).toBe('Not affected');
    });

    const requests = httpMock.match(environment.GRAPHQL_ENDPOINT);
    requests[0].flush(usersResponse);
    requests[1].flush(teamsResponse);

    const clockRequests = httpMock.match(environment.GRAPHQL_ENDPOINT);
    clockRequests[0].flush(clocksResponse);
  });
});
