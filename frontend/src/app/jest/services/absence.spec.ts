import { AbsenceService, Absence } from '@core/services/absence';
import { GraphqlRequestError } from '@shared/utils/graphql.utils';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

jest.mock('@environments/environment', () => ({
  environment: {
    GRAPHQL_ENDPOINT: 'http://test/graphql',
  },
}));

describe('AbsenceService (Jest) - full coverage', () => {
  let service: AbsenceService;
  let httpClientMock: jest.Mocked<HttpClient>;
  const GRAPHQL_ENDPOINT = 'http://test/graphql';

  const mockAbsence: Absence = {
    id: '1',
    userId: 'u1',
    startDate: '2024-01-01',
    endDate: '2024-01-02',
    type: 'SICK',
    status: 'PENDING',
    createdAt: '',
    updatedAt: '',
    days: [],
  };

  beforeEach(() => {
    httpClientMock = {
      post: jest.fn(),
    } as any;
    service = new AbsenceService(httpClientMock);
    jest.clearAllMocks();
  });

  it('myAbsences: should return list of absences and call endpoint', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: { myAbsences: [mockAbsence] } }));

    service.myAbsences().subscribe((res) => {
      expect(res).toEqual([mockAbsence]);
      expect(httpClientMock.post).toHaveBeenCalledWith(
        GRAPHQL_ENDPOINT,
        expect.any(Object),
        { withCredentials: true }
      );
      done();
    });
  });

  it('myAbsences: should throw GraphqlRequestError when GraphQL returns errors', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: null, errors: [{ message: 'Boom' }] }));

    service.myAbsences().subscribe({
      next: () => done(new Error('Expected error')),
      error: (err) => {
        expect(err).toBeInstanceOf(GraphqlRequestError);
        // message includes prefix created by GraphqlRequestError
        expect(err.message).toMatch(/GraphQL:/);
        done();
      },
    });
  });

  it('myAbsences: should propagate HTTP errors', (done) => {
    httpClientMock.post.mockReturnValue(throwError(() => new Error('HTTP failure')));

    service.myAbsences().subscribe({
      next: () => done(new Error('Expected HTTP error')),
      error: (err: Error) => {
        expect(err.message).toBe('HTTP failure');
        done();
      },
    });
  });

  it('myTeamAbsences: should pass variables and return payload', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: { myTeamAbsences: [mockAbsence] } }));

    service.myTeamAbsences('team-1').subscribe((res) => {
      expect(res).toEqual([mockAbsence]);
      // check that variables were passed in the body
      expect(httpClientMock.post).toHaveBeenCalledWith(
        GRAPHQL_ENDPOINT,
        expect.objectContaining({ variables: { teamId: 'team-1' } }),
        { withCredentials: true }
      );
      done();
    });
  });

  it('teamAbsences: should require teamId variable and return payload', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: { teamAbsences: [mockAbsence] } }));

    service.teamAbsences('team-X').subscribe((res) => {
      expect(res).toEqual([mockAbsence]);
      expect(httpClientMock.post).toHaveBeenCalledWith(
        GRAPHQL_ENDPOINT,
        expect.objectContaining({ variables: { teamId: 'team-X' } }),
        { withCredentials: true }
      );
      done();
    });
  });

  it('createAbsence: should return created absence and throw if no data', (done) => {
    httpClientMock.post.mockReturnValueOnce(of({ data: { createAbsence: mockAbsence } }));

    service.createAbsence({ startDate: '', endDate: '', type: 'SICK' }).subscribe((res) => {
      expect(res).toEqual(mockAbsence);
      done();
    });
  });

  it('createAbsence: should throw GraphqlRequestError when response.data is null', (done) => {
    httpClientMock.post.mockReturnValueOnce(of({ data: null }));

    service.createAbsence({ startDate: '', endDate: '', type: 'SICK' }).subscribe({
      next: () => done(new Error('Expected GraphqlRequestError')),
      error: (err) => {
        expect(err).toBeInstanceOf(GraphqlRequestError);
        done();
      },
    });
  });

  it('updateAbsence: should return updated absence and throw if missing', (done) => {
    httpClientMock.post.mockReturnValueOnce(of({ data: { updateAbsence: mockAbsence } }));

    service.updateAbsence('1', {}).subscribe((res) => {
      expect(res).toEqual(mockAbsence);
      done();
    });
  });

  it('updateAbsence: should throw when updateAbsence missing', (done) => {
    httpClientMock.post.mockReturnValueOnce(of({ data: null }));

    service.updateAbsence('1', {}).subscribe({
      next: () => done(new Error('Expected GraphqlRequestError')),
      error: (err) => {
        expect(err).toBeInstanceOf(GraphqlRequestError);
        done();
      },
    });
  });

  it('setAbsenceStatus: should return updated absence and throw if missing', (done) => {
    httpClientMock.post.mockReturnValueOnce(of({ data: { setAbsenceStatus: mockAbsence } }));

    service.setAbsenceStatus('1', { status: 'APPROVED' }).subscribe((res) => {
      expect(res).toEqual(mockAbsence);
      done();
    });
  });

  it('setAbsenceStatus: should throw when setAbsenceStatus missing', (done) => {
    httpClientMock.post.mockReturnValueOnce(of({ data: null }));

    service.setAbsenceStatus('1', { status: 'APPROVED' }).subscribe({
      next: () => done(new Error('Expected GraphqlRequestError')),
      error: (err) => {
        expect(err).toBeInstanceOf(GraphqlRequestError);
        done();
      },
    });
  });

  it('deleteAbsence: should return boolean and default to false if missing', (done) => {
    httpClientMock.post.mockReturnValueOnce(of({ data: { deleteAbsence: true } }));

    service.deleteAbsence('1').subscribe((res) => {
      expect(res).toBe(true);

      // now return payload with no deleteAbsence to exercise default false branch
      httpClientMock.post.mockReturnValueOnce(of({ data: {} }));
      service.deleteAbsence('2').subscribe((res2) => {
        expect(res2).toBe(false);
        done();
      });
    });
  });

  it('getAllUsers: should build map and cache results', (done) => {
    const payload = {
      data: {
        myTeamMembers: [
          {
            teamId: 't1',
            teamName: 'Team 1',
            members: [
              { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b' },
              { id: 'u2', firstName: 'C', lastName: 'D', email: 'c@d' },
            ],
          },
        ],
      },
    };

    httpClientMock.post.mockReturnValueOnce(of(payload));

    service.getAllUsers().subscribe((map1) => {
      expect(map1.get('u1')!.firstName).toBe('A');
      expect(httpClientMock.post).toHaveBeenCalledTimes(1);

      // second call should return cached map without additional http call
      service.getAllUsers().subscribe((map2) => {
        expect(map2).toBe(map1);
        expect(httpClientMock.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  it('getAllUsersForAdmin: should build map (fresh service instance)', (done) => {
    // fresh instance to avoid cache influence
    const freshMock: jest.Mocked<HttpClient> = { post: jest.fn() } as any;
    const freshService = new AbsenceService(freshMock);

    freshMock.post.mockReturnValueOnce(
      of({ data: { users: [{ id: 'u3', firstName: 'X', lastName: 'Y', email: 'x@y' }] } })
    );

    freshService.getAllUsersForAdmin().subscribe((map) => {
      expect(map.get('u3')!.email).toBe('x@y');
      expect(freshMock.post).toHaveBeenCalledWith(
        GRAPHQL_ENDPOINT,
        expect.any(Object),
        { withCredentials: true }
      );
      done();
    });
  });

  it('getUserById: should return user data or null', (done) => {
    httpClientMock.post.mockReturnValueOnce(
      of({ data: { myTeamMembers: [{ teamId: 't1', teamName: 't', members: [{ id: 'u9', firstName: 'Z', lastName: 'Q', email: 'z@q' }] }] } })
    );

    service.getUserById('u9').subscribe((res) => {
      expect(res).toEqual({ firstName: 'Z', lastName: 'Q', email: 'z@q' });
      service.getUserById('non-existing').subscribe((res2) => {
        expect(res2).toBeNull();
        done();
      });
    });
  });

  beforeEach(() => {
    httpClientMock = { post: jest.fn() } as any;
    service = new AbsenceService(httpClientMock);
    jest.clearAllMocks();
  });

  it('createAbsence throws plain Error when data exists but createAbsence missing', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: {} }));
    service.createAbsence({ startDate: '', endDate: '', type: 'SICK' }).subscribe({
      next: () => done(new Error('Expected error')),
      error: (err: Error) => {
        expect(err.message).toBe('Create absence returned no data');
        done();
      },
    });
  });

  it('updateAbsence throws plain Error when updateAbsence missing in data', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: {} }));
    service.updateAbsence('1', {}).subscribe({
      next: () => done(new Error('Expected error')),
      error: (err: Error) => {
        expect(err.message).toBe('Update absence returned no data');
        done();
      },
    });
  });

  it('setAbsenceStatus throws plain Error when setAbsenceStatus missing in data', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: {} }));
    service.setAbsenceStatus('1', { status: 'APPROVED' }).subscribe({
      next: () => done(new Error('Expected error')),
      error: (err: Error) => {
        expect(err.message).toBe('Set absence status returned no data');
        done();
      },
    });
  });

  it('myAbsences returns empty array when payload.data exists but myAbsences missing', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: {} }));
    service.myAbsences().subscribe((res) => {
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(0);
      done();
    });
  });

  it('myTeamAbsences returns empty array when payload.data exists but myTeamAbsences missing', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: {} }));
    service.myTeamAbsences('any').subscribe((res) => {
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(0);
      done();
    });
  });

  it('teamAbsences returns empty array when payload.data exists but teamAbsences missing', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: {} }));
    service.teamAbsences('team-X').subscribe((res) => {
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(0);
      done();
    });
  });

  it('getAllUsersForAdmin returns cached map when usersCache is set and does not call HTTP', (done) => {
    const cached = new Map<string, { firstName?: string; lastName?: string; email?: string }>();
    cached.set('cached-user', { firstName: 'Cached', lastName: 'User', email: 'c@u' });
    // set private cache via indexing
    (service as any).usersCache = cached;

    // ensure http client not called
    service.getAllUsersForAdmin().subscribe((map) => {
      expect(map).toBe(cached);
      expect(httpClientMock.post).not.toHaveBeenCalled();
      done();
    });
  });

  it('GraphqlRequestError composes "Unexpected error" when error messages are empty', (done) => {
    httpClientMock.post.mockReturnValue(of({ data: null, errors: [{ message: '   ' }] }));
    service.myAbsences().subscribe({
      next: () => done(new Error('Expected GraphqlRequestError')),
      error: (err) => {
        expect(err).toBeInstanceOf(GraphqlRequestError);
        expect(err.message).toMatch(/Unexpected error/);
        done();
      },
    });
  });
  describe('users / groups empty-array fallbacks', () => {
    beforeEach(() => {
      httpClientMock = { post: jest.fn() } as any;
      service = new AbsenceService(httpClientMock);
    });

    it('getAllUsersForAdmin: returns empty map when payload.data exists but users is missing', (done) => {
      httpClientMock.post.mockReturnValue(of({ data: {} }));
      service.getAllUsersForAdmin().subscribe((map) => {
        expect(map.size).toBe(0);
        expect(httpClientMock.post).toHaveBeenCalled();
        done();
      });
    });

    it('getAllUsersForAdmin: returns empty map when users is explicitly undefined', (done) => {
      httpClientMock.post.mockReturnValue(of({ data: { users: undefined } as any }));
      service.getAllUsersForAdmin().subscribe((map) => {
        expect(map.size).toBe(0);
        done();
      });
    });

    it('getAllUsersForAdmin: returns empty map when users is an empty array', (done) => {
      httpClientMock.post.mockReturnValue(of({ data: { users: [] } }));
      service.getAllUsersForAdmin().subscribe((map) => {
        expect(map.size).toBe(0);
        done();
      });
    });

    it('getAllUsers: returns empty map when payload.data exists but myTeamMembers is missing', (done) => {
      httpClientMock.post.mockReturnValue(of({ data: {} }));
      service.getAllUsers().subscribe((map) => {
        expect(map.size).toBe(0);
        expect(httpClientMock.post).toHaveBeenCalled();
        done();
      });
    });

    it('getAllUsers: returns empty map when myTeamMembers is explicitly undefined', (done) => {
      httpClientMock.post.mockReturnValue(of({ data: { myTeamMembers: undefined } as any }));
      service.getAllUsers().subscribe((map) => {
        expect(map.size).toBe(0);
        done();
      });
    });

    it('getAllUsers: returns empty map when myTeamMembers is an empty array', (done) => {
      httpClientMock.post.mockReturnValue(of({ data: { myTeamMembers: [] } }));
      service.getAllUsers().subscribe((map) => {
        expect(map.size).toBe(0);
        done();
      });
    });
  });
});
