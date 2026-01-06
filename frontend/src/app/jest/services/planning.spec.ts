import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlanningService, PlanningPayload } from '@core/services/planning';
import { AuthService } from '@core/services/auth';
import { environment } from '@environments/environment';

describe('PlanningService', () => {
  let service: PlanningService;
  let httpMock: HttpTestingController;

  const mockAuthService = {
    session: {
      user: {
        id: 'u1',
        fullName: 'John Doe',
        email: 'john@doe.com',
      },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PlanningService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(PlanningService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load employee planning (success)', () => {
    let result!: PlanningPayload;

    service.getEmployeePlanning().subscribe((res) => (result = res));

    const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
    req.flush({
      data: {
        myAbsences: [
          {
            id: 'a1',
            userId: 'u1',
            startDate: '2024-01-01',
            endDate: '2024-01-02',
            status: 'APPROVED',
            type: 'VACATION',
            reason: 'Holiday',
          },
        ],
      },
    });

    expect(result.people.length).toBe(1);
    expect(result.people[0].name).toBe('John Doe');
    expect(result.events.length).toBe(2);
    expect(result.events[0].date).toBe('2024-01-01');
  });

  it('should return fallback planning on error', () => {
    let result!: PlanningPayload;

    service.getEmployeePlanning().subscribe((res) => (result = res));

    const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
    req.flush(
      { errors: [{ message: 'Boom' }] },
      { status: 200, statusText: 'OK' }
    );

    expect(result.people.length).toBe(1);
    expect(result.events.length).toBe(0);
  });

  it('should load manager planning with teams and absences', () => {
    let result!: PlanningPayload;

    service.getManagerPlanning().subscribe((res) => (result = res));

    const reqs = httpMock.match(environment.GRAPHQL_ENDPOINT);
    expect(reqs.length).toBe(2);

    reqs[0].flush({
      data: {
        myManagedTeams: [
          {
            id: 't1',
            name: 'Team A',
            members: [{ id: 'u2', firstName: 'Alice', lastName: 'Smith' }],
          },
        ],
      },
    });

    reqs[1].flush({
      data: {
        myTeamAbsences: [
          {
            id: 'a2',
            userId: 'u2',
            startDate: '2024-02-01',
            endDate: '2024-02-01',
            status: 'APPROVED',
            type: 'SICK',
            days: [{ absenceDate: '2024-02-01', period: 'AM' }],
          },
        ],
      },
    });

    expect(result.people.length).toBe(1);
    expect(result.people[0].name).toBe('Alice Smith');
    expect(result.events.length).toBe(1);
  });

  it('should handle errors when loading teams and absences', () => {
    let result!: PlanningPayload;

    service.getManagerPlanning().subscribe((res) => (result = res));

    const reqs = httpMock.match(environment.GRAPHQL_ENDPOINT);
    expect(reqs.length).toBe(2);

    reqs[0].flush({ errors: [{ message: 'Teams error' }] });
    reqs[1].flush({ errors: [{ message: 'Absences error' }] });

    expect(result.people.length).toBe(0);
    expect(result.events.length).toBe(0);
  });

  it('should throw error when GraphQL returns errors', (done) => {
    service['request']('query').subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.message).toContain('GraphQL error');
        done();
      },
    });

    const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
    req.flush({
      errors: [{ message: 'GraphQL error' }],
    });
  });

  it('should expand absence with invalid dates safely', () => {
    let result!: PlanningPayload;

    service.getEmployeePlanning().subscribe((res) => (result = res));

    const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
    req.flush({
      data: {
        myAbsences: [
          {
            id: 'a3',
            userId: 'u1',
            startDate: 'invalid',
            endDate: 'invalid',
            status: 'PENDING',
            type: 'OTHER',
          },
        ],
      },
    });

    expect(result.events.length).toBe(1);
    expect(result.events[0].period).toBe('FULL_DAY');
  });

  it('should keep empty name if fullName and email are empty', () => {
    let result!: PlanningPayload;

    mockAuthService.session.user.fullName = '';
    mockAuthService.session.user.email = '';

    service.getEmployeePlanning().subscribe((res) => (result = res));

    httpMock.expectOne(environment.GRAPHQL_ENDPOINT).flush({
      data: { myAbsences: [] },
    });

    expect(result.people[0].name).toBe('');
  });
});
