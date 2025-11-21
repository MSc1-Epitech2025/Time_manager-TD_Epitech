import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

type GraphqlError = { message: string };

type GraphqlResponse<T> = {
  data?: T;
  errors?: GraphqlError[];
};

export interface AbsenceDay {
  absenceDate: string;
  period: 'FULL_DAY' | 'AM' | 'PM';
}

export interface Absence {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  type: string;
  reason?: string;
  days?: AbsenceDay[];
  approvedBy?: string;
  approvedAt?: string;
}

export interface CreateAbsenceRequest {
  startDate: string;
  endDate: string;
  type: string;
  reason?: string;
  supportingDocumentUrl?: string;
  periodByDate?: Record<string, 'AM' | 'PM' | 'FULL_DAY'>;
}

export interface UpdateAbsenceRequest {
  startDate?: string;
  endDate?: string;
  type?: string;
  reason?: string;
  supportingDocumentUrl?: string;
  periodByDate?: Record<string, 'AM' | 'PM' | 'FULL_DAY'>;
}

export interface AbsenceApprovalRequest {
  status: 'APPROVED' | 'REJECTED';
}

type CreateAbsencePayload = { createAbsence: Absence };
type UpdateAbsencePayload = { updateAbsence: Absence };
type ApproveAbsencePayload = { approveAbsence: Absence };
type DeleteAbsencePayload = { deleteAbsence: boolean };

@Injectable({ providedIn: 'root' })
export class AbsenceService {
  constructor(private http: HttpClient) {}

  /**
   * Create an absence request for the current user
   */
  createAbsence(request: CreateAbsenceRequest): Observable<Absence> {
    return this.request<CreateAbsencePayload>(CREATE_ABSENCE_MUTATION, {
      input: request,
    }).pipe(
      map((payload) => payload?.createAbsence)
    );
  }

  /**
   * Update an absence request (only by owner if PENDING or by admin)
   */
  updateAbsence(absenceId: string, request: UpdateAbsenceRequest): Observable<Absence> {
    return this.request<UpdateAbsencePayload>(UPDATE_ABSENCE_MUTATION, {
      id: absenceId,
      input: request,
    }).pipe(
      map((payload) => payload?.updateAbsence)
    );
  }

  /**
   * Delete an absence (only by owner if PENDING or by admin)
   */
  deleteAbsence(absenceId: string): Observable<boolean> {
    return this.request<DeleteAbsencePayload>(DELETE_ABSENCE_MUTATION, {
      id: absenceId,
    }).pipe(
      map((payload) => payload?.deleteAbsence ?? false)
    );
  }

  /**
   * Approve or reject an absence (manager/admin only)
   */
  approveAbsence(
    absenceId: string,
    status: 'APPROVED' | 'REJECTED'
  ): Observable<Absence> {
    return this.request<ApproveAbsencePayload>(APPROVE_ABSENCE_MUTATION, {
      id: absenceId,
      input: { status },
    }).pipe(
      map((payload) => payload?.approveAbsence)
    );
  }

  private request<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Observable<T> {
    return this.http
      .post<GraphqlResponse<T>>(GRAPHQL_ENDPOINT, { query, variables }, { withCredentials: true })
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            const message = response.errors.map((e) => e.message).join(', ');
            throw new Error(message);
          }
          return response.data as T;
        }),
        catchError((err) => {
          console.error('Absence request failed:', err);
          throw err;
        })
      );
  }
}

const CREATE_ABSENCE_MUTATION = `
  mutation CreateAbsence($input: CreateAbsenceInput!) {
    createAbsence(input: $input) {
      id
      userId
      startDate
      endDate
      status
      type
      reason
      supportingDocumentUrl
      days {
        absenceDate
        period
      }
    }
  }
`;

const UPDATE_ABSENCE_MUTATION = `
  mutation UpdateAbsence($id: ID!, $input: UpdateAbsenceInput!) {
    updateAbsence(id: $id, input: $input) {
      id
      userId
      startDate
      endDate
      status
      type
      reason
      supportingDocumentUrl
      days {
        absenceDate
        period
      }
    }
  }
`;

const DELETE_ABSENCE_MUTATION = `
  mutation DeleteAbsence($id: ID!) {
    deleteAbsence(id: $id)
  }
`;

const APPROVE_ABSENCE_MUTATION = `
  mutation ApproveAbsence($id: ID!, $input: ApproveAbsenceInput!) {
    approveAbsence(id: $id, input: $input) {
      id
      userId
      startDate
      endDate
      status
      type
      reason
      approvedBy
      approvedAt
      days {
        absenceDate
        period
      }
    }
  }
`;
