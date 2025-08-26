import { User, Trip, FinancialRecord, Document, PersonalDataFieldConfig, PersonalDataRecord, ItineraryItem } from './types';

export const USERS: User[] = [
  { id: 1, name: 'Admin', role: 'admin' },
  { id: 2, name: 'Organizer', role: 'organizer' },
  { id: 3, name: 'Traveler', role: 'traveler' },
];

export const INITIAL_TRIPS: Trip[] = [];
export const INITIAL_FINANCIAL_RECORDS: FinancialRecord[] = [];
export const INITIAL_DOCUMENTS: Document[] = [];
export const DEFAULT_PERSONAL_DATA_FIELD_CONFIGS: PersonalDataFieldConfig[] = [];
export const INITIAL_PERSONAL_DATA_RECORDS: PersonalDataRecord[] = [];
export const INITIAL_ITINERARY_ITEMS: ItineraryItem[] = [];

export const MOCK_CURRENT_USER = {
  admin: USERS.find(u => u.role === 'admin')!,
  organizer: USERS.find(u => u.role === 'organizer')!,
  traveler: USERS.find(u => u.role === 'traveler')!,
};
