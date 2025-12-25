import { ManagerService } from '@core/services/manager';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@core/services/auth';
import { of, throwError } from 'rxjs';

jest.mock('@environments/environment', () => ({
  environment: {
    GRAPHQL_ENDPOINT: 'http://test/graphql',
  },
}));

jest.mock('@shared/utils/date.utils', () => ({
  currentWeekRange: () => ({
    from: new Date('2024-01-01T00:00:00Z'),
    to: new Date('2024-01-08T00:00:00Z'),
  }),
}));

describe('ManagerService – 100% coverage', () => {
  let service: ManagerService;
  let httpClientMock: jest.Mocked<HttpClient>;
  let authMock: Partial<AuthService>;

  beforeEach(() => {
    httpClientMock = { post: jest.fn() } as any;
    authMock = {
      session: { user: { id: 'manager-id' } },
    } as any;

    service = new ManagerService(httpClientMock, authMock as AuthService);

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /* -------------------------------------------------- */
  /* helpers                                            */
  /* -------------------------------------------------- */

  const mockMembers = () =>
    of({
      data: {
        myTeamMembers: [
          {
            id: 'u1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@doe.dev',
          },
        ],
      },
    });

  const mockTeams = () =>
    of({
      data: {
        myTeams: [
          {
            id: 't1',
            name: 'Alpha',
            members: [{ id: 'u1' }],
          },
        ],
      },
    });

  const mockClocksAndAbsences = () =>
    of({
      data: {
        clocksForUser: [],
        absencesByUser: [],
      },
    });

  /* -------------------------------------------------- */
  /* getTeamEmployees                                   */
  /* -------------------------------------------------- */
  /**
   * Auto-generated code below aims at helping you parse
   * the standard input according to the problem statement.
   * ---
   * Hint: You can use the debug stream to print initialTX and initialTY, if Thor seems not follow your orders.
   **/

  var inputs: string[] = readline().split(' ');
  const lightX: number = parseInt(inputs[0]); // the X position of the light of power
  console.error('lightX', lightX);
  const lightY: number = parseInt(inputs[1]); // the Y position of the light of power
  console.error('lightY', lightY);
  const initialTx: number = parseInt(inputs[2]); // Thor's starting X position
  console.error('initialTx', initialTx);
  const initialTy: number = parseInt(inputs[3]); // Thor's starting Y position
  console.error('initialTy', initialTy);

// game loop
  while (true) {
    const remainingTurns: number = parseInt(readline()); // The remaining amount of turns Thor can move. Do not remove this line.
    console.error('remainingTurns', remainingTurns);
    let direction: string | null = null;

    if(initialTy === lightY && initialTx !== lightX || initialTx === lightX && initialTy !== lightY){
      if (initialTx > lightX){
        direction = "W";
      }else if (initialTx < lightX){
        direction = "E"
      }else if (initialTy > lightY){
        direction = "N";
      }else if (initialTy < lightY){
        direction = "S"
      }else if(initialTy > lightY && initialTx < lightX){
        direction = "NE";
      }else if(initialTx > lightX && initialTy < lightY){
        direction = "SW";
      }else if (initialTx < lightX && initialTy < lightY){
        direction = "SE";
      }else if (initialTx > lightX && initialTy > lightY){
        direction = "NW"
      }
    }

    // Write an action using console.log()
    // To debug: console.error('Debug messages...');


    // A single line providing the move to be made: N NE E SE S SW W or NW
    console.log(direction);
  }

  it('getTeamEmployees: returns [] when no managed members', (done) => {
    httpClientMock.post.mockReturnValueOnce(
      of({ data: { myTeamMembers: [] } })
    );

    service.getTeamEmployees().subscribe((res) => {
      expect(res).toEqual([]);
      done();
    });
  });

  it('getTeamEmployees: builds employee summary', (done) => {
    httpClientMock.post
      .mockReturnValueOnce(mockMembers())
      .mockReturnValueOnce(mockTeams())
      .mockReturnValue(mockClocksAndAbsences());

    service.getTeamEmployees().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0]).toMatchObject({
        id: 'u1',
        name: 'John Doe',
        team: 'Alpha',
        hoursThisWeek: 0,
        absence: 0,
      });
      done();
    });
  });

  it('getTeamEmployees: catches error in buildEmployeeSummary but keeps employee', (done) => {
    httpClientMock.post
      .mockReturnValueOnce(mockMembers())
      .mockReturnValueOnce(mockTeams())
      .mockReturnValue(throwError(() => new Error('Boom')));

    service.getTeamEmployees().subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0]).toMatchObject({
        id: 'u1',
        hoursThisWeek: 0,
        absence: 0,
        status: 'Needs Attention',
      });
      done();
    });
  });

  /* -------------------------------------------------- */
  /* getTeamEmployeesByTeamId                            */
  /* -------------------------------------------------- */

  it('getTeamEmployeesByTeamId: returns [] when team is null', (done) => {
    httpClientMock.post.mockReturnValueOnce(
      of({ data: { team: null } })
    );

    service.getTeamEmployeesByTeamId('t1').subscribe((res) => {
      expect(res).toEqual([]);
      done();
    });
  });

  it('getTeamEmployeesByTeamId: builds summaries', (done) => {
    httpClientMock.post
      .mockReturnValueOnce(
        of({
          data: {
            team: {
              id: 't1',
              name: 'Alpha',
              members: [
                {
                  id: 'u1',
                  firstName: 'Jane',
                  lastName: 'Smith',
                  email: 'jane@smith.dev',
                },
              ],
            },
          },
        })
      )
      .mockReturnValue(mockClocksAndAbsences());

    service.getTeamEmployeesByTeamId('t1').subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].team).toBe('Alpha');
      done();
    });
  });

  it('getTeamEmployeesByTeamId: catches buildEmployeeSummary error but keeps employee', (done) => {
    httpClientMock.post
      .mockReturnValueOnce(
        of({
          data: {
            team: {
              id: 't1',
              name: 'Alpha',
              members: [
                {
                  id: 'u1',
                  firstName: 'Jane',
                  lastName: 'Smith',
                  email: 'jane@smith.dev',
                },
              ],
            },
          },
        })
      )
      .mockReturnValue(throwError(() => new Error('Boom')));

    service.getTeamEmployeesByTeamId('t1').subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].hoursThisWeek).toBe(0);
      done();
    });
  });

  /* -------------------------------------------------- */
  /* getEmployeeKpi                                     */
  /* -------------------------------------------------- */

  it('getEmployeeKpi: returns null if user is not managed', (done) => {
    httpClientMock.post.mockReturnValueOnce(
      of({ data: { myTeamMembers: [] } })
    );

    service.getEmployeeKpi('u1').subscribe((res) => {
      expect(res).toBeNull();
      done();
    });
  });

  it('getEmployeeKpi: returns KPI', (done) => {
    httpClientMock.post
      .mockReturnValueOnce(mockMembers())
      .mockReturnValueOnce(mockTeams())
      .mockReturnValue(mockClocksAndAbsences());

    service.getEmployeeKpi('u1').subscribe((res) => {
      expect(res).not.toBeNull();
      expect(res?.id).toBe('u1');
      expect(res?.hours).toBe(0);
      done();
    });
  });

  it('getEmployeeKpi: catches error in buildEmployeeSummary and still returns KPI', (done) => {
    httpClientMock.post
      .mockReturnValueOnce(mockMembers())
      .mockReturnValueOnce(mockTeams())
      .mockReturnValue(throwError(() => new Error('Boom')));

    service.getEmployeeKpi('u1').subscribe((res) => {
      expect(res).not.toBeNull();
      expect(res?.hours).toBe(0);
      expect(res?.absent).toBe(0);
      done();
    });
  });

  /* -------------------------------------------------- */
  /* listManagedMembers                                 */
  /* -------------------------------------------------- */

  it('listManagedMembers maps members correctly', (done) => {
    httpClientMock.post
      .mockReturnValueOnce(mockMembers())
      .mockReturnValueOnce(mockTeams());

    service.listManagedMembers().subscribe((res) => {
      expect(res).toEqual([
        {
          id: 'u1',
          name: 'John Doe',
          team: 'Alpha',
        },
      ]);
      done();
    });
  });

  /* -------------------------------------------------- */
  /* requestGraphql / error paths                       */
  /* -------------------------------------------------- */

  it('requestGraphql throws when graphql errors exist', (done) => {
    httpClientMock.post.mockReturnValue(
      of({ data: null, errors: [{ message: 'Boom' }] } as any)
    );

    (service as any).requestGraphql('X').subscribe({
      error: (err: Error) => {
        expect(err.message).toContain('Boom');
        done();
      },
    });
  });

  it('loadClocks returns [] on error', (done) => {
    httpClientMock.post.mockReturnValue(
      throwError(() => new Error('Clock error'))
    );

    (service as any)
      .loadClocks('u1', new Date(), new Date())
      .subscribe((res: any[]) => {
        expect(res).toEqual([]);
        done();
      });
  });

  it('loadAbsences returns [] on error', (done) => {
    httpClientMock.post.mockReturnValue(
      throwError(() => new Error('Absence error'))
    );

    (service as any)
      .loadAbsences('u1')
      .subscribe((res: any[]) => {
        expect(res).toEqual([]);
        done();
      });
  });
});
