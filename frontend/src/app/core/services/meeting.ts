import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';

const GRAPHQL_ENDPOINT = 'http://localhost:8030/graphql';

type GraphqlError = { message: string };

type GraphqlResponse<T> = {
  data?: T;
  errors?: GraphqlError[];
};

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  attendees?: string[];
  createdBy?: string;
  createdAt?: string;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  attendees?: string[];
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  attendees?: string[];
}

type CreateMeetingPayload = { createMeeting: Meeting };
type UpdateMeetingPayload = { updateMeeting: Meeting };
type DeleteMeetingPayload = { deleteMeeting: boolean };

@Injectable({ providedIn: 'root' })
export class MeetingService {
  constructor(private http: HttpClient) {}

  /**
   * Create a new meeting (manager/admin only)
   */
  createMeeting(request: CreateMeetingRequest): Observable<Meeting> {
    return this.request<CreateMeetingPayload>(CREATE_MEETING_MUTATION, {
      input: request,
    }).pipe(
      map((payload) => payload?.createMeeting)
    );
  }

  /**
   * Update a meeting (creator/admin only)
   */
  updateMeeting(meetingId: string, request: UpdateMeetingRequest): Observable<Meeting> {
    return this.request<UpdateMeetingPayload>(UPDATE_MEETING_MUTATION, {
      id: meetingId,
      input: request,
    }).pipe(
      map((payload) => payload?.updateMeeting)
    );
  }

  /**
   * Delete a meeting (creator/admin only)
   */
  deleteMeeting(meetingId: string): Observable<boolean> {
    return this.request<DeleteMeetingPayload>(DELETE_MEETING_MUTATION, {
      id: meetingId,
    }).pipe(
      map((payload) => payload?.deleteMeeting ?? false)
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
          console.error('Meeting request failed:', err);
          throw err;
        })
      );
  }
}

const CREATE_MEETING_MUTATION = `
  mutation CreateMeeting($input: CreateMeetingInput!) {
    createMeeting(input: $input) {
      id
      title
      description
      startDate
      endDate
      attendees
      createdBy
      createdAt
    }
  }
`;

const UPDATE_MEETING_MUTATION = `
  mutation UpdateMeeting($id: ID!, $input: UpdateMeetingInput!) {
    updateMeeting(id: $id, input: $input) {
      id
      title
      description
      startDate
      endDate
      attendees
      createdBy
      createdAt
    }
  }
`;

const DELETE_MEETING_MUTATION = `
  mutation DeleteMeeting($id: ID!) {
    deleteMeeting(id: $id)
  }
`;
