export type Role = 'admin' | 'organizer' | 'traveler';
export type TripView = 'summary' | 'financials' | 'itinerary' | 'documents' | 'personalData' | 'users' | 'settings';
export type Theme = 'light' | 'dark' | 'auto';

export interface User {
  id: string;
  name: string;
  role: Role;
  mustChangePassword?: boolean;
  token?: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  organizerIds: string[];
  organizerNames?: string[];
  travelerIds: string[];
}

export interface FinancialRecord {
  id: string;
  tripId: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
}

export interface Document {
  id: string;
  tripId: string;
  name: string;
  category: string;
  uploadDate: string;
  fileUrl: string;
  visibleTo: 'all' | string[];
}

export interface PersonalDataFieldConfig {
  id: string;
  tripId: string;
  label: string;
  type: 'text' | 'date' | 'file';
  enabled?: boolean;
  locked?: boolean;
  order?: number;
}

export interface PersonalDataRecord {
  userId: string;
  fieldId: string;
  value: string;
  isLocked: boolean;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  title: string;
  description: string;
  startDateTimeLocal: string;
  endDateTimeLocal?: string;
  location?: string;
  timeZone: string;
}
