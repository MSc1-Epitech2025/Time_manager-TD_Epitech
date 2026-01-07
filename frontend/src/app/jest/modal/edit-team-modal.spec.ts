import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { EditTeamModalComponent } from '@modal/edit-team-modal/edit-team-modal';
import { TeamService, TeamMember } from '@core/services/team';

describe('EditTeamModalComponent', () => {
  let component: EditTeamModalComponent;
  let fixture: ComponentFixture<EditTeamModalComponent>;
  let dialogRefMock: jest.Mocked<MatDialogRef<EditTeamModalComponent>>;
  let teamServiceMock: jest.Mocked<TeamService>;

  const mockUsers: TeamMember[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com' },
  ];

  const mockTeamData = {
    team: {
      id: '1',
      name: 'Test Team',
      description: 'Test Description',
      members: [{ id: '1', name: 'John Doe', email: 'john@example.com' }],
    },
  };

  beforeEach(async () => {
    dialogRefMock = {
      close: jest.fn(),
    } as unknown as jest.Mocked<MatDialogRef<EditTeamModalComponent>>;

    teamServiceMock = {
      getAllUsers: jest.fn().mockReturnValue(of(mockUsers)),
    } as unknown as jest.Mocked<TeamService>;

    await TestBed.configureTestingModule({
      imports: [EditTeamModalComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: mockTeamData },
        { provide: TeamService, useValue: teamServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTeamModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with team data from MAT_DIALOG_DATA', () => {
    fixture.detectChanges();
    expect(component.team.name).toBe('Test Team');
    expect(component.team.description).toBe('Test Description');
    expect(component.team.members).toHaveLength(1);
  });

  it('should create a copy of team data to avoid mutating original', () => {
    fixture.detectChanges();
    expect(component.team).not.toBe(mockTeamData.team);
    expect(component.team.members).not.toBe(mockTeamData.team.members);
  });

  it('should handle team data without members', async () => {
    TestBed.resetTestingModule();

    const dataWithoutMembers = {
      team: {
        id: '1',
        name: 'Test Team',
        description: 'Test Description',
      },
    };

    await TestBed.configureTestingModule({
      imports: [EditTeamModalComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: dataWithoutMembers },
        { provide: TeamService, useValue: teamServiceMock },
      ],
    }).compileComponents();

    const newFixture = TestBed.createComponent(EditTeamModalComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.team.members).toEqual([]);
  });

  describe('ngOnInit', () => {
    it('should load all users on init', () => {
      fixture.detectChanges();

      expect(teamServiceMock.getAllUsers).toHaveBeenCalledTimes(1);
      expect(component.allUsers).toEqual(mockUsers);
    });

    it('should handle error when loading users fails', () => {
      teamServiceMock.getAllUsers.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      expect(component.allUsers).toEqual([]);
      expect(component.filteredUsers).toBeNull();
    });
  });

  describe('onMemberInputChange', () => {
    it('should update filtered users when input changes', fakeAsync(() => {
      fixture.detectChanges();

      component.newMemberInput = 'jane';
      component.onMemberInputChange();

      let filteredResult: TeamMember[] = [];
      component.filteredUsers?.subscribe((users) => {
        filteredResult = users;
      });
      tick();

      expect(filteredResult).toHaveLength(1);
      expect(filteredResult[0].name).toBe('Jane Smith');
    }));
  });

  describe('updateFilteredUsers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter out current team members', fakeAsync(() => {
      component.newMemberInput = '';
      component.onMemberInputChange();

      let filteredResult: TeamMember[] = [];
      component.filteredUsers?.subscribe((users) => {
        filteredResult = users;
      });
      tick();

      // John (id: 1) is already a member, so should be filtered out
      expect(filteredResult).toHaveLength(2);
      expect(filteredResult.some((u) => u.id === '1')).toBe(false);
    }));

    it('should return all non-member users when input is empty', fakeAsync(() => {
      component.newMemberInput = '   ';
      component.onMemberInputChange();

      let filteredResult: TeamMember[] = [];
      component.filteredUsers?.subscribe((users) => {
        filteredResult = users;
      });
      tick();

      expect(filteredResult).toHaveLength(2);
    }));

    it('should filter by name case-insensitively', fakeAsync(() => {
      component.newMemberInput = 'JANE';
      component.onMemberInputChange();

      let filteredResult: TeamMember[] = [];
      component.filteredUsers?.subscribe((users) => {
        filteredResult = users;
      });
      tick();

      expect(filteredResult).toHaveLength(1);
      expect(filteredResult[0].name).toBe('Jane Smith');
    }));

    it('should filter by email', fakeAsync(() => {
      component.newMemberInput = 'bob@';
      component.onMemberInputChange();

      let filteredResult: TeamMember[] = [];
      component.filteredUsers?.subscribe((users) => {
        filteredResult = users;
      });
      tick();

      expect(filteredResult).toHaveLength(1);
      expect(filteredResult[0].email).toBe('bob@example.com');
    }));

    it('should handle users without email', fakeAsync(() => {
      component.allUsers = [
        { id: '4', name: 'No Email User', email: undefined as any },
      ];
      component.newMemberInput = 'no email';
      component.onMemberInputChange();

      let filteredResult: TeamMember[] = [];
      component.filteredUsers?.subscribe((users) => {
        filteredResult = users;
      });
      tick();

      expect(filteredResult).toHaveLength(1);
    }));
  });

  describe('addMember', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add a new member to the team', () => {
      const newMember: TeamMember = { id: '2', name: 'Jane Smith', email: 'jane@example.com' };

      component.addMember(newMember);

      expect(component.team.members).toHaveLength(2);
      expect(component.team.members[1]).toEqual({
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
      });
    });

    it('should clear input after adding member', () => {
      component.newMemberInput = 'jane';
      const newMember: TeamMember = { id: '2', name: 'Jane Smith', email: 'jane@example.com' };

      component.addMember(newMember);

      expect(component.newMemberInput).toBe('');
    });

    it('should not add duplicate member', () => {
      const existingMember: TeamMember = { id: '1', name: 'John Doe', email: 'john@example.com' };

      component.addMember(existingMember);

      expect(component.team.members).toHaveLength(1);
    });

    it('should handle numeric id conversion', () => {
      const memberWithNumericId = { id: 5, name: 'Numeric ID', email: 'num@example.com' } as any;

      component.addMember(memberWithNumericId);

      expect(component.team.members).toHaveLength(2);
      expect(component.team.members[1].id).toBe('5');
    });
  });

  describe('removeMember', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should remove member at specified index', () => {
      component.removeMember(0);

      expect(component.team.members).toHaveLength(0);
    });

    it('should remove correct member when multiple members exist', () => {
      component.team.members.push({ id: '2', name: 'Jane Smith', email: 'jane@example.com' });

      component.removeMember(0);

      expect(component.team.members).toHaveLength(1);
      expect(component.team.members[0].name).toBe('Jane Smith');
    });
  });

  describe('onCancel', () => {
    it('should close dialog without data', () => {
      fixture.detectChanges();

      component.onCancel();

      expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
      expect(dialogRefMock.close).toHaveBeenCalledWith();
    });
  });

  describe('onSave', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close dialog with team data', () => {
      component.onSave();

      expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
      expect(dialogRefMock.close).toHaveBeenCalledWith(component.team);
    });

    it('should set name, description and members from team', () => {
      component.team.name = 'Updated Team';
      component.team.description = 'Updated Description';
      component.team.members = [{ id: '1', name: 'Test', email: 'test@test.com' }];

      component.onSave();

      expect(component.name).toBe('Updated Team');
      expect(component.description).toBe('Updated Description');
      expect(component.members).toEqual(component.team.members);
    });
  });
});
