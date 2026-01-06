import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbsenceRequestModal, AbsenceRequestData } from '@modal/absence-request-modal/absence-request-modal';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AbsenceType, AbsencePeriod } from '@core/services/absence';

describe('AbsenceRequestModal – Jest (100% coverage)', () => {
  let component: AbsenceRequestModal;
  let fixture: ComponentFixture<AbsenceRequestModal>;

  let dialogRef: {
    close: jest.Mock;
  };

  beforeEach(async () => {
    dialogRef = {
      close: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AbsenceRequestModal],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: undefined },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AbsenceRequestModal);
    component = fixture.componentInstance;
  });

  it('ngOnInit sets dates from data', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-05');

    component.data = { startDate: start, endDate: end };
    component.ngOnInit();

    expect(component.startDate).toEqual(start);
    expect(component.endDate).toEqual(end);
  });

  it('ngOnInit sets endDate from startDate if endDate missing', () => {
    const start = new Date('2024-02-01');

    component.data = { startDate: start };
    component.ngOnInit();

    expect(component.startDate).toEqual(start);
    expect(component.endDate).toEqual(start);
  });

  it('ngOnInit with no data does nothing', () => {
    component.ngOnInit();
    expect(component.startDate).toBeNull();
    expect(component.endDate).toBeNull();
  });

  it('onStartDateChange aligns endDate if endDate < startDate', () => {
    component.startDate = new Date('2024-03-10');
    component.endDate = new Date('2024-03-05');

    component.onStartDateChange();

    expect(component.endDate).toEqual(component.startDate);
  });

  it('onStartDateChange sets endDate when missing', () => {
    component.startDate = new Date('2024-04-01');
    component.endDate = null;

    component.onStartDateChange();

    expect(component.endDate).toEqual(component.startDate);
  });

  it('onStartDateChange does nothing if startDate is null', () => {
    component.startDate = null;
    component.endDate = null;

    component.onStartDateChange();

    expect(component.endDate).toBeNull();
  });

  it('onEndDateChange aligns startDate if endDate < startDate', () => {
    component.startDate = new Date('2024-05-10');
    component.endDate = new Date('2024-05-05');

    component.onEndDateChange();

    expect(component.startDate).toEqual(component.endDate);
  });

  it('onEndDateChange does nothing if startDate missing', () => {
    component.startDate = null;
    component.endDate = new Date('2024-05-05');

    component.onEndDateChange();

    expect(component.startDate).toBeNull();
  });

  it('isSingleDay returns true if dates missing', () => {
    component.startDate = null;
    component.endDate = null;

    expect(component.isSingleDay).toBe(true);
  });

  it('isSingleDay returns true if same day', () => {
    component.startDate = new Date('2024-06-01');
    component.endDate = new Date('2024-06-01');

    expect(component.isSingleDay).toBe(true);
  });

  it('isSingleDay returns false if different days', () => {
    component.startDate = new Date('2024-06-01');
    component.endDate = new Date('2024-06-02');

    expect(component.isSingleDay).toBe(false);
  });

  it('onCancel closes dialog without data', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('onSubmit returns early if startDate missing', () => {
    component.startDate = null;
    component.endDate = new Date();
    component.onSubmit();

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('onSubmit returns early if endDate missing', () => {
    component.startDate = new Date();
    component.endDate = null;
    component.onSubmit();

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('onSubmit closes dialog with result (full day)', () => {
    component.startDate = new Date('2024-07-01');
    component.endDate = new Date('2024-07-03');
    component.absenceType = 'VACATION';
    component.reason = '  holiday  ';
    component.period = 'FULL_DAY';

    component.onSubmit();

    expect(dialogRef.close).toHaveBeenCalledWith({
      startDate: '2024-07-01',
      endDate: '2024-07-03',
      type: 'VACATION',
      reason: 'holiday',
    });
  });

  it('onSubmit adds periodByDate for single day + half day', () => {
    component.startDate = new Date('2024-08-01');
    component.endDate = new Date('2024-08-01');
    component.absenceType = 'SICK';
    component.reason = '';
    component.period = 'AM';

    component.onSubmit();

    expect(dialogRef.close).toHaveBeenCalledWith({
      startDate: '2024-08-01',
      endDate: '2024-08-01',
      type: 'SICK',
      reason: undefined,
      periodByDate: [
        {
          date: '2024-08-01',
          period: 'AM',
        },
      ],
    });
  });

  it('formatDate formats date correctly (indirect)', () => {
    component.startDate = new Date(2024, 0, 5);
    component.endDate = new Date(2024, 0, 5);
    component.absenceType = 'RTT';

    component.onSubmit();

    expect(dialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2024-01-05',
        endDate: '2024-01-05',
      })
    );
  });
});
