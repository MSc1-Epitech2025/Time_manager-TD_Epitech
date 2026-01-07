import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthCallbackComponent } from '@auth/callback';
import { AuthService } from '@core/services/auth';

describe('AuthCallbackComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let authService: {
    normalizeUser: jest.Mock;
    extractRoles: jest.Mock;
    loginSuccess: jest.Mock;
  };
  let router: { navigate: jest.Mock };

  const mockWindowLocation = (search: string) => {
    Object.defineProperty(window, 'location', {
      value: { search },
      writable: true,
    });
  };

  beforeEach(waitForAsync(() => {
    authService = {
      normalizeUser: jest.fn(),
      extractRoles: jest.fn(),
      loginSuccess: jest.fn(),
    };

    router = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  }));

  const createComponent = () => {
    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
  };

  it('should create', () => {
    mockWindowLocation('?id=123&email=test@test.com');
    authService.extractRoles.mockReturnValue(['EMPLOYEE']);
    authService.normalizeUser.mockReturnValue({ roles: ['EMPLOYEE'] });

    createComponent();
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should redirect to login when id is missing', async () => {
    mockWindowLocation('?email=test@test.com');

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });


  it('should redirect to login when email is missing', async () => {
    mockWindowLocation('?id=123');
    jest.spyOn(console, 'error').mockImplementation();

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login when both id and email are missing', async () => {
    mockWindowLocation('');
    jest.spyOn(console, 'error').mockImplementation();

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to enterprise for ADMIN role', async () => {
    mockWindowLocation('?id=123&email=admin@test.com&firstName=John&lastName=Doe&role=ADMIN');
    jest.spyOn(console, 'log').mockImplementation();

    authService.extractRoles.mockReturnValue(['ADMIN']);
    authService.normalizeUser.mockReturnValue({
      id: '123',
      email: 'admin@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['ADMIN'],
    });

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authService.extractRoles).toHaveBeenCalledWith('ADMIN');
    expect(authService.normalizeUser).toHaveBeenCalledWith({
      id: '123',
      email: 'admin@test.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['ADMIN'],
    });
    expect(authService.loginSuccess).toHaveBeenCalledWith({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: expect.objectContaining({ roles: ['ADMIN'] }),
    }, true);
    expect(router.navigate).toHaveBeenCalledWith(['/app/enterprise']);
  });

  it('should navigate to employee for MANAGER role', async () => {
    mockWindowLocation('?id=123&email=manager@test.com&role=MANAGER');
    jest.spyOn(console, 'log').mockImplementation();

    authService.extractRoles.mockReturnValue(['MANAGER']);
    authService.normalizeUser.mockReturnValue({ roles: ['MANAGER'] });

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/app/employee']);
  });

  it('should navigate to employee for EMPLOYEE role (default)', async () => {
    mockWindowLocation('?id=123&email=user@test.com');
    jest.spyOn(console, 'log').mockImplementation();

    authService.extractRoles.mockReturnValue(['EMPLOYEE']);
    authService.normalizeUser.mockReturnValue({ roles: ['EMPLOYEE'] });

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authService.extractRoles).toHaveBeenCalledWith('EMPLOYEE');
    expect(router.navigate).toHaveBeenCalledWith(['/app/employee']);
  });

  it('should navigate to employee when roles array is empty', async () => {
    mockWindowLocation('?id=123&email=user@test.com');
    jest.spyOn(console, 'log').mockImplementation();

    authService.extractRoles.mockReturnValue([]);
    authService.normalizeUser.mockReturnValue({ roles: [] });

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/app/employee']);
  });

  it('should navigate to employee when roles is undefined', async () => {
    mockWindowLocation('?id=123&email=user@test.com');
    jest.spyOn(console, 'log').mockImplementation();

    authService.extractRoles.mockReturnValue([]);
    authService.normalizeUser.mockReturnValue({});

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/app/employee']);
  });

  it('should handle callback error and redirect to login', async () => {
    mockWindowLocation('?id=123&email=test@test.com');
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();

    const error = new Error('Auth error');
    authService.extractRoles.mockImplementation(() => {
      throw error;
    });

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should pass undefined for optional params when not provided', async () => {
    mockWindowLocation('?id=123&email=test@test.com');
    jest.spyOn(console, 'log').mockImplementation();

    authService.extractRoles.mockReturnValue(['EMPLOYEE']);
    authService.normalizeUser.mockReturnValue({ roles: ['EMPLOYEE'] });

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authService.normalizeUser).toHaveBeenCalledWith({
      id: '123',
      email: 'test@test.com',
      firstName: undefined,
      lastName: undefined,
      roles: ['EMPLOYEE'],
    });
  });
});
