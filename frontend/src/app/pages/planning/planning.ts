import { Component, OnInit } from '@angular/core';
import { CalendarOptions, EventInput, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth';
import { AbsenceService, Absence } from '../../core/services/absence';
import { TeamService } from '../../core/services/team';
import { MatDialog } from '@angular/material/dialog';
import { AbsenceRequestModal } from '../../modal/absence-request-modal/absence-request-modal';
import { AbsenceApprovalModal } from '../../modal/absence-approval-modal/absence-approval-modal';
import { NotificationService } from '../../core/services/notification';

interface TeamOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './planning.html',
  styleUrls: ['./planning.scss'],
})
export class PlanningComponent implements OnInit {
  private absences: Absence[] = [];
  private currentUserId: string = '';

  loading = false;
  isAdmin = false;
  isManager = false;
  isEmployee = false;
  
  teams: TeamOption[] = [];
  selectedTeamId: string | null = null;

  events: EventInput[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    expandRows: true,
    height: 'auto',
    nowIndicator: true,
    locale: 'en',
    firstDay: 1,
    selectable: true,
    selectMirror: true,
    eventOverlap: true,
    editable: false,
    events: [],
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    dayMaxEvents: false,
    eventDisplay: 'block',
    displayEventTime: false,
  };

  constructor(
    private readonly auth: AuthService,
    private readonly absenceService: AbsenceService,
    private readonly teamService: TeamService,
    private readonly dialog: MatDialog,
    private readonly notify: NotificationService,
  ) {}

  ngOnInit(): void {
    const session = this.auth.session;
    if (!session) {
      this.notify.error('Not authenticated');
      return;
    }

    this.currentUserId = session.user.id;
    this.isAdmin = session.user.roles.includes('ADMIN');
    this.isManager = session.user.roles.includes('MANAGER');
    this.isEmployee = session.user.roles.includes('EMPLOYEE');

    if (this.isAdmin) {
      this.loadTeamsForAdmin();
    } else {
      this.loadAbsences();
    }
  }



  async loadTeamsForAdmin() {
    this.loading = true;
    try {
      const teams = await firstValueFrom(this.teamService.listAllTeams());
      this.teams = teams.map((t) => ({ id: t.id, name: t.name }));
      
      if (this.teams.length > 0) {
        this.selectedTeamId = this.teams[0].id;
        await this.loadAbsencesForTeam(this.selectedTeamId);
      }
    } catch (err) {
      console.error('Failed to load teams', err);
      this.notify.error('Failed to load teams');
    } finally {
      this.loading = false;
    }
  }

  async onTeamChange() {
    if (this.selectedTeamId) {
      await this.loadAbsencesForTeam(this.selectedTeamId);
    }
  }

  async loadAbsencesForTeam(teamId: string) {
    this.loading = true;
    try {
      this.absences = await firstValueFrom(this.absenceService.teamAbsences(teamId));
      await this.enrichAbsencesWithUserNames();
      this.refreshEvents();
    } catch (err) {
      console.error('Failed to load team absences', err);
      this.notify.error('Failed to load team absences');
      this.absences = [];
      this.refreshEvents();
    } finally {
      this.loading = false;
    }
  }

  async loadAbsences() {
    this.loading = true;
    try {
      let teamId: string | undefined = undefined;
      
      if (this.isEmployee && !this.isManager && !this.isAdmin) {
        const teams = await firstValueFrom(this.teamService.listMyTeams());
        if (teams.length > 0) {
          teamId = teams[0].id;
        }
      }
      
      this.absences = await firstValueFrom(this.absenceService.myTeamAbsences(teamId));
      await this.enrichAbsencesWithUserNames();
      this.refreshEvents();
    } catch (err) {
      console.error('Failed to load absences', err);
      this.notify.error('Failed to load absences');
      this.absences = [];
      this.refreshEvents();
    } finally {
      this.loading = false;
    }
  }

  private async enrichAbsencesWithUserNames() {
    try {
      const userMap = this.isAdmin
        ? await firstValueFrom(this.absenceService.getAllUsersForAdmin())
        : await firstValueFrom(this.absenceService.getAllUsers());
      
      this.absences = this.absences.map((absence) => {
        const userInfo = userMap.get(absence.userId);
        if (userInfo) {
          return {
            ...absence,
            user: {
              id: absence.userId,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              email: userInfo.email,
            },
          };
        }
        return absence;
      });
    } catch (err) {
      console.error('Failed to enrich absences with user names', err);
    }
  }

  private refreshEvents() {
    const userId = this.currentUserId;
    
    this.events = this.absences
      .filter((absence) => {
        if (absence.userId === userId) return true;
        
        if (this.isEmployee && !this.isManager) {
          return absence.status === 'APPROVED';
        }
        
        return true;
      })
      .flatMap((absence) => this.absenceToEvents(absence));

    this.calendarOptions = { ...this.calendarOptions, events: [...this.events] };
  }

