import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  Observable,
} from 'rxjs';
import { environment } from '../../../environments/environment';


export interface PresenceDuJour {
  date: Date;
  presence: boolean;
  absences: number;
  pointage: string | null;
  tempsTravail: string;
}

export interface Utilisateur {
  id: string;
  nom: string;
  equipe: string;
  historique: PresenceDuJour[];
}

@Injectable({ providedIn: 'root' })
export class KpiService {
  constructor(private http: HttpClient) {}

  private readonly GRAPHQL_ENDPOINT = environment.GRAPHQL_ENDPOINT;
  // ───────────────────────────────────────────────
  //   GENERIC GRAPHQL WRAPPER
  // ───────────────────────────────────────────────
  private query<T>(query: string, variables: any = {}): Observable<T | null> {
    return this.http
      .post<{ data: T }>(
        this.GRAPHQL_ENDPOINT,
        { query, variables },
        { withCredentials: true }
      )
      .pipe(
        map(res => res.data),
        catchError(err => {
          console.error('GraphQL Error:', err);
          return of(null);
        })
      );
  }

  // ───────────────────────────────────────────────
  //   USERS
  // ───────────────────────────────────────────────
  users() {
    return this.query<{ users: any[] }>(`
      query {
        users {
          id
          firstName
          lastName
          email
        }
      }
    `);
  }

  // ───────────────────────────────────────────────
  //   TEAMS (RETURNS MEMBERS DIRECTLY)
  // ───────────────────────────────────────────────
  teams() {
    return this.query<{ teams: any[] }>(`
      query {
        teams {
          id
          name
          members {
            id
            firstName
            lastName
            email
          }
        }
      }
    `);
  }

  // ───────────────────────────────────────────────
  //   CLOCKS (CORRECT SIGNATURE)
  // ───────────────────────────────────────────────
  clocksForUser(userId: string, from: string, to: string) {
    return this.query<{ clocksForUser: any[] }>(
      `
      query($userId: ID!, $from: String, $to: String) {
        clocksForUser(userId: $userId, from: $from, to: $to) {
          id
          kind
          at
          userId
        }
      }
    `,
      { userId, from, to }
    );
  }

  // ───────────────────────────────────────────────
  //   HELPERS DATE & TEMPS
  // ───────────────────────────────────────────────
  private toIso(date: Date): string {
    return (
      date.getFullYear() +
      '-' +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      '-' +
      date.getDate().toString().padStart(2, '0')
    );
  }

  private toInstantStart(date: Date): string {
    return this.toIso(date) + 'T00:00:00Z';
  }

  private toInstantEnd(date: Date): string {
    return this.toIso(date) + 'T23:59:59Z';
  }

  private diffMinutes(inAt: string, outAt: string): number {
    const ain = new Date(inAt).getTime();
    const aout = new Date(outAt).getTime();
    if (isNaN(ain) || isNaN(aout) || aout <= ain) return 0;
    return Math.floor((aout - ain) / 60000);
  }

  private minToHuman(m: number): string {
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  }

  // ───────────────────────────────────────────────
  //   LOAD FULL DATA (1 MONTH)
  // ───────────────────────────────────────────────
  loadFullData(): Observable<Utilisateur[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const from = this.toInstantStart(start);
    const to = this.toInstantEnd(end);

    return forkJoin({
      usersRes: this.users(),
      teamsRes: this.teams()
    }).pipe(
      switchMap(({ usersRes, teamsRes }) => {
        const users = usersRes?.users ?? [];
        const teams = teamsRes?.teams ?? [];

        if (!users.length) return of([]);

        // ───────────────────────────────────────────────
        //   BUILD USER → TEAM MAP
        // ───────────────────────────────────────────────
        const userTeamMap: Record<string, string> = {};

        teams.forEach(team => {
          team.members.forEach((member: any) => {
            userTeamMap[member.id] = team.name;
          });
        });

        // ───────────────────────────────────────────────
        //   CLOCK REQUESTS FOR EACH USER
        // ───────────────────────────────────────────────
        const userRequests = users.map(u =>
          this.clocksForUser(u.id, from, to).pipe(
            map(res => {
              const clocks = res?.clocksForUser ?? [];

              const byDate: Record<string, any[]> = {};
              clocks.forEach(c => {
                const dateKey = c.at.split('T')[0];
                if (!byDate[dateKey]) byDate[dateKey] = [];
                byDate[dateKey].push(c);
              });

              const historique: PresenceDuJour[] = [];

              Object.entries(byDate).forEach(([dateKey, entries]) => {
                const ins = entries
                  .filter(e => e.kind === 'IN')
                  .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

                const outs = entries
                  .filter(e => e.kind === 'OUT')
                  .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

                const pairs = Math.min(ins.length, outs.length);
                let total = 0;

                for (let i = 0; i < pairs; i++) {
                  total += this.diffMinutes(ins[i].at, outs[i].at);
                }

                const firstIn = ins[0];

                historique.push({
                  date: new Date(dateKey),
                  presence: total > 0,
                  absences: total > 0 ? 0 : 1,
                  pointage: firstIn
                    ? new Date(firstIn.at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : null,
                  tempsTravail: this.minToHuman(total)
                });
              });

              historique.sort((a, b) => a.date.getTime() - b.date.getTime());

              return <Utilisateur>{
                id: u.id,
                nom: `${u.firstName} ${u.lastName}`,
                equipe: userTeamMap[u.id] ?? 'Not affected',
                historique
              };
            })
          )
        );

        return forkJoin(userRequests);
      })
    );
  }
}