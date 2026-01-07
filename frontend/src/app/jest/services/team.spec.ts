import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  TeamService,
  Team,
  TeamMember,
  CreateTeamInput,
  UpdateTeamInput,
  GraphqlRequestError,
  isGraphqlAuthorizationError,
} from '@core/services/team';
import { environment } from '@environments/environment';

const GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;

  const mockGraphqlUser = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  };

  const mockGraphqlTeam = {
    id: '1',
    name: 'Team Alpha',
    description: 'Test team',
    members: [mockGraphqlUser],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeamService],
    });

    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('listAllTeams', () => {
    it('should return all teams', (done) => {
      service.listAllTeams().subscribe((teams) => {
        expect(teams.length).toBe(1);
        expect(teams[0].name).toBe('Team Alpha');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [mockGraphqlTeam] } });
    });

    it('should handle empty allTeams array', (done) => {
      service.listAllTeams().subscribe((teams) => {
        expect(teams).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [] } });
    });

    it('should handle null allTeams', (done) => {
      service.listAllTeams().subscribe((teams) => {
        expect(teams).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: null } });
    });

    it('should handle undefined payload', (done) => {
      service.listAllTeams().subscribe((teams) => {
        expect(teams).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: null });
    });
  });

  describe('listTeams', () => {
    it('should return teams', (done) => {
      service.listTeams().subscribe((teams) => {
        expect(teams.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { teams: [mockGraphqlTeam] } });
    });

    it('should handle null teams', (done) => {
      service.listTeams().subscribe((teams) => {
        expect(teams).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { teams: null } });
    });
  });

  describe('listManagedTeams', () => {
    it('should return managed teams', (done) => {
      service.listManagedTeams().subscribe((teams) => {
        expect(teams.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { myManagedTeams: [mockGraphqlTeam] } });
    });

    it('should handle null myManagedTeams', (done) => {
      service.listManagedTeams().subscribe((teams) => {
        expect(teams).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { myManagedTeams: null } });
    });
  });

  describe('listMyTeams', () => {
    it('should return my teams', (done) => {
      service.listMyTeams().subscribe((teams) => {
        expect(teams.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { myTeams: [mockGraphqlTeam] } });
    });

    it('should handle null myTeams', (done) => {
      service.listMyTeams().subscribe((teams) => {
        expect(teams).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { myTeams: null } });
    });
  });

  describe('getTeam', () => {
    it('should return a team by id', (done) => {
      service.getTeam('1').subscribe((team) => {
        expect(team.id).toBe('1');
        expect(team.name).toBe('Team Alpha');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { team: mockGraphqlTeam } });
    });

// Fix for getTeam tests - use the French message
    it('should throw error when team not found', (done) => {
      service.getTeam('999').subscribe({
        error: (error) => {
          expect(error.message).toContain('Equipe introuvable');
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { team: null } });
    });

    it('should handle undefined payload', (done) => {
      service.getTeam('1').subscribe({
        error: (error) => {
          expect(error.message).toContain('Equipe introuvable');
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: null });
    });
  });

  describe('getTeamMembers', () => {
    it('should return team members', (done) => {
      service.getTeamMembers('1').subscribe((members) => {
        expect(members.length).toBe(1);
        expect(members[0].name).toBe('John Doe');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { teamMembers: [mockGraphqlUser] } });
    });

    it('should handle null teamMembers', (done) => {
      service.getTeamMembers('1').subscribe((members) => {
        expect(members).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { teamMembers: null } });
    });
  });

  describe('populateTeamsWithMembers', () => {
    it('should populate teams with members', (done) => {
      const teams: Team[] = [
        { id: '1', name: 'Team A', members: [] },
        { id: '2', name: 'Team B', members: [] },
      ];

      service.populateTeamsWithMembers(teams).subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].members.length).toBe(1);
        done();
      });

      const requests = httpMock.match(GRAPHQL_ENDPOINT);
      expect(requests.length).toBe(2);
      requests[0].flush({ data: { teamMembers: [mockGraphqlUser] } });
      requests[1].flush({ data: { teamMembers: [mockGraphqlUser] } });
    });

    it('should return empty array for empty teams', (done) => {
      service.populateTeamsWithMembers([]).subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should handle errors when fetching members', (done) => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const teams: Team[] = [{ id: '1', name: 'Team A', members: [] }];

      service.populateTeamsWithMembers(teams).subscribe((result) => {
        expect(result[0].members).toEqual([]);
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('createTeam', () => {
    it('should create a team', (done) => {
      const input: CreateTeamInput = { name: 'New Team', description: 'Desc' };

      service.createTeam(input).subscribe((team) => {
        expect(team.name).toBe('Team Alpha');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { createTeam: mockGraphqlTeam } });
    });

    it('should create a team with null description', (done) => {
      const input: CreateTeamInput = { name: 'New Team', description: null };

      service.createTeam(input).subscribe((team) => {
        expect(team).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { createTeam: mockGraphqlTeam } });
    });
  });

  describe('updateTeam', () => {
    it('should update a team', (done) => {
      const input: UpdateTeamInput = { name: 'Updated Team' };

      service.updateTeam('1', input).subscribe((team) => {
        expect(team).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { updateTeam: mockGraphqlTeam } });
    });

    it('should update a team with null description', (done) => {
      const input: UpdateTeamInput = { description: null };

      service.updateTeam('1', input).subscribe((team) => {
        expect(team).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { updateTeam: mockGraphqlTeam } });
    });
  });

  describe('deleteTeam', () => {
    it('should delete a team', (done) => {
      service.deleteTeam('1').subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { deleteTeam: true } });
    });

    it('should handle null deleteTeam response', (done) => {
      service.deleteTeam('1').subscribe((result) => {
        expect(result).toBe(false);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { deleteTeam: null } });
    });
  });

  describe('addTeamMember', () => {
    it('should add a team member', (done) => {
      service.addTeamMember('1', '2').subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { addTeamMember: true } });
    });

    it('should handle null addTeamMember response', (done) => {
      service.addTeamMember('1', '2').subscribe((result) => {
        expect(result).toBe(false);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { addTeamMember: null } });
    });
  });

  describe('removeTeamMember', () => {
    it('should remove a team member', (done) => {
      service.removeTeamMember('1', '2').subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { removeTeamMember: true } });
    });

    it('should handle null removeTeamMember response', (done) => {
      service.removeTeamMember('1', '2').subscribe((result) => {
        expect(result).toBe(false);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { removeTeamMember: null } });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', (done) => {
      service.getAllUsers().subscribe((users) => {
        expect(users.length).toBe(1);
        expect(users[0].name).toBe('John Doe');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { users: [mockGraphqlUser] } });
    });

    it('should handle null users', (done) => {
      service.getAllUsers().subscribe((users) => {
        expect(users).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { users: null } });
    });
  });

  describe('listMyTeamMembers', () => {
    it('should return my team members', (done) => {
      const mockGroup = {
        teamId: '1',
        teamName: 'Team A',
        members: [mockGraphqlUser],
      };

      service.listMyTeamMembers().subscribe((teams) => {
        expect(teams.length).toBe(1);
        expect(teams[0].name).toBe('Team A');
        expect(teams[0].members.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { myTeamMembers: [mockGroup] } });
    });

    it('should handle null myTeamMembers', (done) => {
      service.listMyTeamMembers().subscribe((teams) => {
        expect(teams).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { myTeamMembers: null } });
    });

    it('should handle empty members in group', (done) => {
      const mockGroup = {
        teamId: '1',
        teamName: 'Team A',
        members: null,
      };

      service.listMyTeamMembers().subscribe((teams) => {
        expect(teams[0].members).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { myTeamMembers: [mockGroup] } });
    });
  });

  describe('mapTeam and buildMemberName', () => {
    it('should map team with all fields', (done) => {
      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].id).toBe('1');
        expect(teams[0].description).toBe('Test team');
        expect(teams[0].members[0].email).toBe('john.doe@example.com');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [mockGraphqlTeam] } });
    });

    it('should handle null description', (done) => {
      const teamNoDesc = { ...mockGraphqlTeam, description: null };

      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].description).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [teamNoDesc] } });
    });

    it('should handle null members', (done) => {
      const teamNoMembers = { ...mockGraphqlTeam, members: null };

      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].members).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [teamNoMembers] } });
    });

    it('should build member name from firstName only', (done) => {
      const memberFirstOnly = { id: '1', firstName: 'John', lastName: null, email: null };
      const teamWithMember = { ...mockGraphqlTeam, members: [memberFirstOnly] };

      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].members[0].name).toBe('John');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [teamWithMember] } });
    });

    it('should build member name from lastName only', (done) => {
      const memberLastOnly = { id: '1', firstName: null, lastName: 'Doe', email: null };
      const teamWithMember = { ...mockGraphqlTeam, members: [memberLastOnly] };

      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].members[0].name).toBe('Doe');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [teamWithMember] } });
    });

    it('should build member name from email when no names', (done) => {
      const memberEmailOnly = { id: '1', firstName: null, lastName: null, email: 'user@test.com' };
      const teamWithMember = { ...mockGraphqlTeam, members: [memberEmailOnly] };

      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].members[0].name).toBe('user');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [teamWithMember] } });
    });

    it('should use id as name when no names or email', (done) => {
      const memberIdOnly = { id: '123', firstName: null, lastName: null, email: null };
      const teamWithMember = { ...mockGraphqlTeam, members: [memberIdOnly] };

      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].members[0].name).toBe('123');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [teamWithMember] } });
    });

    it('should use email as name when email has no @ symbol', (done) => {
      const memberBadEmail = { id: '123', firstName: null, lastName: null, email: 'invalid' };
      const teamWithMember = { ...mockGraphqlTeam, members: [memberBadEmail] };

      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].members[0].name).toBe('invalid');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [teamWithMember] } });
    });

    it('should handle whitespace-only names', (done) => {
      const memberWhitespace = { id: '1', firstName: '   ', lastName: '   ', email: 'a@b.com' };
      const teamWithMember = { ...mockGraphqlTeam, members: [memberWhitespace] };

      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].members[0].name).toBe('a');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [teamWithMember] } });
    });

    it('should handle null email in member', (done) => {
      const memberNoEmail = { id: '1', firstName: 'John', lastName: 'Doe', email: null };
      const teamWithMember = { ...mockGraphqlTeam, members: [memberNoEmail] };

      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].members[0].email).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [teamWithMember] } });
    });

    it('should convert numeric id to string', (done) => {
      const teamNumericId = { id: 123, name: 'Team', description: null, members: [] };

      service.listAllTeams().subscribe((teams) => {
        expect(teams[0].id).toBe('123');
        done();
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({ data: { allTeams: [teamNumericId] } });
    });
  });

  describe('GraphQL error handling', () => {
    it('should throw GraphqlRequestError on GraphQL errors', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(GraphqlRequestError);
          expect(error.operationName).toBe('AllTeams');
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Something went wrong' }],
        data: null,
      });
    });

    it('should detect authorization error with forbidden message', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Forbidden access' }],
        data: null,
      });
    });

    it('should detect authorization error with unauthorized message', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Unauthorized request' }],
        data: null,
      });
    });

    it('should detect authorization error with access denied message', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Access denied' }],
        data: null,
      });
    });

    it('should detect authorization error with not allowed message', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Operation not allowed' }],
        data: null,
      });
    });

    it('should detect authorization error with requires admin message', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'This action requires ADMIN role' }],
        data: null,
      });
    });

    it('should detect authorization error with requires manager message', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'This action requires Manager permission' }],
        data: null,
      });
    });

    it('should detect authorization error from extension code', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Error', extensions: { code: 'FORBIDDEN' } }],
        data: null,
      });
    });

    it('should detect authorization error from extension classification', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Error', extensions: { classification: 'UNAUTHORIZED' } }],
        data: null,
      });
    });

    it('should detect authorization error from extension errorType', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Error', extensions: { errorType: 'ACCESS_DENIED' } }],
        data: null,
      });
    });

    it('should detect authorization error from extension error_code', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Error', extensions: { error_code: 'UNAUTHENTICATED' } }],
        data: null,
      });
    });

    it('should detect authorization error from lowercase extension', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Error', extensions: { code: 'accessdenied' } }],
        data: null,
      });
    });

    it('should not detect auth error for non-auth errors', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(false);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Database connection failed' }],
        data: null,
      });
    });

    it('should not detect auth error when only some errors are auth', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(false);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Forbidden' }, { message: 'Some other error' }],
        data: null,
      });
    });

    it('should handle error with null extensions', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(false);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Error', extensions: null }],
        data: null,
      });
    });

    it('should handle error with empty message', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.message).toContain('Unexpected error');
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: '' }],
        data: null,
      });
    });

    it('should handle null error in looksLikeAuthorizationError', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          if (error instanceof GraphqlRequestError) {
            expect(error.isAuthorizationError).toBe(false);
          } else {
            expect(error).toBeDefined();
          }
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Error' }],
        data: null,
      });
    });

    it('should handle non-string extension values', (done) => {
      service.listAllTeams().subscribe({
        error: (error) => {
          expect(error.isAuthorizationError).toBe(false);
          done();
        },
      });

      const req = httpMock.expectOne(GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Error', extensions: { code: 123, classification: null } }],
        data: null,
      });
    });
  });

  describe('GraphqlRequestError', () => {
    it('should create error with operation name', () => {
      const error = new GraphqlRequestError('TestOp', [{ message: 'Test error' }], false);
      expect(error.name).toBe('GraphqlRequestError');
      expect(error.operationName).toBe('TestOp');
      expect(error.message).toContain('[GraphQL:TestOp]');
    });

    it('should create error without operation name', () => {
      const error = new GraphqlRequestError(undefined, [{ message: 'Test error' }], false);
      expect(error.message).toContain('[GraphQL:unknown]');
    });

    it('should create error with multiple messages', () => {
      const error = new GraphqlRequestError(
        'Op',
        [{ message: 'Error 1' }, { message: 'Error 2' }],
        false
      );
      expect(error.message).toContain('Error 1');
      expect(error.message).toContain('Error 2');
    });

    it('should create error with empty messages', () => {
      const error = new GraphqlRequestError('Op', [{ message: '' }, { message: '' }], false);
      expect(error.message).toContain('Unexpected error');
    });
  });

  describe('isGraphqlAuthorizationError', () => {
    it('should return true for GraphqlRequestError with isAuthorizationError', () => {
      const error = new GraphqlRequestError('Op', [{ message: 'Forbidden' }], true);
      expect(isGraphqlAuthorizationError(error)).toBe(true);
    });

    it('should return false for GraphqlRequestError without isAuthorizationError', () => {
      const error = new GraphqlRequestError('Op', [{ message: 'Error' }], false);
      expect(isGraphqlAuthorizationError(error)).toBe(false);
    });

    it('should return false for non-GraphqlRequestError', () => {
      const error = new Error('Regular error');
      expect(isGraphqlAuthorizationError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isGraphqlAuthorizationError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isGraphqlAuthorizationError(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isGraphqlAuthorizationError('error')).toBe(false);
    });
  });
});
