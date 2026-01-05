
import { UserService, User } from '@core/services/user';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

jest.mock('@environments/environment', () => ({
  environment: {
    GRAPHQL_ENDPOINT: 'http://test/graphql',
  },
}));

describe('UserService - full coverage', () => {
  let service: UserService;
  let httpMock: jest.Mocked<HttpClient>;
  const GRAPHQL_ENDPOINT = 'http://test/graphql';

  const sampleUser: User = {
    id: 'u1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'j@d.com',
  };

  beforeEach(() => {
    httpMock = { post: jest.fn() } as unknown as jest.Mocked<HttpClient>;
    service = new UserService(httpMock);
    jest.clearAllMocks();
  });

  it('getAllUsers: returns users and calls endpoint + logs', (done) => {
    const resp = { data: { users: [sampleUser] } };
    httpMock.post.mockReturnValue(of(resp));
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

    service.getAllUsers().subscribe((res) => {
      expect(res).toEqual([sampleUser]);
      expect(httpMock.post).toHaveBeenCalledWith(
        GRAPHQL_ENDPOINT,
        expect.objectContaining({ operationName: 'AllUsers', query: expect.any(String) }),
        { withCredentials: true }
      );
      expect(debugSpy).toHaveBeenCalledWith('[UserService] getAllUsers response', resp);
      debugSpy.mockRestore();
      done();
    });
  });

  it('getAllUsers: throws when GraphQL returns errors', (done) => {
    httpMock.post.mockReturnValue(of({ data: null, errors: [{ message: 'Err1' }] }));
    service.getAllUsers().subscribe({
      next: () => done(new Error('Expected error')),
      error: (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Err1');
        done();
      },
    });
  });

  it('getAllUsers: returns empty array when users missing', (done) => {
    httpMock.post.mockReturnValue(of({ data: {} }));
    service.getAllUsers().subscribe((res) => {
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(0);
      done();
    });
  });

  it('createUser: returns created user and calls endpoint + logs', (done) => {
    const input = { firstName: 'A', lastName: 'B', email: 'a@b.com' };
    const resp = { data: { register: sampleUser } };
    httpMock.post.mockReturnValue(of(resp));
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

    service.createUser(input).subscribe((res) => {
      expect(res).toEqual(sampleUser);
      expect(httpMock.post).toHaveBeenCalledWith(
        GRAPHQL_ENDPOINT,
        expect.objectContaining({ operationName: 'Register', variables: { input } }),
        { withCredentials: true }
      );
      expect(debugSpy).toHaveBeenCalledWith('[UserService] createUser response', resp);
      debugSpy.mockRestore();
      done();
    });
  });

  it('createUser: throws when GraphQL returns errors', (done) => {
    httpMock.post.mockReturnValue(of({ data: null, errors: [{ message: 'Cerr' }] }));
    service.createUser({ firstName: '', lastName: '', email: '' }).subscribe({
      next: () => done(new Error('Expected error')),
      error: (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Cerr');
        done();
      },
    });
  });

  it('createUser: throws when register missing', (done) => {
    httpMock.post.mockReturnValue(of({ data: {} }));
    service.createUser({ firstName: '', lastName: '', email: '' }).subscribe({
      next: () => done(new Error('Expected error')),
      error: (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Failed to create user');
        done();
      },
    });
  });

  it('updateUser: returns updated user and calls endpoint + logs', (done) => {
    const input = { id: 'u1', firstName: 'X' };
    const resp = { data: { updateUser: sampleUser } };
    httpMock.post.mockReturnValue(of(resp));
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

    service.updateUser(input).subscribe((res) => {
      expect(res).toEqual(sampleUser);
      expect(httpMock.post).toHaveBeenCalledWith(
        GRAPHQL_ENDPOINT,
        expect.objectContaining({ operationName: 'UpdateUser', variables: { input } }),
        { withCredentials: true }
      );
      expect(debugSpy).toHaveBeenCalledWith('[UserService] updateUser response', resp);
      debugSpy.mockRestore();
      done();
    });
  });

  it('updateUser: throws when GraphQL returns errors', (done) => {
    httpMock.post.mockReturnValue(of({ data: null, errors: [{ message: 'Uerr' }] }));
    service.updateUser({ id: 'u1' }).subscribe({
      next: () => done(new Error('Expected error')),
      error: (err) => {
        expect(err.message).toBe('Uerr');
        done();
      },
    });
  });

  it('updateUser: throws when updateUser missing', (done) => {
    httpMock.post.mockReturnValue(of({ data: {} }));
    service.updateUser({ id: 'u1' }).subscribe({
      next: () => done(new Error('Expected error')),
      error: (err) => {
        expect(err.message).toBe('Failed to update user');
        done();
      },
    });
  });

  it('deleteUser: returns true/false and logs', (done) => {
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

    httpMock.post.mockReturnValueOnce(of({ data: { deleteUser: true } }));
    service.deleteUser('u1').subscribe((res1) => {
      expect(res1).toBe(true);
      expect(httpMock.post).toHaveBeenCalledWith(
        GRAPHQL_ENDPOINT,
        expect.objectContaining({ operationName: 'DeleteUser', variables: { id: 'u1' } }),
        { withCredentials: true }
      );
      expect(debugSpy).toHaveBeenCalledWith('[UserService] deleteUser response', { data: { deleteUser: true } });

      httpMock.post.mockReturnValueOnce(of({ data: {} }));
      service.deleteUser('u2').subscribe((res2) => {
        expect(res2).toBe(false);
        debugSpy.mockRestore();
        done();
      });
    });
  });

  it('deleteUser: throws when GraphQL returns errors', (done) => {
    httpMock.post.mockReturnValue(of({ data: null, errors: [{ message: 'Derr' }] }));
    service.deleteUser('u1').subscribe({
      next: () => done(new Error('Expected error')),
      error: (err) => {
        expect(err.message).toBe('Derr');
        done();
      },
    });
  });
});
