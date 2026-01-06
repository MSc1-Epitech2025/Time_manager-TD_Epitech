import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { TeamManagement } from '@pages/team-management/team-management';
import {
  TeamService,
  Team,
  TeamMember,
} from '@core/services/team';
import { AuthService, Role } from '@core/services/auth';
import { DeleteTeamModalComponent } from '@modal/delete-team-modal/delete-team-modal';

describe('TeamManagement (100% coverage)', () => {
  let component: TeamManagement;
  let fixture: ComponentFixture<TeamManagement>;

  let teamService: jest.Mocked<TeamService>;
  let auth: any;
  let router: jest.Mocked<Router>;
  let dialog: jest.Mocked<MatDialog>;

  const member1: TeamMember = { id: '1', name: 'John', email: 'john@test.com' };
  const member2: TeamMember = { id: '2', name: 'Jane', email: 'jane@test.com' };

  const teamA: Team = {
    id: '1',
    name: 'Alpha',
    description: 'desc',
    members: [member1],
  };

  beforeEach(async () => {
    teamService = {
      listTeams: jest.fn().mockReturnValue(of([teamA])),
      listAllTeams: jest.fn().mockReturnValue(of([teamA])),
      listMyTeams: jest.fn().mockReturnValue(of([teamA])),
      listMyTeamMembers: jest.fn().mockReturnValue(of([teamA])),
      populateTeamsWithMembers: jest.fn().mockReturnValue(of([teamA])),
      getAllUsers: jest.fn().mockReturnValue(of([member1, member2])),
      getTeam: jest.fn().mockReturnValue(of(teamA)),
      getTeamMembers: jest.fn().mockReturnValue(of([member1])),
      createTeam: jest.fn().mockReturnValue(of(teamA)),
      updateTeam: jest.fn().mockReturnValue(of(teamA)),
      deleteTeam: jest.fn().mockReturnValue(of(true)),
      addTeamMember: jest.fn().mockReturnValue(of(true)),
      removeTeamMember: jest.fn().mockReturnValue(of(true)),
    } as any;

    auth = {
      session: {
        user: {
          roles: ['ADMIN'] as Role[],
        },
      },
    };

    dialog = {
      open: jest.fn(),
    } as any;

    router = {
      navigate: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [TeamManagement],
      providers: [
        { provide: TeamService, useValue: teamService },
        { provide: AuthService, useValue: auth },
        { provide: MatDialog, useValue: dialog },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamManagement);
    component = fixture.componentInstance;
  });

  it('ngOnInit (ADMIN)', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(teamService.listAllTeams).toHaveBeenCalled();
    expect(teamService.getAllUsers).toHaveBeenCalled();
  }));

  it('ngOnInit (MANAGER)', fakeAsync(() => {
    auth.session.user.roles = ['MANAGER'];
    fixture.detectChanges();
    tick();

    expect(teamService.listMyTeamMembers).toHaveBeenCalled();
  }));

  it('ngOnInit (USER)', fakeAsync(() => {
    auth.session.user.roles = [];
    fixture.detectChanges();
    tick();

    expect(teamService.listMyTeams).toHaveBeenCalled();
  }));

  it('applyFilter with term', () => {
    component.teams = [teamA];
    component.searchTerm = 'alp';
    component.searchTeams();

    expect(component.filteredTeams.length).toBe(1);
  });

  it('applyFilter empty', () => {
    component.teams = [teamA];
    component.searchTerm = '';
    component.searchTeams();

    expect(component.filteredTeams.length).toBe(1);
  });

  it('viewTeamDetails navigates', () => {
    component.viewTeamDetails(teamA);

    expect(router.navigate).toHaveBeenCalledWith(['/app/manager'], {
      queryParams: {
        teamId: '1',
        teamName: 'Alpha',
      },
    });
  });

  it('showCreateForm', () => {
    component.showCreateForm();

    expect(component.isCreating).toBe(true);
    expect(component.formData.members).toEqual([]);
  });

  it('cancelForm', () => {
    component.isCreating = true;
    component.cancelForm();

    expect(component.isCreating).toBe(false);
    expect(component.selectedTeam).toBeNull();
  });

  it('selectTeam loads context', fakeAsync(() => {
    component.selectTeam(teamA);
    tick();

    expect(component.selectedTeam?.id).toBe('1');
    expect(component.formData.members.length).toBe(1);
  }));

  it('createTeam blocked if not admin', () => {
    auth.session.user.roles = [];
    component.createTeam();

    expect(teamService.createTeam).not.toHaveBeenCalled();
  });

  it('createTeam success', fakeAsync(() => {
    component.formData.name = 'New Team';
    component.formData.members = [member1];

    component.createTeam();
    tick();

    expect(teamService.createTeam).toHaveBeenCalled();
    expect(teamService.addTeamMember).toHaveBeenCalled();
  }));

  it('createTeam error', fakeAsync(() => {
    jest.spyOn(window, 'alert').mockImplementation();
    teamService.createTeam.mockReturnValueOnce(throwError(() => new Error('fail')));

    component.formData.name = 'X';
    component.createTeam();
    tick();

    expect(window.alert).toHaveBeenCalled();
  }));

  it('updateTeam no changes', () => {
    component.selectedTeam = teamA;
    component.formData = {
      id: '1',
      name: 'Alpha',
      description: 'desc',
      members: [...teamA.members],
    };

    component.updateTeam();
    expect(teamService.updateTeam).not.toHaveBeenCalled();
  });

  it('updateTeam with changes', fakeAsync(() => {
    component.selectedTeam = teamA;
    component.formData = {
      id: '1',
      name: 'Updated',
      description: '',
      members: [],
    };

    component.updateTeam();
    tick();

    expect(teamService.updateTeam).toHaveBeenCalled();
    expect(teamService.removeTeamMember).toHaveBeenCalled();
  }));

  it('deleteTeam confirmed', fakeAsync(() => {
    component.selectedTeam = teamA;

    dialog.open.mockReturnValue({
      afterClosed: () => of({ id: '1', isDestroyed: true }),
    } as MatDialogRef<DeleteTeamModalComponent>);

    component.deleteTeam();
    tick();

    expect(teamService.deleteTeam).toHaveBeenCalledWith('1');
  }));

  it('addMember', () => {
    component.formData.members = [];
    component.addMember(member1);

    expect(component.formData.members.length).toBe(1);
  });

  it('removeMember', () => {
    component.formData.members = [member1];
    component.removeMember(0);

    expect(component.formData.members.length).toBe(0);
  });

  it('updateFilteredUsers', fakeAsync(() => {
    component.allUsers = [member1, member2];
    component.newMemberInput = 'john';

    component.onMemberInputChange();
    tick();

    component.filteredUsers?.subscribe(users => {
      expect(users.length).toBe(1);
    });
  }));

  it('showForm getter', () => {
    component.isCreating = true;
    expect(component.showForm).toBe(true);
  });

  it('role getters', () => {
    expect(component.isAdminUser).toBe(true);
    expect(component.isManagerUser).toBe(false);
  });
});
