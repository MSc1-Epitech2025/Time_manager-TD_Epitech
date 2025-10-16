import { Component, OnDestroy, OnInit } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

type Absence = {
  id: string;
  person: string;
  start: string;
  end?: string;
  reason?: string;
};

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, MatIconModule],
  templateUrl: './planning.html',
  styleUrls: ['./planning.scss'],
})
export class PlanningComponent implements OnInit, OnDestroy {
  private sub?: Subscription;

  isManager = false;
  userName = '';
  team: Array<{ id: string; name: string }> = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    editable: false,
    selectable: true,
    events: [],
    select: (info) => this.onSelect(info.startStr, info.endStr),
  };

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe((qp) => {
      const manager = qp.get('manager');
      const employee = qp.get('employee');
      this.isManager = !!manager;
      this.userName = manager || employee || '';

      this.loadTeam();
      this.loadAbsences();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadTeam() {
    this.team = [
      { id: 'u1', name: 'alice' },
      { id: 'u2', name: 'paul' },
      { id: 'u3', name: this.userName },
    ];
  }

  private async loadAbsences() {
    const absences: Absence[] = [
      { id: 'a1', person: 'alice', start: '2025-10-10', reason: 'CP' },
      { id: 'a2', person: 'paul', start: '2025-10-12', reason: 'Maladie' },
    ];

    const events = absences.map((a) => ({
      id: a.id,
      start: a.start,
      end: a.end,
      title: this.isManager
        ? `${a.person} — ${a.reason ?? ''}`.trim()
        : `${a.person} — absent`,
    }));

    this.calendarOptions = { ...this.calendarOptions, events };
  }

  private onSelect(start: string, end: string | undefined) {
    if (this.isManager) {
      const who =
        prompt(
          `Créer absence du ${start} au ${end ?? start}\nSaisis des noms séparés par des virgules (ex: alice,paul)`,
          this.userName,
        ) ?? '';
      const people = who
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const reason = prompt('Raison (CP, RTT, …)') ?? '';
      this.createAbsence({ start, end, people, reason });
    } else {
      this.createAbsence({ start, end, people: [this.userName] });
    }
  }

  private createAbsence(payload: {
    start: string;
    end?: string;
    people: string[];
    reason?: string;
  }) {
    console.log('createAbsence', payload);
    alert(
      `Absence créée pour ${payload.people.join(', ')} du ${payload.start}${payload.end ? ' au ' + payload.end : ''
      }${this.isManager && payload.reason ? ' (' + payload.reason + ')' : ''}`,
    );
    this.loadAbsences();
  }
}
