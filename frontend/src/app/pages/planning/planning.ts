import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './planning.html',
  styleUrls: ['./planning.scss']
})
export class PlanningComponent {
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    editable: true,
    selectable: true,
    events: [
      { title: 'Alice - Présente', date: '2025-10-10', color: '#A78BFA' },
      { title: 'Paul - Absent', date: '2025-10-12', color: '#F472B6' },
    ],
    select: (info) => alert(`Nouvelle sélection du ${info.startStr} au ${info.endStr}`)
  };
}
