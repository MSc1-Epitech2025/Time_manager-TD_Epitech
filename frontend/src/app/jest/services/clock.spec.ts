import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClockService } from '@core/services/clock';
import { environment } from '@environments/environment';
import { ClockRecord } from '@shared/models/graphql.types';

describe('ClockService', () => {
  let service: ClockService;
  let httpMock: HttpTestingController;

  const mockClockRecords: ClockRecord[] = [
    { id: '1', kind: 'IN', at: '2024-01-15T09:00:00Z' },
    { id: '2', kind: 'OUT', at: '2024-01-15T17:00:00Z' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClockService],
    });

    service = TestBed.inject(ClockService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getClocks', () => {
    it('should fetch clocks without date parameters', (done) => {
      service.getClocks().subscribe({
        next: (clocks) => {
          expect(clocks).toEqual(mockClockRecords);
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body.variables).toEqual({ from: undefined, to: undefined });

      req.flush({ data: { myClocks: mockClockRecords } });
    });

    it('should fetch clocks with from and to parameters', (done) => {
      const from = '2024-01-01';
      const to = '2024-01-31';

      service.getClocks(from, to).subscribe({
        next: (clocks) => {
          expect(clocks).toEqual(mockClockRecords);
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      expect(req.request.body.variables).toEqual({ from, to });

      req.flush({ data: { myClocks: mockClockRecords } });
    });

    it('should return empty array when myClocks is null', (done) => {
      service.getClocks().subscribe({
        next: (clocks) => {
          expect(clocks).toEqual([]);
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush({ data: { myClocks: null } });
    });

    it('should return empty array when data is null', (done) => {
      service.getClocks().subscribe({
        next: (clocks) => {
          expect(clocks).toEqual([]);
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush({ data: null });
    });

    it('should throw error when response contains errors', (done) => {
      const errorMessages = [
        { message: 'Authentication failed' },
        { message: 'Invalid token' },
      ];

      service.getClocks().subscribe({
        error: (err) => {
          expect(err.message).toBe('Authentication failed, Invalid token');
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush({ errors: errorMessages, data: null });
    });

    it('should throw error when response has single error', (done) => {
      service.getClocks().subscribe({
        error: (err) => {
          expect(err.message).toBe('Unauthorized');
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush({ errors: [{ message: 'Unauthorized' }], data: null });
    });
  });

  describe('createClock', () => {
    const mockCreatedClock: ClockRecord = {
      id: '3',
      kind: 'IN',
      at: '2024-01-16T09:00:00Z',
    };

    it('should create IN clock successfully', (done) => {
      service.createClock('IN').subscribe({
        next: (clock) => {
          expect(clock).toEqual(mockCreatedClock);
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body.variables).toEqual({ input: { kind: 'IN' } });

      req.flush({ data: { createClockForMe: mockCreatedClock } });
    });

    it('should create OUT clock successfully', (done) => {
      const outClock: ClockRecord = { id: '4', kind: 'OUT', at: '2024-01-16T17:00:00Z' };

      service.createClock('OUT').subscribe({
        next: (clock) => {
          expect(clock).toEqual(outClock);
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      expect(req.request.body.variables).toEqual({ input: { kind: 'OUT' } });

      req.flush({ data: { createClockForMe: outClock } });
    });

    it('should throw error when response contains errors', (done) => {
      service.createClock('IN').subscribe({
        error: (err) => {
          expect(err.message).toBe('Clock creation failed, Database error');
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush({
        errors: [{ message: 'Clock creation failed' }, { message: 'Database error' }],
        data: null,
      });
    });

    it('should throw error when createClockForMe is null', (done) => {
      service.createClock('IN').subscribe({
        error: (err) => {
          expect(err.message).toBe('No data returned from clock mutation');
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush({ data: { createClockForMe: null } });
    });

    it('should throw error when data is null', (done) => {
      service.createClock('OUT').subscribe({
        error: (err) => {
          expect(err.message).toBe('No data returned from clock mutation');
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush({ data: null });
    });

    it('should throw error when data is undefined', (done) => {
      service.createClock('IN').subscribe({
        error: (err) => {
          expect(err.message).toBe('No data returned from clock mutation');
          done();
        },
      });

      const req = httpMock.expectOne(environment.GRAPHQL_ENDPOINT);
      req.flush({});
    });
  });
});
