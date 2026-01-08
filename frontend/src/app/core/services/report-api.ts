import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '@environments/environment';
import { GraphqlPayload, Report, ReportCreateInput } from '../../shared/models/graphql.types';

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private http = inject(HttpClient);
  private api = environment.GRAPHQL_ENDPOINT;

  createReport(input: ReportCreateInput): Observable<Report | null> {
    const query = `
      mutation CreateReport($input: ReportCreateInput!) {
        createReport(input: $input) {
          id
          authorId
          authorEmail
          targetUserId
          targetEmail
          title
          body
          createdAt
        }
      }
    `;
    return this.http.post<GraphqlPayload<{ createReport: Report }>>(this.api, {
      query,
      variables: { input }
    }).pipe(
      map((res: GraphqlPayload<{ createReport: Report }>) => res.data.createReport),
      catchError(() => of(null))
    );
  }

  getMyReports(): Observable<Report[]> {
    const query = `
      query MyReports {
        myReports {
          id
          authorId
          authorEmail
          targetUserId
          targetEmail
          title
          body
          createdAt
        }
      }
    `;
    return this.http.post<GraphqlPayload<{ myReports: Report[] }>>(this.api, {
      query
    }).pipe(
      map((res: GraphqlPayload<{ myReports: Report[] }>) => res.data.myReports),
      catchError(() => of([]))
    );
  }

  getReportsForMe(): Observable<Report[]> {
    const query = `
      query ReportsForMe {
        reportsForMe {
          id
          authorId
          authorEmail
          targetUserId
          targetEmail
          title
          body
          createdAt
        }
      }
    `;
    return this.http.post<GraphqlPayload<{ reportsForMe: Report[] }>>(this.api, {
      query
    }).pipe(
      map((res: GraphqlPayload<{ reportsForMe: Report[] }>) => res.data.reportsForMe),
      catchError(() => of([]))
    );
  }

  getAllReports(): Observable<Report[]> {
    const query = `
      query Reports {
        reports {
          id
          authorId
          authorEmail
          targetUserId
          targetEmail
          title
          body
          createdAt
        }
      }
    `;
    return this.http.post<GraphqlPayload<{ reports: Report[] }>>(this.api, {
      query
    }).pipe(
      map((res: GraphqlPayload<{ reports: Report[] }>) => res.data.reports),
      catchError(() => of([]))
    );
  }
}
