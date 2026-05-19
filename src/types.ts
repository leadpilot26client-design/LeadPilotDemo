export enum LeadStatus {
  ACTIVE = 'Active',
  DONE = 'Done'
}

export enum DoneReason {
  CLOSED_DEAL = 'Closed Deal',
  NOT_INTERESTED = 'Not Interested',
  NO_RESPONSE = 'No Response'
}

export enum AppointmentType {
  CALL = 'Call',
  SITE_VISIT = 'Site Visit',
  MEETING = 'Meeting',
  FOLLOW_UP = 'Follow-up'
}

export enum TaskStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed'
}

export interface Appointment {
  id: string;
  leadId: string;
  leadName: string;
  type: AppointmentType;
  date: string; // ISO string
  time: string; // HH:mm
  notes?: string;
  assignedTo: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  leadId?: string;
  leadName?: string;
  title: string;
  date: string; // ISO string
  time?: string; // HH:mm
  assignedTo: string;
  status: TaskStatus;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export enum CallOutcome {
  CONNECTED = 'Connected',
  BUSY = 'Busy',
  NOT_ANSWERED = 'Not Answered',
  WRONG_NUMBER = 'Wrong Number',
  FOLLOW_UP_LATER = 'Follow up Later'
}

export interface Lead {
  id: string;
  firstName: string;
  name?: string; // Compatibility
  lastName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  property?: string;
  propertyType?: string;
  budget?: string;
  location?: string;
  source?: string;
  notes?: string;
  callOutcome?: CallOutcome;
  followUpDate: string; // ISO string
  status: LeadStatus;
  doneReason?: DoneReason;
  assignedTo: string; // userId
  createdAt: string;
  updatedAt: string;
  clientId: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'agent';
}

export type FilterTab = 'Dashboard' | 'All' | 'Today' | 'Overdue' | 'Upcoming' | 'Done' | 'Site Visits' | 'Calendar' | 'Tasks' | 'Stats' | 'Settings';
