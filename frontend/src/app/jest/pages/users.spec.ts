import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UsersComponent } from '@pages/users/users';
import { UserService, User } from '@core/services/user';
import { TeamService } from '@core/services/team';
import { SecurityValidationService } from '@core/services/security-validation';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ElementRef } from '@angular/core';

describe('UsersComponent – Jest (100% coverage)', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;

  let userService: {
    getAllUsers: jest.Mock;
    createUser: jest.Mock;
    updateUser: jest.Mock;
    deleteUser: jest.Mock;
  };

  let teamService: {
    listAllTeams: jest.Mock;
    addTeamMember: jest.Mock;
    removeTeamMember: jest.Mock;
  };

  let securityService: {
    validateUserCreation: jest.Mock;
    validateUserUpdate: jest.Mock;
  };

  let dialog: {
    open: jest.Mock;
  };

  const mockUsers: User[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '123',
      role: 'ADMIN',
      poste: 'Dev',
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
    },
  ];

  beforeEach(async () => {
    userService = {
      getAllUsers: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    teamService = {
      listAllTeams: jest.fn().mockReturnValue(of([])),
      addTeamMember: jest.fn().mockReturnValue(of({})),
      removeTeamMember: jest.fn().mockReturnValue(of({})),
    };

    securityService = {
      validateUserCreation: jest.fn(),
      validateUserUpdate: jest.fn(),
    };

    dialog = {
      open: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: TeamService, useValue: teamService },
        { provide: SecurityValidationService, useValue: securityService },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
  });

  it('ngOnInit calls refreshUsers', () => {
    userService.getAllUsers.mockReturnValue(of([]));

    const spy = jest.spyOn(component, 'refreshUsers');
    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });


  it('refreshUsers success', () => {
    userService.getAllUsers.mockReturnValue(of(mockUsers));

    component.refreshUsers();

    expect(component.isLoading).toBe(false);
    expect(component.users.length).toBe(2);
    expect(component.filteredUsers.length).toBe(2);
    expect(component.lastError).toBeNull();
  });

  it('refreshUsers error', () => {
    jest.spyOn(console, 'error').mockImplementation();
    userService.getAllUsers.mockReturnValue(
      throwError(() => ({ message: 'API error' }))
    );

    component.refreshUsers();

    expect(component.isLoading).toBe(false);
    expect(component.users).toEqual([]);
    expect(component.filteredUsers).toEqual([]);
    expect(component.lastError).toBe('API error');
  });

  it('applyFilter without term', () => {
    component.users = mockUsers;
    component.searchTerm = '';
    component.applyFilter();

    expect(component.filteredUsers.length).toBe(2);
  });

  it('applyFilter with term', () => {
    component.users = mockUsers;
    component.searchTerm = 'john';
    component.applyFilter();

    expect(component.filteredUsers.length).toBe(1);
    expect(component.filteredUsers[0].firstName).toBe('John');
  });

  it('searchUsers calls applyFilter', () => {
    const spy = jest.spyOn(component, 'applyFilter');
    component.searchUsers();
    expect(spy).toHaveBeenCalled();
  });

  it('showCreateForm resets form', () => {
    component.showCreateForm();

    expect(component.isCreating).toBe(true);
    expect(component.selectedUser).toBeNull();
    expect(component.formData.firstName).toBe('');
  });

  it('selectUser fills form', async () => {
    await component.selectUser(mockUsers[0]);

    expect(component.selectedUser?.id).toBe('1');
    expect(component.isCreating).toBe(false);
    expect(component.formData.email).toBe('john@test.com');
  });

  it('cancelForm resets state', () => {
    component.isCreating = true;
    component.selectedUser = mockUsers[0];

    component.cancelForm();

    expect(component.isCreating).toBe(false);
    expect(component.selectedUser).toBeNull();
  });

  it('createUser validation error', () => {
    jest.spyOn(window, 'alert').mockImplementation();

    component.formData.firstName = '';
    component.createUser();

    expect(window.alert).toHaveBeenCalled();
  });

  it('createUser success', async () => {
    const refreshSpy = jest.spyOn(component, 'refreshUsers');
    const cancelSpy = jest.spyOn(component, 'cancelForm');

    userService.createUser.mockReturnValue(of(mockUsers[0]));
    userService.getAllUsers.mockReturnValue(of(mockUsers));

    component.formData = {
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      phone: '',
      role: 'EMPLOYEE',
      poste: '',
    };

    await component.createUser();

    expect(userService.createUser).toHaveBeenCalled();
    expect(refreshSpy).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('createUser error', async () => {
    jest.spyOn(window, 'alert').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    userService.createUser.mockReturnValue(
      throwError(() => ({ message: 'create error' }))
    );

    component.formData = {
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      phone: '',
      role: 'EMPLOYEE',
      poste: '',
    };

    await component.createUser();

    expect(window.alert).toHaveBeenCalled();
  });

  it('updateUser returns if no selectedUser', () => {
    component.selectedUser = null;
    component.updateUser();
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('updateUser validation error', () => {
    jest.spyOn(window, 'alert').mockImplementation();

    component.selectedUser = mockUsers[0];
    component.formData.firstName = '';

    component.updateUser();

    expect(window.alert).toHaveBeenCalled();
  });

  it('updateUser success', async () => {
    const refreshSpy = jest.spyOn(component, 'refreshUsers');
    const cancelSpy = jest.spyOn(component, 'cancelForm');

    userService.updateUser.mockReturnValue(of(mockUsers[0]));
    userService.getAllUsers.mockReturnValue(of(mockUsers));

    component.selectedUser = mockUsers[0];
    component.formData = { ...mockUsers[0] };

    await component.updateUser();

    expect(userService.updateUser).toHaveBeenCalled();
    expect(refreshSpy).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('updateUser error', async () => {
    jest.spyOn(window, 'alert').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    userService.updateUser.mockReturnValue(
      throwError(() => ({ message: 'update error' }))
    );

    component.selectedUser = mockUsers[0];
    component.formData = { ...mockUsers[0] };

    await component.updateUser();

    expect(window.alert).toHaveBeenCalled();
  });

  it('deleteUser returns if no selectedUser', () => {
    component.selectedUser = null;
    component.deleteUser();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('deleteUser cancelled', () => {
    component.selectedUser = mockUsers[0];
    dialog.open.mockReturnValue({ afterClosed: () => of(false) });

    component.deleteUser();

    expect(userService.deleteUser).not.toHaveBeenCalled();
  });

  it('deleteUser success', fakeAsync(() => {
    const refreshSpy = jest.spyOn(component, 'refreshUsers');
    const cancelSpy = jest.spyOn(component, 'cancelForm');

    component.selectedUser = mockUsers[0];
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    userService.deleteUser.mockReturnValue(of(true));
    userService.getAllUsers.mockReturnValue(of(mockUsers));

    component.deleteUser();
    tick();

    expect(userService.deleteUser).toHaveBeenCalledWith('1');
    expect(refreshSpy).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
  }));

  it('deleteUser error', () => {
    jest.spyOn(window, 'alert').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    component.selectedUser = mockUsers[0];
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    userService.deleteUser.mockReturnValue(
      throwError(() => ({ message: 'delete error' }))
    );

    component.deleteUser();

    expect(component.isLoading).toBe(false);
    expect(window.alert).toHaveBeenCalled();
  });

  it('showForm getter', () => {
    component.isCreating = false;
    component.selectedUser = null;
    expect(component.showForm).toBe(false);

    component.isCreating = true;
    expect(component.showForm).toBe(true);

    component.isCreating = false;
    component.selectedUser = mockUsers[0];
    expect(component.showForm).toBe(true);
  });

  it('scrollFormToTop works', fakeAsync(() => {
    const el = { scrollTop: 50 } as HTMLElement;
    component.userFormSection = new ElementRef(el);

    (component as any).scrollFormToTop();
    tick();

    expect(el.scrollTop).toBe(0);
  }));

  it('refreshUsers error without message uses fallback text', () => {
    jest.spyOn(console, 'error').mockImplementation();

    userService.getAllUsers.mockReturnValue(
      throwError(() => ({}))
    );

    component.refreshUsers();

    expect(component.lastError).toBe('Unable to retrieve users at this time.');
  });

  it('selectUser uses default values when optional fields are missing', async () => {
    const userWithoutOptionalFields: User = {
      id: '3',
      firstName: 'No',
      lastName: 'Optionals',
      email: 'no@opt.com',
    };

    await component.selectUser(userWithoutOptionalFields);

    expect(component.formData.phone).toBe('');
    expect(component.formData.role).toBe('EMPLOYEE');
    expect(component.formData.poste).toBe('');
  });

  it('createUser sends undefined role when role is empty string', async () => {
    userService.createUser.mockImplementation((input) => {
      expect(input.role).toBeUndefined();
      return of(mockUsers[0]);
    });

    userService.getAllUsers.mockReturnValue(of(mockUsers));

    component.formData = {
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      phone: '',
      role: '',
      poste: '',
    };

    await component.createUser();
  });

  it('createUser error without message shows fallback alert', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    userService.createUser.mockReturnValue(throwError(() => ({})));

    component.formData = {
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      phone: '',
      role: 'EMPLOYEE',
      poste: '',
    };

    await component.createUser();

    expect(alertSpy).toHaveBeenCalledWith(
      'Error creating user: Unknown error'
    );
  });

  it('updateUser sends undefined optional fields when empty', async () => {
    userService.updateUser.mockImplementation((input) => {
      expect(input.phone).toBeUndefined();
      expect(input.role).toBeUndefined();
      expect(input.poste).toBeUndefined();
      return of(mockUsers[0]);
    });

    userService.getAllUsers.mockReturnValue(of(mockUsers));

    component.selectedUser = mockUsers[0];
    component.formData = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '',
      role: '',
      poste: '',
    };

    await component.updateUser();
  });

  it('updateUser error without message shows fallback alert', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    userService.updateUser.mockReturnValue(throwError(() => ({})));

    component.selectedUser = mockUsers[0];
    component.formData = { ...mockUsers[0] };

    await component.updateUser();

    expect(alertSpy).toHaveBeenCalledWith(
      'Error updating user: Unknown error'
    );
  });

  it('deleteUser error without message shows fallback alert', () => {
    jest.spyOn(window, 'alert').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    component.selectedUser = mockUsers[0];
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });

    userService.deleteUser.mockReturnValue(
      throwError(() => ({}))
    );

    component.deleteUser();

    expect(window.alert).toHaveBeenCalledWith(
      'Error deleting user: Unknown error'
    );
  });
});
