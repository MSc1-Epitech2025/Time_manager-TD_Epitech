import { Component, OnDestroy, OnInit } from '@angular/core';
import { CalendarOptions, EventInput, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PlanningService, PlanningEvent, PlanningPayload } from '../../core/services/planning';
import { AuthService } from '../../core/services/auth';
import { TeamService } from '../../core/services/team';
import { AbsenceService } from '../../core/services/absence';
import { ManagerService } from '../../core/services/manager';
import { NotificationService } from '../../core/services/notification';
import { RequestAbsenceModalComponent } from '../../modal/request-absence-modal/request-absence-modal';
import { ApproveAbsenceModalComponent } from '../../modal/approve-absence-modal/approve-absence-modal';
import { CreateMeetingModalComponent } from '../../modal/create-meeting-modal/create-meeting-modal';
import { SelectEventTypeModalComponent } from '../../modal/select-event-type-modal/select-event-type-modal';

interface PersonOption {
  id: string;
  name: string;
  teamId?: string;
  teamName?: string;
}

interface FilterOptions {
  showAbsences: boolean;
  showMeetings: boolean;
  absenceTypes: Set<string>;
}

interface SelectionInfo {
  startStr: string;
  endStr: string;
  allDay: boolean;
  start: Date;
  end: Date;
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
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './planning.html',
  styleUrls: ['./planning.scss'],
})
export class PlanningComponent implements OnInit {
  private absences: PlanningEvent[] = [];

  isManager = false;
  isAdmin = false;
  isEmployee = false;
  userName = '';
  team: PersonOption[] = [];
  selectedPeople: string[] = [];
  loading = false;
  selectedTeamId: string | null = null;
  filtersOpen = false;

  events: EventInput[] = [];

  // Filters
  filterOptions: FilterOptions = {
    showAbsences: true,
    showMeetings: true,
    absenceTypes: new Set(['VACATION', 'SICK_LEAVE', 'PERSONAL', 'OTHER']),
  };

