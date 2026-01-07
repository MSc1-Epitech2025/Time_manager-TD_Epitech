import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  AbsenceApprovalModal,
  AbsenceApprovalData,
  AbsenceApprovalResult
} from '@modal/absence-approval-modal/absence-approval-modal';
import { Absence } from '@core/services/absence';

describe('AbsenceApprovalModal', () => {
  let component: AbsenceApprovalModal;
  let fixture: ComponentFixture<AbsenceApprovalModal>;
  let dialogRefSpy: jest.Mocked<MatDialogRef<AbsenceApprovalModal>>;

  const mockAbsence: Absence = {
    id: 'absence-123',
    userId: 'user-456',
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    status: 'PENDING',
    type: 'VACATION',
  } as Absence;

  const mockDialogData: AbsenceApprovalData = {
    absence: mockAbsence,
  };

  beforeEach(async () => {
    dialogRefSpy = {
      close: jest.fn(),
    } as unknown as jest.Mocked<MatDialogRef<AbsenceApprovalModal>>;

    await TestBed.configureTestingModule({
      imports: [AbsenceApprovalModal],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AbsenceApprovalModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('absence getter', () => {
    it('should return the absence from data', () => {
      expect(component.absence).toEqual(mockAbsence);
    });
  });

  describe('userName getter', () => {
    it('should return full name when firstName and lastName are present', () => {
      expect(component.userName).toBe('John Doe');
    });

    it('should return firstName only when lastName is missing', () => {
      component.data.absence = { ...mockAbsence, user: { firstName: 'John', lastName: '', email: 'john@example.com' } } as Absence;
      expect(component.userName).toBe('John');
    });

    it('should return lastName only when firstName is missing', () => {
      component.data.absence = { ...mockAbsence, user: { firstName: '', lastName: 'Doe', email: 'doe@example.com' } } as Absence;
      expect(component.userName).toBe('Doe');
    });

    it('should return email prefix when firstName and lastName are empty', () => {
      component.data.absence = {
        ...mockAbsence,
        user: { firstName: '', lastName: '', email: 'user@example.com' }
      } as Absence;

      expect(component.userName).toBe('user');
    });

    it('should return "Unknown" when user has no name and no email', () => {
      component.data.absence = {
        ...mockAbsence,
        user: { firstName: '', lastName: '', email: '' }
      } as Absence;

      expect(component.userName).toBe('Unknown');
    });

    it('should return userId when user is undefined', () => {
      component.data.absence = { ...mockAbsence, user: undefined } as Absence;
      expect(component.userName).toBe('user-456');
    });
  });

  describe('dateRange getter', () => {
    it('should return date range when start and end dates are different', () => {
      const result = component.dateRange;
      expect(result).toBe('15/01/2024 - 20/01/2024');
    });

    it('should return single date when start and end dates are the same', () => {
      component.data.absence = { ...mockAbsence, startDate: '2024-01-15', endDate: '2024-01-15' } as Absence;
      expect(component.dateRange).toBe('15/01/2024');
    });
  });

  describe('statusColor getter', () => {
    it('should return orange for PENDING status', () => {
      component.data.absence = { ...mockAbsence, status: 'PENDING' } as Absence;
      expect(component.statusColor).toBe('#f59e0b');
    });

    it('should return green for APPROVED status', () => {
      component.data.absence = { ...mockAbsence, status: 'APPROVED' } as Absence;
      expect(component.statusColor).toBe('#10b981');
    });

    it('should return red for REJECTED status', () => {
      component.data.absence = { ...mockAbsence, status: 'REJECTED' } as Absence;
      expect(component.statusColor).toBe('#ef4444');
    });

    it('should return gray for unknown status', () => {
      component.data.absence = { ...mockAbsence, status: 'UNKNOWN' as any } as Absence;
      expect(component.statusColor).toBe('#6b7280');
    });
  });

  describe('typeLabel getter', () => {
    it('should return "Sick Leave" for SICK type', () => {
      component.data.absence = { ...mockAbsence, type: 'SICK' } as Absence;
      expect(component.typeLabel).toBe('Sick Leave');
    });

    it('should return "Vacation" for VACATION type', () => {
      component.data.absence = { ...mockAbsence, type: 'VACATION' } as Absence;
      expect(component.typeLabel).toBe('Vacation');
    });

    it('should return "Personal Leave" for PERSONAL type', () => {
      component.data.absence = { ...mockAbsence, type: 'PERSONAL' } as Absence;
      expect(component.typeLabel).toBe('Personal Leave');
    });

    it('should return "Training" for FORMATION type', () => {
      component.data.absence = { ...mockAbsence, type: 'FORMATION' } as Absence;
      expect(component.typeLabel).toBe('Training');
    });

    it('should return "RTT" for RTT type', () => {
      component.data.absence = { ...mockAbsence, type: 'RTT' } as Absence;
      expect(component.typeLabel).toBe('RTT');
    });

    it('should return "Other" for OTHER type', () => {
      component.data.absence = { ...mockAbsence, type: 'OTHER' } as Absence;
      expect(component.typeLabel).toBe('Other');
    });

    it('should return raw type for unknown type', () => {
      component.data.absence = { ...mockAbsence, type: 'CUSTOM_TYPE' as any } as Absence;
      expect(component.typeLabel).toBe('CUSTOM_TYPE');
    });
  });

  describe('onCancel', () => {
    it('should close dialog without result', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('onApprove', () => {
    it('should close dialog with approve result', () => {
      component.onApprove();
      const expectedResult: AbsenceApprovalResult = {
        action: 'approve',
        absenceId: 'absence-123',
      };
      expect(dialogRefSpy.close).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('onReject', () => {
    it('should close dialog with reject result', () => {
      component.onReject();
      const expectedResult: AbsenceApprovalResult = {
        action: 'reject',
        absenceId: 'absence-123',
      };
      expect(dialogRefSpy.close).toHaveBeenCalledWith(expectedResult);
    });
  });
});
