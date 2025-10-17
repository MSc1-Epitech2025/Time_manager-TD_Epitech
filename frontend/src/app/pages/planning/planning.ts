import { Component, OnDestroy, OnInit } from '@angular/core';
import { CalendarOptions, EventInput, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule } from '@angular/forms';

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
  imports: [
    CommonModule, FullCalendarModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatChipsModule, ReactiveFormsModule
  ],
  templateUrl: './planning.html',
  styleUrls: ['./planning.scss'],
})
export class PlanningComponent implements OnInit, OnDestroy {
  private sub?: Subscription;

  isManager = false;
  userName = '';
  team: Array<{ id: string; name: string }> = [];
  selectedPeople: string[] = [];
  private absences: Absence[] = [];

  events: EventInput[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth'
    },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    expandRows: true,
    height: 'auto',
    nowIndicator: true,
    locale: 'fr',
    firstDay: 1,
    selectable: true,
    selectMirror: true,
    select: (info) => this.onSelect(info),
    eventOverlap: true,
    editable: false,
    events: this.events,
  };

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe((qp) => {
      const manager = qp.get('manager');
      const employee = qp.get('employee');
      this.isManager = !!manager;
      this.userName = manager || employee || '';

      this.loadTeam();
      this.seedAbsences();
      this.selectedPeople = this.team.map(t => t.name);
      this.refreshEvents();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadTeam() {
    this.team = [
      { id: 'u1', name: 'alice' },
      { id: 'u2', name: 'paul' },
      { id: 'u3', name: this.userName || 'moi' },
    ];
  }

  private seedAbsences() {
    const base = new Date();
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, '0');
    const d = String(base.getDate()).padStart(2, '0');

    this.absences = [
      { id: 'a1', person: 'alice', start: `${y}-${m}-${d}T10:00:00`, end: `${y}-${m}-${d}T12:00:00`, reason: 'CP' },
      { id: 'a2', person: 'paul', start: `${y}-${m}-${d}T14:00:00`, end: `${y}-${m}-${d}T17:00:00`, reason: 'Maladie' },
    ];
  }

  private buildEvents(): EventInput[] {
    const visible = new Set(this.selectedPeople);
    return this.absences
      .filter(a => visible.has(a.person))
      .map((a): EventInput => ({
        id: a.id,
        title: this.isManager
          ? `${capitalize(a.person)} — ${a.reason ?? 'Absent'}`
          : `${capitalize(a.person)} — absent`,
        start: a.start,
        end: a.end,
        display: 'auto',
        classNames: ['absence-event'],
      }));
  }

  refreshEvents() {
    this.events = this.buildEvents();
    this.calendarOptions = { ...this.calendarOptions, events: [...this.events] };
  }

  private onSelect(sel: DateSelectArg) {
    const start = formatLocal(sel.start);
    const end = formatLocal(sel.end);

    if (this.isManager) {
      const who = (prompt(
        `Créer absence du ${start.replace('T', ' à ')} au ${end.replace('T', ' à ')}\n` +
        `Saisis des noms séparés par des virgules (ex: alice,paul)`,
        this.userName,
      ) || '').trim();

      const people = who.split(',').map(s => s.trim()).filter(Boolean);
      const reason = prompt('Raison (CP, RTT, …)') || '';

      if (people.length) {
        this.createAbsence({ start, end, people, reason });
      }
    } else {
      this.createAbsence({ start, end, people: [this.userName] });
    }
  }

  private createAbsence(payload: {
    start: string; end?: string; people: string[]; reason?: string;
  }) {
    for (const p of payload.people) {
      this.absences.push({
        id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        person: p,
        start: payload.start,
        end: payload.end,
        reason: payload.reason,
      });
    }
    this.refreshEvents();
  }
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function formatLocal(d: Date) {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}-${m}-${day}T${h}:${mi}:${s}`;
}
function capitalize(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