  absenceTypeOptions = ['VACATION', 'SICK_LEAVE', 'PERSONAL', 'OTHER'];
  availableAbsenceStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  selectedAbsenceStatuses = new Set(['PENDING', 'APPROVED']);

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,dayGridMonth',
    },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    expandRows: true,
    height: 'auto',
    nowIndicator: true,
    locale: 'en',
    firstDay: 1,
    selectable: true,
    eventOverlap: true,
    editable: false,
    events: [],
    select: (info) => this.onSelectDates(info),
    eventClick: (info) => this.onEventClick(info),
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly planningService: PlanningService,
    private readonly auth: AuthService,
    private readonly teamService: TeamService,
    private readonly absenceService: AbsenceService,
    private readonly managerService: ManagerService,
    private readonly notify: NotificationService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.initializeRoles();
    this.loadPlanning();
  }

  private initializeRoles() {
    const roles = this.auth.session?.user.roles ?? [];
    this.isAdmin = roles.includes('ADMIN');
    this.isManager = roles.includes('MANAGER') || this.isAdmin;
    this.isEmployee = roles.includes('EMPLOYEE');
  }

  async loadPlanning() {
    this.loading = true;
    try {
      // Load team members
      await this.loadTeamMembers();

      // Load planning events
      if (this.isManager) {
        try {
          const payload = await firstValueFrom(
            this.planningService.getManagerPlanning(this.selectedTeamId ? Number.parseInt(this.selectedTeamId) : null)
          );
          this.applyPayload(payload);
        } catch (err) {
          console.error('Failed to load manager planning', err);
          this.notify.error('Could not load team planning data');
          this.absences = [];
          this.refreshEvents();
        }
      } else {
        try {
          const payload = await firstValueFrom(this.planningService.getEmployeePlanning());
          this.applyPayload(payload);
        } catch (err) {
          console.error('Failed to load employee planning', err);
          this.notify.error('Could not load your planning data');
          this.absences = [];
          this.refreshEvents();
        }
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

  private async loadTeamMembers() {
    try {
      let teams: PersonOption[] = [];

      if (this.isManager) {
        teams = await this.loadManagerTeamMembers();
      } else if (this.isEmployee) {
        teams = await this.loadEmployeeTeamMembers();
      }

      this.team = teams;
      this.selectedPeople = teams.map((t) => t.name);
    } catch (err) {
      console.warn('Failed to load team members', err);
      this.team = [];
      this.selectedPeople = [];
    }
  }

  private async loadManagerTeamMembers(): Promise<PersonOption[]> {
    const myTeams = await firstValueFrom(this.teamService.listMyTeamMembers());
    const memberMap = new Map<string, PersonOption>();

    for (const team of myTeams) {
      for (const member of team.members) {
        if (!memberMap.has(member.id)) {
          memberMap.set(member.id, {
            id: member.id,
            name: member.name,
            teamId: team.id,
            teamName: team.name,
          });
        }
      }
    }

    return Array.from(memberMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  private async loadEmployeeTeamMembers(): Promise<PersonOption[]> {
    const myTeams = await firstValueFrom(this.teamService.listMyTeamMembers());
    const memberSet = new Set<string>();
    const teams: PersonOption[] = [];

    for (const team of myTeams) {
      for (const member of team.members) {
        if (!memberSet.has(member.id)) {
          memberSet.add(member.id);
          teams.push({
            id: member.id,
            name: member.name,
            teamId: team.id,
            teamName: team.name,
          });
        }
      }
    }

    return teams.sort((a, b) => a.name.localeCompare(b.name));
  }

  onSelectedPeopleChange(values: string[]) {
    this.selectedPeople = values;
    this.refreshEvents();
  }

  toggleAbsenceType(type: string) {
    if (this.filterOptions.absenceTypes.has(type)) {
      this.filterOptions.absenceTypes.delete(type);
    } else {
      this.filterOptions.absenceTypes.add(type);
    }
    this.refreshEvents();
  }

  toggleAbsenceStatus(status: string) {
    if (this.selectedAbsenceStatuses.has(status)) {
      this.selectedAbsenceStatuses.delete(status);
    } else {
      this.selectedAbsenceStatuses.add(status);
    }
    this.refreshEvents();
  }

  toggleFilters() {
    this.filtersOpen = !this.filtersOpen;
  }

  private onSelectDates(info: DateSelectArg) {
    // Only allow employees to request absences and managers to create meetings
    if (!this.isEmployee && !this.isManager) {
      this.notify.info('You do not have permission to create events');
      return;
    }

    const selection: SelectionInfo = {
      startStr: info.startStr,
      endStr: info.endStr,
      allDay: info.allDay,
      start: info.start,
      end: info.end,
    };

    if (this.isEmployee) {
      // Direct to absence request
      this.openRequestAbsenceModal(selection);
    } else if (this.isManager) {
      // Show modal to choose between absence and meeting
      this.openSelectEventTypeModal(selection);
    }
  }

  private openRequestAbsenceModal(selection: SelectionInfo) {
    const dialogRef = this.dialog.open(RequestAbsenceModalComponent, {
      width: '600px',
      data: {
        currentUserId: this.auth.session?.user.id,
        currentUserName: this.auth.session?.user.fullName,
        selectedStart: selection.startStr,
        selectedEnd: selection.endStr,
        selectedAllDay: selection.allDay,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPlanning();
      }
    });
  }

  private openSelectEventTypeModal(selection: SelectionInfo) {
    const dialogRef = this.dialog.open(SelectEventTypeModalComponent, {
      width: '400px',
      data: {
        selection,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.type === 'absence') {
        this.openRequestAbsenceModal(selection);
      } else if (result?.type === 'meeting') {
        this.openCreateMeetingModal(selection);
      }
    });
  }

  private openCreateMeetingModal(selection: SelectionInfo) {
    const dialogRef = this.dialog.open(CreateMeetingModalComponent, {
      width: '600px',
      data: {
        teamMembers: this.team,
        selectedStart: selection.startStr,
        selectedEnd: selection.endStr,
        selectedAllDay: selection.allDay,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.notify.success('Meeting created and added to calendar');
        this.loadPlanning();
      }
    });
  }

  async selectTeam(teamId: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { teamId },
      queryParamsHandling: 'merge',
    });
  }

  private applyPayload(payload: PlanningPayload) {
    this.absences = payload.events;
    this.refreshEvents();
  }

  refreshEvents() {
    const visible = new Set(this.selectedPeople.length ? this.selectedPeople : this.team.map((p) => p.name));

    this.events = this.absences
      .filter((absence) => visible.has(capitalize(absence.userName)))
      .filter((absence) => this.filterOptions.showAbsences)
      .filter((absence) => this.filterOptions.absenceTypes.has(absence.type))
      .filter((absence) => this.selectedAbsenceStatuses.has(absence.status))
      .map((absence) => toCalendarEvent(absence));

    this.calendarOptions = { ...this.calendarOptions, events: [...this.events] };
  }

  private onEventClick(info: any) {
    const absence = this.absences.find((a) => a.id === info.event.id);
    if (!absence) return;

    // For managers: show approval/rejection option
    if (this.isManager && absence.status === 'PENDING') {
      const employee = this.team.find((p) => capitalize(p.name) === capitalize(absence.userName));
      const dialogRef = this.dialog.open(ApproveAbsenceModalComponent, {
        width: '500px',
        data: {
          absence,
          employeeName: employee?.name || absence.userName,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.loadPlanning();
        }
      });
    }
  }

  canRequestAbsence(): boolean {
    return this.isEmployee;
  }

  canCreateMeetings(): boolean {
    return this.isManager;
  }

  get filterSummary(): string {
    const parts: string[] = [];
    if (this.filterOptions.absenceTypes.size > 0) {
      parts.push(`${this.filterOptions.absenceTypes.size} types`);
    }
    if (this.selectedAbsenceStatuses.size > 0) {
      parts.push(`${this.selectedAbsenceStatuses.size} statuses`);
    }
    return parts.join(' • ') || 'All';
  }
}

function toCalendarEvent(absence: PlanningEvent): EventInput {
  const statusBadge = getStatusBadge(absence.status);
  const title = `${statusBadge} ${capitalize(absence.userName)} - ${absence.reason || absence.type}`;
  const { start, end } = toEventRange(absence.date, absence.period);

  const classNames = [
    'absence-event',
    `absence-status-${absence.status.toLowerCase()}`,
    `absence-type-${absence.type.toLowerCase()}`,
  ];

  return {
    id: absence.id,
    title,
    start,
    end,
    display: 'block',
    classNames,
    extendedProps: {
      status: absence.status,
      type: absence.type,
      reason: absence.reason,
    },
  };
}

function getStatusBadge(status: string): string {
  if (status === 'APPROVED') return '✓';
  if (status === 'REJECTED') return '✗';
  return '○';
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
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

