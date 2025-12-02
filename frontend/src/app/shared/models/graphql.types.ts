export interface GraphqlPayload<T> {
  data: T;
  errors?: { message: string }[];
}

export interface GraphQLResponse<T> {
  data: T;
  errors?: any[];
}

export interface PunctualityStats {
  lateRate: number;
  avgDelayMinutes: number;
}

export interface AbsenceBreakdown {
  type: string;
  days: number;
}

export interface UserKpiSummary {
  userId: string;
  fullName: string;
  presenceRate: number;
  avgHoursPerDay: number;
  overtimeHours: number;
  punctuality: PunctualityStats;
  absenceDays: number;
  absenceByType: AbsenceBreakdown[];
  reportsAuthored: number;
  reportsReceived: number;
  periodStart: string;
  periodEnd: string;
}

export interface TeamKpiSummary {
  teamId: string;
  teamName: string;
  headcount: number;
  presenceRate: number;
  avgHoursPerDay: number;
  absenceRate: number;
  reportsAuthored: number;
  periodStart: string;
  periodEnd: string;
}

export interface ClockRecord {
  id: string;
  kind: 'IN' | 'OUT';
  at: string;
}

export interface LeaveAccount {
  id: string;
  currentBalance: number;
  leaveType: {
    code: string;
    label: string;
  };
}
