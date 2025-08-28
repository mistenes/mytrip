import { User, Trip, FinancialRecord, Document, PersonalDataFieldConfig, PersonalDataRecord, ItineraryItem } from './types';

export const USERS: User[] = [
  { id: '1', name: 'Admin', role: 'admin' },
  { id: '2', name: 'Organizer', role: 'organizer' },
  { id: '3', name: 'Traveler', role: 'traveler' },
];

export const INITIAL_TRIPS: Trip[] = [];
export const INITIAL_FINANCIAL_RECORDS: FinancialRecord[] = [];
export const INITIAL_DOCUMENTS: Document[] = [];
export const DEFAULT_PERSONAL_DATA_FIELD_CONFIGS: PersonalDataFieldConfig[] = [
  { id: 'firstName', tripId: 'default', label: 'Keresztnév', type: 'text', locked: true, order: 1 },
  { id: 'lastName', tripId: 'default', label: 'Vezetéknév', type: 'text', locked: true, order: 2 },
  { id: 'dateOfBirth', tripId: 'default', label: 'Születési dátum', type: 'date', locked: true, order: 3 },
  { id: 'middleName', tripId: 'default', label: 'Középső név', type: 'text', order: 4 },
  { id: 'passportNumber', tripId: 'default', label: 'Útlevélszám', type: 'text', order: 5 },
  { id: 'issueDate', tripId: 'default', label: 'Kiadás dátuma', type: 'date', order: 6 },
  { id: 'issuingCountry', tripId: 'default', label: 'Kibocsátó ország', type: 'text', order: 7 },
  { id: 'expiryDate', tripId: 'default', label: 'Lejárati dátum', type: 'date', order: 8 },
  { id: 'nationality', tripId: 'default', label: 'Állampolgárság', type: 'text', order: 9 },
  { id: 'sex', tripId: 'default', label: 'Nem', type: 'text', order: 10 },
];
export const INITIAL_PERSONAL_DATA_RECORDS: PersonalDataRecord[] = [];
export const INITIAL_ITINERARY_ITEMS: ItineraryItem[] = [];

export const MOCK_CURRENT_USER = {
  admin: USERS.find(u => u.role === 'admin')!,
  organizer: USERS.find(u => u.role === 'organizer')!,
  traveler: USERS.find(u => u.role === 'traveler')!,
};
