import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { LeaveAccountService } from '@core/services/leave-account';
import { environment } from '@environments/environment';

describe('LeaveAccountService (100% coverage)', () => {
  let service: LeaveAccountService;
  let httpMock: HttpTestingController;

  const endpoint = environment.GRAPHQL_ENDPOINT;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LeaveAccountService],
    });

    service = TestBed.inject(LeaveAccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should return mapped leave accounts (label priority)', () => {
    const mockResponse = {
      data: {
        leaveAccountsByUser: [
          {
            id: '1',
            currentBalance: 10,
            leaveType: {
              code: 'CP',
              label: 'Congés payés',
            },
          },
        ],
      },
    };

    service.getLeaveAccountsByUser('user-1').subscribe(result => {
      expect(result).toEqual([
        {
          leaveType: 'Congés payés',
          balance: 10,
        },
      ]);
    });

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);

    req.flush(mockResponse);
  });

  it('should fallback to leaveType.code if label is missing', () => {
    const mockResponse = {
      data: {
        leaveAccountsByUser: [
          {
            id: '2',
            currentBalance: 5,
            leaveType: {
              code: 'RTT',
              label: null,
            },
          },
        ],
      },
    };

    service.getLeaveAccountsByUser('user-2').subscribe(result => {
      expect(result[0].leaveType).toBe('RTT');
      expect(result[0].balance).toBe(5);
    });

    httpMock.expectOne(endpoint).flush(mockResponse);
  });

  it('should fallback to "Unknown" when leaveType is null', () => {
    const mockResponse = {
      data: {
        leaveAccountsByUser: [
          {
            id: '3',
            currentBalance: 3,
            leaveType: null,
          },
        ],
      },
    };

    service.getLeaveAccountsByUser('user-3').subscribe(result => {
      expect(result[0].leaveType).toBe('Unknown');
      expect(result[0].balance).toBe(3);
    });

    httpMock.expectOne(endpoint).flush(mockResponse);
  });

  it('should fallback balance to 0 when currentBalance is null', () => {
    const mockResponse = {
      data: {
        leaveAccountsByUser: [
          {
            id: '4',
            currentBalance: null,
            leaveType: {
              code: 'CP',
              label: 'Congés',
            },
          },
        ],
      },
    };

    service.getLeaveAccountsByUser('user-4').subscribe(result => {
      expect(result[0].balance).toBe(0);
    });

    httpMock.expectOne(endpoint).flush(mockResponse);
  });

  it('should return empty array when leaveAccountsByUser is missing', () => {
    const mockResponse = {
      data: {},
    };

    service.getLeaveAccountsByUser('user-5').subscribe(result => {
      expect(result).toEqual([]);
    });

    httpMock.expectOne(endpoint).flush(mockResponse);
  });

  it('should return empty array when data is null', () => {
    const mockResponse = {
      data: null,
    };

    service.getLeaveAccountsByUser('user-6').subscribe(result => {
      expect(result).toEqual([]);
    });

    httpMock.expectOne(endpoint).flush(mockResponse);
  });

  it('should throw error when GraphQL errors are present', done => {
    const mockResponse = {
      errors: [
        { message: 'Not authorized' },
        { message: 'Another error' },
      ],
    };

    service.getLeaveAccountsByUser('user-7').subscribe({
      next: () => fail('Expected error'),
      error: err => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Not authorized, Another error');
        done();
      },
    });

    httpMock.expectOne(endpoint).flush(mockResponse);
  });
});
