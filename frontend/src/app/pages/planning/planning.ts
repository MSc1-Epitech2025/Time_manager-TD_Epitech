import { Component, OnDestroy, OnInit } from '@angular/core';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule } from '@angular/forms';
import { PlanningService, PlanningEvent, PlanningPayload } from '../../core/services/planning';
import { AuthService } from '../../core/services/auth';

interface PersonOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './planning.html',
  styleUrls: ['./planning.scss'],
})
export class PlanningComponent implements OnInit, OnDestroy {
  private sub?: Subscription;
  private absences: PlanningEvent[] = [];

  isManager = false;
  userName = '';
  team: PersonOption[] = [];
  selectedPeople: string[] = [];
  loading = false;

  events: EventInput[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth',
    },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    expandRows: true,
    height: 'auto',
    nowIndicator: true,
    locale: 'fr',
    firstDay: 1,
    selectable: false,
    eventOverlap: true,
    editable: false,
    events: [],
  };

  constructor(
    private route: ActivatedRoute,
    private planningService: PlanningService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe((qp) => {
      const manager = qp.get('manager');
      const employee = qp.get('employee');
      this.isManager = !!manager;
      this.userName = manager || employee || this.auth.session?.user.fullName || '';
      this.loadPlanning();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async loadPlanning() {
    this.loading = true;
    try {
      if (this.isManager) {
        const payload = await firstValueFrom(this.planningService.getManagerPlanning());
        this.applyPayload(payload);
      } else {
        const payload = await firstValueFrom(this.planningService.getEmployeePlanning());
        this.applyPayload(payload);
      }
    } catch (err) {
      console.error('Failed to load planning', err);
      this.team = [];
      this.absences = [];
      this.selectedPeople = [];
      this.refreshEvents();
    } finally {
      this.loading = false;
    }
  }

  onSelectedPeopleChange(values: string[]) {
    this.selectedPeople = values;
    this.refreshEvents();
  }

  private applyPayload(payload: PlanningPayload) {
    this.team = payload.people.map((p) => ({ id: p.id, name: capitalize(p.name) }));
    this.absences = payload.events;
    this.selectedPeople = this.team.map((member) => member.name);
    this.refreshEvents();
  }

  private refreshEvents() {
    const visible = new Set(this.selectedPeople.length ? this.selectedPeople : this.team.map((p) => p.name));
    this.events = this.absences
      .filter((absence) => visible.has(capitalize(absence.userName)))
      .map((absence) => toCalendarEvent(absence));

    this.calendarOptions = { ...this.calendarOptions, events: [...this.events] };
  }
}

function toCalendarEvent(absence: PlanningEvent): EventInput {
  const title = `${capitalize(absence.userName)} - ${absence.reason || absence.type}`;
  const { start, end } = toEventRange(absence.date, absence.period);
  return {
    id: absence.id,
    title,
    start,
    end,
    display: 'block',
    classNames: ['absence-event'],
  };
}

function toEventRange(date: string, period: PlanningEvent['period']): { start: string; end: string } {
  const base = `${date}T`;
  switch (period) {
    case 'AM':
      return { start: `${base}08:00:00`, end: `${base}12:00:00` };
    case 'PM':
      return { start: `${base}13:00:00`, end: `${base}17:00:00` };
    default:
      return { start: `${base}08:00:00`, end: `${base}17:30:00` };
  }
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