  private absenceToEvents(absence: Absence): EventInput[] {
    const isOwnAbsence = absence.userId === this.currentUserId;
    const userName = this.getUserName(absence);
    
    return absence.days.map((day) => {
      const color = this.getEventColor(absence, isOwnAbsence);
      const title = isOwnAbsence
        ? `${this.getTypeLabel(absence.type)}`
        : userName;

      return {
        id: absence.id,
        title,
        start: this.toEventTime(day.absenceDate, day.period, 'start'),
        end: this.toEventTime(day.absenceDate, day.period, 'end'),
        display: 'block',
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          absence,
          isOwn: isOwnAbsence,
        },
      };
    });
  }

  private getEventColor(absence: Absence, isOwn: boolean): string {
    if (isOwn) {
      return absence.status === 'PENDING' ? '#f59e0b' : '#10b981';
    }
    return absence.status === 'PENDING' ? '#f59e0b' : '#8b5cf6';
  }

  private toEventTime(date: string, period: string, edge: 'start' | 'end'): string {
    const base = `${date}T`;
    
    if (period === 'AM') {
      return edge === 'start' ? `${base}08:00:00` : `${base}12:00:00`;
    }
    
    if (period === 'PM') {
      return edge === 'start' ? `${base}13:00:00` : `${base}17:00:00`;
    }
    
    return edge === 'start' ? `${base}08:00:00` : `${base}17:30:00`;
  }

  private getUserName(absence: Absence): string {
    const user = absence.user;
    if (user && (user.firstName || user.lastName)) {
      return [user.firstName, user.lastName].filter(Boolean).join(' ');
    }
    if (user?.email) {
      return user.email;
    }
    return 'Unknown User';
  }

  private getTypeLabel(type: string): string {
    const typeMap: Record<string, string> = {
      SICK: 'Sick',
      VACATION: 'Vacation',
      PERSONAL: 'Personal',
      FORMATION: 'Formation',
      RTT: 'RTT',
      OTHER: 'Other',
    };
    return typeMap[type] || type;
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    const dialogRef = this.dialog.open(AbsenceRequestModal, {
      width: '500px',
      data: {
        startDate: selectInfo.start,
        endDate: new Date(selectInfo.end.getTime() - 86400000),
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.createAbsenceRequest(result);
      }
    });
  }

  handleEventClick(clickInfo: EventClickArg) {
    const absence = clickInfo.event.extendedProps['absence'] as Absence;
    const isOwn = clickInfo.event.extendedProps['isOwn'] as boolean;

    if (isOwn || this.isManager || this.isAdmin) {
      this.openApprovalModal(absence);
    }
  }

  private openApprovalModal(absence: Absence) {
    const dialogRef = this.dialog.open(AbsenceApprovalModal, {
      width: '500px',
      data: { absence },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        if (result.action === 'approve') {
          await this.approveAbsence(result.absenceId);
        } else if (result.action === 'reject') {
          await this.rejectAbsence(result.absenceId);
        }
      }
    });
  }

  private async createAbsenceRequest(data: any) {
    try {
      await firstValueFrom(this.absenceService.createAbsence(data));
      this.notify.success('Absence request submitted');
      if (this.isAdmin && this.selectedTeamId) {
        await this.loadAbsencesForTeam(this.selectedTeamId);
      } else {
        await this.loadAbsences();
      }
    } catch (err) {
      console.error('Failed to create absence', err);
      this.notify.error('Failed to create absence request');
    }
  }

  private async approveAbsence(absenceId: string) {
    try {
      await firstValueFrom(
        this.absenceService.setAbsenceStatus(absenceId, { status: 'APPROVED' })
      );
      this.notify.success('Absence approved');
      if (this.isAdmin && this.selectedTeamId) {
        await this.loadAbsencesForTeam(this.selectedTeamId);
      } else {
        await this.loadAbsences();
      }
    } catch (err) {
      console.error('Failed to approve absence', err);
      this.notify.error('Failed to approve absence');
    }
  }

  private async rejectAbsence(absenceId: string) {
    try {
      await firstValueFrom(
        this.absenceService.setAbsenceStatus(absenceId, { status: 'REJECTED' })
      );
      this.notify.success('Absence rejected');
      if (this.isAdmin && this.selectedTeamId) {
        await this.loadAbsencesForTeam(this.selectedTeamId);
      } else {
        await this.loadAbsences();
      }
    } catch (err) {
      console.error('Failed to reject absence', err);
      this.notify.error('Failed to reject absence');
    }
  }
}

