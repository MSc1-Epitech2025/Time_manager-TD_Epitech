import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DeleteTeamModalComponent } from '@modal/delete-team-modal/delete-team-modal';

describe('DeleteTeamModalComponent', () => {
  let component: DeleteTeamModalComponent;
  let fixture: ComponentFixture<DeleteTeamModalComponent>;
  let dialogRefSpy: jest.Mocked<MatDialogRef<DeleteTeamModalComponent>>;

  const mockTeamWithMembers = {
    id: '1',
    name: 'Team Alpha',
    members: [
      { id: 'u1', name: 'John Doe' },
      { id: 'u2', name: 'Jane Smith' },
    ],
  };

  const mockTeamWithoutMembers = {
    id: '2',
    name: 'Team Beta',
  };

  beforeEach(async () => {
    dialogRefSpy = {
      close: jest.fn(),
    } as unknown as jest.Mocked<MatDialogRef<DeleteTeamModalComponent>>;

    await TestBed.configureTestingModule({
      imports: [DeleteTeamModalComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { team: mockTeamWithMembers } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteTeamModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should initialize team with members from data', () => {
      expect(component.team.id).toBe('1');
      expect(component.team.name).toBe('Team Alpha');
      expect(component.team.members).toEqual(mockTeamWithMembers.members);
      expect(component.team.isDestroyed).toBe(false);
    });

    it('should create a copy of members array', () => {
      expect(component.team.members).not.toBe(mockTeamWithMembers.members);
      expect(component.team.members).toEqual(mockTeamWithMembers.members);
    });

    it('should initialize isDestroyed to false', () => {
      expect(component.isDestroyed).toBe(false);
    });
  });

  describe('constructor with team without members', () => {
    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [DeleteTeamModalComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { team: mockTeamWithoutMembers } },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(DeleteTeamModalComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should initialize empty members array when team has no members', () => {
      expect(component.team.members).toEqual([]);
    });
  });

  describe('onCancel', () => {
    it('should close dialog without data', () => {
      component.onCancel();

      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('onSave', () => {
    it('should set isDestroyed to true on team', () => {
      component.onSave();

      expect(component.team.isDestroyed).toBe(true);
    });

    it('should close dialog with updated team', () => {
      component.onSave();

      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'Team Alpha',
          isDestroyed: true,
        })
      );
    });
  });
});
