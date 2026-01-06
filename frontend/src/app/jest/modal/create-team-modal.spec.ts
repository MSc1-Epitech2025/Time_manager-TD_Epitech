import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CreateTeamModal } from '@modal/create-team-modal/create-team-modal';

describe('CreateTeamModal', () => {
  let component: CreateTeamModal;
  let fixture: ComponentFixture<CreateTeamModal>;
  let dialogRefMock: jest.Mocked<MatDialogRef<CreateTeamModal>>;

  beforeEach(async () => {
    dialogRefMock = {
      close: jest.fn(),
    } as unknown as jest.Mocked<MatDialogRef<CreateTeamModal>>;

    await TestBed.configureTestingModule({
      imports: [CreateTeamModal, NoopAnimationsModule],
      providers: [{ provide: MatDialogRef, useValue: dialogRefMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTeamModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty teamName and description by default', () => {
    expect(component.teamName).toBe('');
    expect(component.description).toBe('');
  });

  describe('onCancel', () => {
    it('should close dialog without data', () => {
      component.onCancel();

      expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
      expect(dialogRefMock.close).toHaveBeenCalledWith();
    });
  });

  describe('onCreate', () => {
    it('should close dialog with team data when teamName is valid', () => {
      component.teamName = 'Test Team';
      component.description = 'Test Description';

      component.onCreate();

      expect(dialogRefMock.close).toHaveBeenCalledTimes(1);
      expect(dialogRefMock.close).toHaveBeenCalledWith({
        name: 'Test Team',
        description: 'Test Description',
      });
    });

    it('should not close dialog when teamName is empty', () => {
      component.teamName = '';
      component.description = 'Test Description';

      component.onCreate();

      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when teamName contains only whitespace', () => {
      component.teamName = '   ';
      component.description = 'Test Description';

      component.onCreate();

      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should close dialog with trimmed teamName check but original value', () => {
      component.teamName = '  Valid Team  ';
      component.description = '';

      component.onCreate();

      expect(dialogRefMock.close).toHaveBeenCalledWith({
        name: '  Valid Team  ',
        description: '',
      });
    });
  });
});
