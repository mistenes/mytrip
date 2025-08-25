import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// --- TYPE DEFINITIONS ---
type Role = 'admin' | 'organizer' | 'traveler';
type TripView = 'summary' | 'financials' | 'itinerary' | 'documents' | 'personalData';
type Theme = 'light' | 'dark' | 'auto';

interface User {
  id: number;
  name: string;
  role: Role;
}

interface Trip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  organizerId: number;
  travelerIds: number[];
}

interface FinancialRecord {
  id: number;
  tripId: number;
  userId: number;
  description: string;
  amount: number; // positive for payment, negative for expense
  date: string;
}

interface Document {
  id: number;
  tripId: number;
  name: string;
  category: string;
  uploadDate: string;
  fileUrl: string; // Mock URL
  visibleTo: 'all' | number[];
}

interface PersonalDataFieldConfig {
    id: string; // e.g., 'passportNumber'
    tripId: number;
    label: string;
    type: 'text' | 'date' | 'file';
}

interface PersonalDataRecord {
    userId: number;
    tripId: number;
    fieldId: string;
    value: string; // for text/date, or filename for file
    isLocked: boolean;
}

interface ItineraryItem {
  id: number;
  tripId: number;
  title: string;
  description: string;
  startDateTimeLocal: string; // "YYYY-MM-DDTHH:mm"
  endDateTimeLocal?: string;  // "YYYY-MM-DDTHH:mm"
  location?: string;
  timeZone: string; // IANA Time Zone Database name, e.g., "Europe/Paris"
}


// --- MOCK DATA ---
const USERS: User[] = [
  { id: 1, name: 'Admin Felhasználó', role: 'admin' },
  { id: 2, name: 'Profi Szervező', role: 'organizer' },
  { id: 3, name: 'Boldog Utazó', role: 'traveler' },
  { id: 4, name: 'Kovács Kázmér', role: 'organizer' },
];

const INITIAL_TRIPS: Trip[] = [
  {
    id: 101,
    name: 'Párizsi Kaland',
    startDate: '2024-09-15',
    endDate: '2024-09-22',
    organizerId: 2,
    travelerIds: [3],
  },
  {
    id: 102,
    name: 'Tokiói Tech Csúcs',
    startDate: '2024-10-20',
    endDate: '2024-10-25',
    organizerId: 4,
    travelerIds: [],
  },
  {
    id: 103,
    name: 'Római Felfedezés',
    startDate: '2024-11-05',
    endDate: '2024-11-12',
    organizerId: 2,
    travelerIds: [3],
  },
];

const INITIAL_FINANCIAL_RECORDS: FinancialRecord[] = [
    { id: 1, tripId: 101, userId: 3, description: 'Repülőjegy', amount: -250, date: '2024-08-01' },
    { id: 2, tripId: 101, userId: 3, description: 'Szállás előleg', amount: -180, date: '2024-08-05' },
    { id: 3, tripId: 101, userId: 3, description: 'Első befizetés', amount: 500, date: '2024-07-20' },
    { id: 4, tripId: 103, userId: 3, description: 'Múzeumbelépő', amount: -50, date: '2024-10-10' },
    { id: 5, tripId: 103, userId: 3, description: 'Befizetés', amount: 100, date: '2024-10-01' },
];

const INITIAL_DOCUMENTS: Document[] = [
  { id: 1, tripId: 101, name: 'Párizs Repjegy - Oda', category: 'Repjegyek', uploadDate: '2024-08-10', fileUrl: '#', visibleTo: 'all' },
  { id: 2, tripId: 101, name: 'Szállás Visszaigazolás', category: 'Szállás', uploadDate: '2024-08-12', fileUrl: '#', visibleTo: 'all' },
  { id: 3, tripId: 101, name: 'Biztosítási Kötvény - Boldog Utazó', category: 'Biztosítás', uploadDate: '2024-08-15', fileUrl: '#', visibleTo: [3] },
  { id: 4, tripId: 103, name: 'Colosseum Jegyek', category: 'Programok', uploadDate: '2024-10-20', fileUrl: '#', visibleTo: 'all' },
];

const PERSONAL_DATA_FIELD_CONFIGS: PersonalDataFieldConfig[] = [
    { id: 'fullName', tripId: 101, label: 'Teljes név (útlevél szerint)', type: 'text' },
    { id: 'dob', tripId: 101, label: 'Születési dátum', type: 'date' },
    { id: 'passportNumber', tripId: 101, label: 'Útlevél száma', type: 'text' },
    { id: 'passportScan', tripId: 101, label: 'Útlevél másolat', type: 'file' },
    { id: 'visa', tripId: 102, label: 'Vízum másolat', type: 'file' },
    { id: 'idCard', tripId: 103, label: 'Személyi igazolvány másolat', type: 'file' },
];

const INITIAL_PERSONAL_DATA_RECORDS: PersonalDataRecord[] = [
    { userId: 3, tripId: 101, fieldId: 'fullName', value: 'Boldog Utazó', isLocked: true },
    { userId: 3, tripId: 101, fieldId: 'dob', value: '1990-05-15', isLocked: false },
    { userId: 3, tripId: 101, fieldId: 'passportScan', value: 'passport_utazo.pdf', isLocked: false },
];

const INITIAL_ITINERARY_ITEMS: ItineraryItem[] = [
    {
        id: 1, tripId: 101, title: 'Érkezés Párizsba és transzfer a hotelbe',
        description: 'Érkezés a Charles de Gaulle repülőtérre (CDG), majd transzfer a szállodába. Bejelentkezés és egy kis pihenés.',
        startDateTimeLocal: '2024-09-15T16:00', timeZone: 'Europe/Paris', location: 'Hotel Le Chat Noir, Montmartre'
    },
    {
        id: 2, tripId: 101, title: 'Séta a Montmartre-on és vacsora',
        description: 'Felfedezzük a művészek negyedét, a Sacré-Cœur-bazilikát és a Place du Tertre-t. A vacsora egy hangulatos helyi bisztróban lesz.',
        startDateTimeLocal: '2024-09-15T18:30', endDateTimeLocal: '2024-09-15T21:00', timeZone: 'Europe/Paris', location: 'Montmartre'
    },
    {
        id: 3, tripId: 101, title: 'Louvre Múzeum látogatás',
        description: 'Előre lefoglalt jegyekkel tekintjük meg a világ leghíresebb műalkotásait, köztük a Mona Lisát és a Milói Vénuszt.',
        startDateTimeLocal: '2024-09-16T09:30', endDateTimeLocal: '2024-09-16T13:00', timeZone: 'Europe/Paris', location: 'Musée du Louvre'
    },
    {
        id: 4, tripId: 101, title: 'Eiffel-torony',
        description: 'Felmegyünk a torony csúcsára, ahonnan lenyűgöző kilátás nyílik a városra. A program a naplementéhez van igazítva.',
        startDateTimeLocal: '2024-09-16T19:00', timeZone: 'Europe/Paris', location: 'Eiffel-torony'
    },
];

// --- MOCK CURRENT USERS (for demo purposes) ---
const MOCK_CURRENT_USER = {
  admin: USERS.find(u => u.role === 'admin')!,
  organizer: USERS.find(u => u.role === 'organizer')!,
  traveler: USERS.find(u => u.role === 'traveler')!,
};


// --- COMPONENTS ---

const LoginPage = ({ onLogin }: { onLogin: (role: Role) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === 'admin' && password === 'adminpass') {
      onLogin('admin');
    } else if (username === 'organizer' && password === 'orgpass') {
      onLogin('organizer');
    } else if (username === 'traveler' && password === 'travelpass') {
      onLogin('traveler');
    } else {
      setError('Érvénytelen felhasználónév vagy jelszó.');
    }
  };
    
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Mytrip</h1>
        <p>Kérjük, jelentkezzen be a folytatáshoz</p>
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label htmlFor="username">Felhasználónév</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Jelszó</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary">Bejelentkezés</button>
        </form>
         <div className="mock-credentials">
            <h4>Demó belépési adatok:</h4>
            <p><b>Admin:</b> admin / adminpass</p>
            <p><b>Szervező:</b> organizer / orgpass</p>
            <p><b>Utazó:</b> traveler / travelpass</p>
        </div>
      </div>
    </div>
  );
};


const ThemeSwitcher = ({ theme, onThemeChange }: { theme: Theme, onThemeChange: (theme: Theme) => void }) => (
    <div className="theme-switcher">
        <button className={theme === 'light' ? 'active' : ''} onClick={() => onThemeChange('light')} aria-label="Világos téma">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </button>
        <button className={theme === 'dark' ? 'active' : ''} onClick={() => onThemeChange('dark')} aria-label="Sötét téma">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>
        <button className={theme === 'auto' ? 'active' : ''} onClick={() => onThemeChange('auto')} aria-label="Rendszerbeállítás">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        </button>
    </div>
);

const Header = ({ user, onLogout, onToggleSidebar, showHamburger, theme, onThemeChange }: { 
    user: User; 
    onLogout: () => void; 
    onToggleSidebar: () => void;
    showHamburger: boolean;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
}) => (
  <header className="app-header">
    <div className="header-left">
         {showHamburger && (
            <button className="hamburger-menu" onClick={onToggleSidebar} aria-label="Menü megnyitása">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
         )}
         <h1 className="logo">Mytrip</h1>
    </div>
    <div className="user-info">
      <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
      <span>Üdv, <strong>{user.name}</strong> ({user.role})</span>
      <button onClick={onLogout} className="btn btn-logout">Kijelentkezés</button>
    </div>
  </header>
);

const CreateTripModal = ({
  isOpen,
  onClose,
  onCreate,
  organizers
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (trip: Omit<Trip, 'id'>) => void;
  organizers: User[];
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [organizerId, setOrganizerId] = useState<number>(organizers[0]?.id || 0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate || !organizerId) {
        alert("Kérjük, töltsön ki minden mezőt.");
        return;
    }
    onCreate({ name, startDate, endDate, organizerId: Number(organizerId), travelerIds: [] });
    onClose();
    setName(''); setStartDate(''); setEndDate(''); setOrganizerId(organizers[0]?.id || 0);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Új utazás létrehozása</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="tripName">Utazás neve</label>
            <input id="tripName" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="startDate">Kezdés dátuma</label>
            <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">Befejezés dátuma</label>
            <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="organizer">Szervező</label>
            <select id="organizer" value={organizerId} onChange={e => setOrganizerId(Number(e.target.value))} required>
              {organizers.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Mégse</button>
            <button type="submit" className="btn btn-primary">Létrehozás és meghívás</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TripCard = ({ trip, onSelectTrip }: { trip: Trip; onSelectTrip: () => void; }) => {
    const organizer = USERS.find(u => u.id === trip.organizerId);
    return (
        <div className="trip-card">
            <div>
                <h3>{trip.name}</h3>
                <div className="trip-details">
                    <div className="detail-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>{trip.startDate} - {trip.endDate}</span>
                    </div>
                     <div className="detail-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <span><strong>Szervező:</strong> {organizer ? organizer.name : 'Ismeretlen'}</span>
                    </div>
                    <div className="detail-item">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        <span><strong>Utazók:</strong> {trip.travelerIds.length}</span>
                    </div>
                </div>
            </div>
            <div className="trip-card-actions">
                <button onClick={onSelectTrip} className="btn btn-primary">
                   Részletek
                </button>
            </div>
        </div>
    );
};

// --- TRIP CONTENT COMPONENTS ---

const TripSummary = ({ trip }: { trip: Trip }) => {
    const organizer = USERS.find(u => u.id === trip.organizerId);
    const travelers = USERS.filter(u => trip.travelerIds.includes(u.id));
    return (
        <div>
            <h2>Összegzés: {trip.name}</h2>
            <p><strong>Időpont:</strong> {trip.startDate} - {trip.endDate}</p>
            <p><strong>Szervező:</strong> {organizer?.name}</p>
            <h3>Résztvevők ({travelers.length})</h3>
            {travelers.length > 0 ? (
                <ul>
                    {travelers.map(t => <li key={t.id}>{t.name}</li>)}
                </ul>
            ) : <p>Nincsenek utazók hozzárendelve.</p>}
        </div>
    );
};

const TripFinancials = ({ trip, user, records, users, onAddRecord }: { 
    trip: Trip; 
    user: User; 
    records: FinancialRecord[];
    users: User[];
    onAddRecord: (record: Omit<FinancialRecord, 'id'>) => void;
}) => {
    
    const tripParticipants = useMemo(() => {
        const participantIds = new Set([trip.organizerId, ...trip.travelerIds]);
        return users.filter(u => participantIds.has(u.id));
    }, [trip, users]);

    const balances = useMemo(() => {
        const userBalances = new Map<number, number>();
        tripParticipants.forEach(p => userBalances.set(p.id, 0));
        records.forEach(r => {
            if (userBalances.has(r.userId)) {
                userBalances.set(r.userId, userBalances.get(r.userId)! + r.amount);
            }
        });
        return userBalances;
    }, [records, tripParticipants]);
    
    // Form state for admin/organizer
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'expense' | 'payment'>('expense');
    const [selectedUserId, setSelectedUserId] = useState<number>(tripParticipants[0]?.id || 0);
    
    useEffect(() => {
        if (tripParticipants.length > 0 && !tripParticipants.find(p => p.id === selectedUserId)) {
            setSelectedUserId(tripParticipants[0].id);
        }
    }, [trip.id, tripParticipants]);

    const handleAddRecord = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!description || isNaN(numericAmount) || !selectedUserId) {
            alert("Kérjük, töltsön ki minden mezőt helyesen.");
            return;
        }

        onAddRecord({
            tripId: trip.id,
            userId: selectedUserId,
            description,
            amount: type === 'expense' ? -Math.abs(numericAmount) : Math.abs(numericAmount),
            date: new Date().toISOString().split('T')[0]
        });

        // Reset form
        setDescription('');
        setAmount('');
    }

    return (
        <div className="financials-page">
            <h2>Pénzügyek: {trip.name}</h2>
            
            {(user.role === 'admin' || user.role === 'organizer') && (
                <>
                    <h3>Egyenlegek</h3>
                    <div className="financial-summary">
                        {tripParticipants.map(p => {
                            const balance = balances.get(p.id) || 0;
                            const balanceClass = balance >= 0 ? 'positive' : 'negative';
                            return (
                                <div key={p.id} className="summary-card">
                                    <h4>{p.name}</h4>
                                    <p className={`balance ${balanceClass}`}>{balance.toLocaleString()} HUF</p>
                                </div>
                            )
                        })}
                    </div>

                    <h3>Új tétel hozzáadása</h3>
                    <form className="add-record-form" onSubmit={handleAddRecord}>
                        <div className="form-row">
                             <div className="form-group">
                                <label htmlFor="participant">Résztvevő</label>
                                <select id="participant" value={selectedUserId} onChange={e => setSelectedUserId(Number(e.target.value))}>
                                    {tripParticipants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Leírás</label>
                                <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="amount">Összeg (HUF)</label>
                                <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Típus</label>
                                <div className="radio-group">
                                    <label><input type="radio" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} /> Kiadás</label>
                                    <label><input type="radio" value="payment" checked={type === 'payment'} onChange={() => setType('payment')} /> Befizetés</label>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">Hozzáadás</button>
                    </form>
                </>
            )}

            <h3>Tranzakciók</h3>
            <div className="table-container">
                <table className="financial-table">
                    <thead>
                        <tr>
                            { (user.role === 'admin' || user.role === 'organizer') && <th>Résztvevő</th> }
                            <th>Dátum</th>
                            <th>Leírás</th>
                            <th>Összeg (HUF)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records
                            .filter(r => user.role !== 'traveler' || r.userId === user.id)
                            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(r => {
                                const participant = users.find(u => u.id === r.userId);
                                return (
                                    <tr key={r.id}>
                                        { (user.role === 'admin' || user.role === 'organizer') && <td>{participant?.name || 'Ismeretlen'}</td> }
                                        <td>{r.date}</td>
                                        <td>{r.description}</td>
                                        <td className={r.amount >= 0 ? 'positive' : 'negative'}>{r.amount.toLocaleString()}</td>
                                    </tr>
                                )
                            })}
                    </tbody>
                </table>
            </div>

            {user.role === 'traveler' && (
                 <div className="financial-summary traveler-summary">
                    <div className="summary-card">
                        <h4>Az Ön egyenlege</h4>
                        <p className={`balance ${(balances.get(user.id) || 0) >= 0 ? 'positive' : 'negative'}`}>
                            {(balances.get(user.id) || 0).toLocaleString()} HUF
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ItineraryItemModal = ({ isOpen, onClose, item, onAdd, tripStartDate, tripEndDate }: {
    isOpen: boolean;
    onClose: () => void;
    item?: ItineraryItem | null;
    onAdd?: (item: Omit<ItineraryItem, 'id' | 'tripId'>) => void;
    tripStartDate: string;
    tripEndDate: string;
}) => {
    // Form state for adding a new item
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(tripStartDate);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [timeZone, setTimeZone] = useState('Europe/Budapest');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || !startTime || !timeZone) {
            alert('Kérjük, töltse ki a csillaggal jelölt mezőket.');
            return;
        }
        onAdd?.({
            title,
            description,
            startDateTimeLocal: `${date}T${startTime}`,
            endDateTimeLocal: endTime ? `${date}T${endTime}` : undefined,
            location,
            timeZone
        });
        onClose();
    };

    const isAdding = !item && onAdd;
    const currentItem = isAdding ? null : item;

    const formatTime = (localDateTime?: string) => localDateTime ? localDateTime.split('T')[1] : '';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content itinerary-modal-content" onClick={e => e.stopPropagation()}>
                {isAdding ? (
                    <form onSubmit={handleSubmit}>
                        <h2>Új programpont hozzáadása</h2>
                        <div className="form-group">
                            <label htmlFor="itemTitle">Cím *</label>
                            <input id="itemTitle" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemDate">Dátum *</label>
                            <input id="itemDate" type="date" value={date} onChange={e => setDate(e.target.value)} required min={tripStartDate} max={tripEndDate} />
                        </div>
                        <div className="time-inputs">
                             <div className="form-group">
                                <label htmlFor="itemStartTime">Kezdés *</label>
                                <input id="itemStartTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="itemEndTime">Befejezés (opcionális)</label>
                                <input id="itemEndTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                            </div>
                        </div>
                         <div className="form-group">
                            <label htmlFor="itemTimeZone">Időzóna *</label>
                            <input id="itemTimeZone" type="text" value={timeZone} onChange={e => setTimeZone(e.target.value)} required placeholder="pl. Europe/Paris" />
                            <small>Kérjük, IANA formátumot használjon.</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemLocation">Helyszín</label>
                            <input id="itemLocation" type="text" value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="itemDescription">Leírás</label>
                            <textarea id="itemDescription" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn btn-secondary">Mégse</button>
                            <button type="submit" className="btn btn-primary">Hozzáadás</button>
                        </div>
                    </form>
                ) : currentItem ? (
                     <div>
                        <div className="modal-header">
                            <h2>{currentItem.title}</h2>
                            <p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                <span>{new Date(currentItem.startDateTimeLocal).toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </p>
                            <p>
                                <strong>{formatTime(currentItem.startDateTimeLocal)}{currentItem.endDateTimeLocal ? ` - ${formatTime(currentItem.endDateTimeLocal)}` : ''}</strong> ({currentItem.timeZone})
                            </p>
                             {currentItem.location && <p><strong>Helyszín:</strong> {currentItem.location}</p>}
                        </div>
                        <div className="modal-body">
                           <p>{currentItem.description || 'Nincs leírás megadva.'}</p>
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn btn-primary">Bezárás</button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const TripItinerary = ({ trip, user, items, onAddItem, onRemoveItem }: { 
    trip: Trip,
    user: User,
    items: ItineraryItem[],
    onAddItem: (item: Omit<ItineraryItem, 'id'>) => void,
    onRemoveItem: (id: number) => void
}) => {
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);

    const isOrganizer = user.role === 'admin' || user.role === 'organizer';

    const tripDays = useMemo(() => {
        const days = [];
        let currentDate = new Date(trip.startDate + 'T00:00:00Z');
        const endDate = new Date(trip.endDate + 'T00:00:00Z');
        while (currentDate <= endDate) {
            days.push(new Date(currentDate));
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        return days;
    }, [trip.startDate, trip.endDate]);

    const itemsByDate = useMemo(() => {
        const grouped: Record<string, ItineraryItem[]> = {};
        items.forEach(item => {
            const date = item.startDateTimeLocal.split('T')[0];
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(item);
        });
        // Sort items within each day
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => a.startDateTimeLocal.localeCompare(b.startDateTimeLocal));
        });
        return grouped;
    }, [items]);
    
    const handleAddItem = (newItemData: Omit<ItineraryItem, 'id' | 'tripId'>) => {
        onAddItem({ ...newItemData, tripId: trip.id });
    };

    return (
        <div>
            <div className="itinerary-header">
                 <h2>Útiterv: {trip.name}</h2>
                 <div className="itinerary-controls">
                    <div className="itinerary-view-switcher">
                        <button className={viewMode === 'calendar' ? 'active' : ''} onClick={() => setViewMode('calendar')}>Naptár</button>
                        <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>Lista</button>
                    </div>
                 </div>
                 {isOrganizer && (
                    <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Új programpont
                    </button>
                )}
            </div>

            {items.length === 0 && (
                <div className="no-itinerary-items">
                    <p>Még nincsenek programpontok hozzáadva ehhez az utazáshoz.</p>
                </div>
            )}

            {viewMode === 'calendar' && items.length > 0 && (
                <div className="itinerary-calendar-view">
                    {tripDays.map(day => {
                        const dayString = day.toISOString().split('T')[0];
                        const dayItems = itemsByDate[dayString] || [];
                        return (
                            <div key={dayString} className="itinerary-day-column">
                                <h3>
                                    {day.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                                    <span className="day-of-week">{day.toLocaleDateString('hu-HU', { weekday: 'long' })}</span>
                                </h3>
                                {dayItems.map(item => (
                                    <div key={item.id} className="itinerary-item-card" onClick={() => setSelectedItem(item)}>
                                        {isOrganizer && (
                                            <button 
                                                className="delete-item-btn" 
                                                onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} 
                                                aria-label="Törlés"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        )}
                                        <h4>{item.title}</h4>
                                        <p className="item-time">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                            <span>{item.startDateTimeLocal.split('T')[1]} ({item.timeZone.split('/')[1]})</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
            
            {viewMode === 'list' && items.length > 0 && (
                 <div className="itinerary-list-view">
                    {Object.entries(itemsByDate)
                        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                        .map(([date, dateItems]) => (
                        <div key={date} className="itinerary-list-day-group">
                            <h3>{new Date(date + 'T00:00:00').toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                            {dateItems.map(item => (
                                <div key={item.id} className="itinerary-list-item">
                                    <div className="item-time-col">
                                        {item.startDateTimeLocal.split('T')[1]}
                                        {item.endDateTimeLocal && ` - ${item.endDateTimeLocal.split('T')[1]}`}
                                        <br/>
                                        <small>({item.timeZone})</small>
                                    </div>
                                    <div className="item-details-col">
                                        <h4>{item.title}</h4>
                                        <p>{item.location}</p>
                                    </div>
                                    <div className="item-actions">
                                        <button className="btn btn-secondary" onClick={() => setSelectedItem(item)}>Részletek</button>
                                         {isOrganizer && (
                                            <button 
                                                className="delete-item-btn" 
                                                onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} 
                                                aria-label="Törlés"
                                            >
                                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                 </div>
            )}

            <ItineraryItemModal
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onAdd={handleAddItem}
                tripStartDate={trip.startDate}
                tripEndDate={trip.endDate}
            />

            <ItineraryItemModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
                tripStartDate={trip.startDate}
                tripEndDate={trip.endDate}
            />
        </div>
    );
};

const UploadDocumentModal = ({ isOpen, onClose, onUpload, tripParticipants }: {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (doc: Omit<Document, 'id' | 'tripId' | 'uploadDate' | 'fileUrl'>) => void;
    tripParticipants: User[];
}) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(['all']);

    if (!isOpen) return null;

    const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = Array.from(e.target.selectedOptions, option => option.value);
        if (options.includes('all') && selectedUserIds.length < options.length) {
            setSelectedUserIds(['all']);
        } else if (options.length > 1 && options.includes('all')) {
            setSelectedUserIds(options.filter(id => id !== 'all'));
        }
        else {
            setSelectedUserIds(options);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !category) {
            alert("Kérjük, adjon nevet és kategóriát a dokumentumnak.");
            return;
        }

        const visibleTo: 'all' | number[] = selectedUserIds.includes('all')
            ? 'all'
            : selectedUserIds.map(Number);

        onUpload({ name, category, visibleTo });
        onClose();
        setName('');
        setCategory('');
        setSelectedUserIds(['all']);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Új dokumentum feltöltése</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="docName">Dokumentum neve</label>
                        <input id="docName" type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="docCategory">Kategória</label>
                        <input id="docCategory" type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="pl. Repjegyek, Szállás" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="docVisibleTo">Láthatóság</label>
                        <select id="docVisibleTo" multiple value={selectedUserIds} onChange={handleUserSelect} className="multi-select">
                            <option value="all">Mindenki</option>
                            {tripParticipants.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                        </select>
                         <small>Több felhasználó kijelöléséhez tartsa lenyomva a Ctrl/Cmd billentyűt.</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="docFile">Fájl kiválasztása</label>
                        <input id="docFile" type="file" />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Mégse</button>
                        <button type="submit" className="btn btn-primary">Feltöltés</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TripDocuments = ({ trip, user, documents, onAddDocument }: { 
    trip: Trip; 
    user: User;
    documents: Document[];
    onAddDocument: (doc: Omit<Document, 'id'>) => void;
}) => {
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    type SortableKeys = 'name' | 'category' | 'uploadDate';
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>({ key: 'uploadDate', direction: 'desc' });
    
    const tripParticipants = useMemo(() => {
        const participantIds = new Set([trip.organizerId, ...trip.travelerIds]);
        return USERS.filter(u => participantIds.has(u.id));
    }, [trip]);

    const handleUpload = (newDocData: Omit<Document, 'id' | 'tripId' | 'uploadDate' | 'fileUrl'>) => {
        onAddDocument({
            ...newDocData,
            tripId: trip.id,
            uploadDate: new Date().toISOString().split('T')[0],
            fileUrl: '#'
        });
    };
    
    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedDocuments = useMemo(() => {
        let sortableItems = [...documents];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [documents, sortConfig]);

    // Traveler View
    if (user.role === 'traveler') {
        const travelerVisibleDocs = documents.filter(doc => doc.visibleTo === 'all' || (Array.isArray(doc.visibleTo) && doc.visibleTo.includes(user.id)));
        const docsByCategory = travelerVisibleDocs.reduce((acc, doc) => {
            if (!acc[doc.category]) {
                acc[doc.category] = [];
            }
            acc[doc.category].push(doc);
            return acc;
        }, {} as Record<string, Document[]>);

        return (
             <div>
                <h2>Dokumentumok: {trip.name}</h2>
                {Object.keys(docsByCategory).length > 0 ? (
                    Object.entries(docsByCategory).map(([category, docs]) => (
                        <div key={category} className="document-category-group">
                            <h3>{category}</h3>
                            <ul className="document-list">
                                {docs.map(doc => (
                                    <li key={doc.id} className="document-item">
                                        <span>{doc.name}</span>
                                        <a href={doc.fileUrl} download className="btn btn-secondary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            Letöltés
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p>Nincsenek megosztott dokumentumok.</p>
                )}
            </div>
        )
    }

    // Admin & Organizer View
    return (
        <div>
            <div className="dashboard-header">
                <h2>Dokumentumok: {trip.name}</h2>
                <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Új dokumentum feltöltése
                </button>
            </div>
             <div className="table-container">
                <table className="documents-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('name')}>Név</th>
                            <th onClick={() => requestSort('category')}>Kategória</th>
                            <th onClick={() => requestSort('uploadDate')}>Feltöltés dátuma</th>
                            <th>Láthatóság</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDocuments.map(doc => {
                            let visibleToText: string;
                            if (Array.isArray(doc.visibleTo)) {
                                visibleToText = USERS.filter(u => doc.visibleTo.includes(u.id)).map(u => u.name).join(', ');
                            } else {
                                visibleToText = 'Mindenki';
                            }
                            return (
                                <tr key={doc.id}>
                                    <td>{doc.name}</td>
                                    <td>{doc.category}</td>
                                    <td>{doc.uploadDate}</td>
                                    <td>{visibleToText}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <UploadDocumentModal 
                isOpen={isUploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onUpload={handleUpload}
                tripParticipants={tripParticipants}
            />
        </div>
    );
};

const TripPersonalData = ({ trip, user, records, configs, onUpdateRecord, onToggleLock }: {
    trip: Trip;
    user: User;
    records: PersonalDataRecord[];
    configs: PersonalDataFieldConfig[];
    onUpdateRecord: (record: Omit<PersonalDataRecord, 'isLocked'>) => void;
    onToggleLock: (userId: number, fieldId: string, tripId: number) => void;
}) => {

    const tripParticipants = useMemo(() => {
        const participantIds = new Set(trip.travelerIds);
        return USERS.filter(u => participantIds.has(u.id));
    }, [trip]);

    // Traveler View
    if (user.role === 'traveler') {
        const [formData, setFormData] = useState<Record<string, string>>(() => {
            const data: Record<string, string> = {};
            configs.forEach(config => {
                const record = records.find(r => r.userId === user.id && r.fieldId === config.id);
                data[config.id] = record?.value || '';
            });
            return data;
        });

        const handleChange = (fieldId: string, value: string) => {
            setFormData(prev => ({ ...prev, [fieldId]: value }));
        };

        const handleFileChange = (fieldId: string, file: File | null) => {
            if (file) {
                 onUpdateRecord({ userId: user.id, tripId: trip.id, fieldId, value: file.name });
            }
        };

        const handleBlur = (fieldId: string) => {
            onUpdateRecord({ userId: user.id, tripId: trip.id, fieldId, value: formData[fieldId] });
        };
        
        return (
            <div className="personal-data-page">
                <h2>Személyes adatok a(z) {trip.name} utazáshoz</h2>
                <p>Kérjük, töltse ki az alábbi mezőket a foglalások véglegesítéséhez.</p>
                <form className="personal-data-form">
                    {configs.map(config => {
                        const record = records.find(r => r.userId === user.id && r.fieldId === config.id);
                        const isLocked = record?.isLocked || false;
                        
                        return (
                            <div className="form-group" key={config.id}>
                                <label htmlFor={config.id}>{config.label}</label>
                                {config.type === 'file' ? (
                                    <div>
                                        <input 
                                            id={config.id} 
                                            type="file" 
                                            onChange={(e) => handleFileChange(config.id, e.target.files ? e.target.files[0] : null)}
                                            disabled={isLocked}
                                        />
                                        {formData[config.id] && <p className="file-info">Feltöltve: {formData[config.id]}</p>}
                                    </div>
                                ) : (
                                     <input
                                        id={config.id}
                                        type={config.type}
                                        value={formData[config.id] || ''}
                                        onChange={(e) => handleChange(config.id, e.target.value)}
                                        onBlur={() => handleBlur(config.id)}
                                        readOnly={isLocked}
                                        placeholder={isLocked ? 'Zárolva' : ''}
                                    />
                                )}
                            </div>
                        )
                    })}
                </form>
            </div>
        )
    }

    // Admin & Organizer View
    return (
        <div className="personal-data-page">
            <h2>Résztvevők személyes adatai: {trip.name}</h2>
            {tripParticipants.length === 0 ? <p>Nincsenek utazók ehhez az utazáshoz.</p> : (
            <div className="personal-data-grid">
                {tripParticipants.map(participant => (
                    <div key={participant.id} className="participant-data-card">
                        <h3>{participant.name}</h3>
                        {configs.map(config => {
                            const record = records.find(r => r.userId === participant.id && r.fieldId === config.id);
                            return (
                                <div key={config.id} className="data-field-group">
                                    <div className="data-field-header">
                                        <label>{config.label}</label>
                                        <button 
                                            className="lock-btn" 
                                            onClick={() => onToggleLock(participant.id, config.id, trip.id)}
                                            aria-label={record?.isLocked ? 'Mező feloldása' : 'Mező zárolása'}
                                        >
                                            {record?.isLocked ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                            )}
                                        </button>
                                    </div>
                                    {config.type === 'file' ? (
                                        record?.value ? <a href="#" className="file-link">{record.value}</a> : <p className="data-value empty">Nincs feltöltve</p>
                                    ) : (
                                        <p className={`data-value ${!record?.value ? 'empty' : ''}`}>{record?.value || 'Nincs megadva'}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
            )}
        </div>
    );
}


const Sidebar = ({ 
    trips, 
    selectedTripId, 
    activeView, 
    onSelectTrip, 
    onSelectView, 
    onShowTrips,
    isOpen
}: { 
    trips: Trip[],
    selectedTripId: number | null,
    activeView: TripView,
    onSelectTrip: (id: number) => void,
    onSelectView: (view: TripView) => void,
    onShowTrips: () => void,
    isOpen: boolean
}) => {
    
    const tripNavItems: { key: TripView; label: string }[] = [
        { key: 'summary', label: 'Összegzés' },
        { key: 'itinerary', label: 'Útiterv' },
        { key: 'financials', label: 'Pénzügyek' },
        { key: 'personalData', label: 'Személyes adatok' },
        { key: 'documents', label: 'Dokumentumok' },
    ];
    
    return (
        <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
            <nav>
                <ul className="main-nav-list">
                    <li className="nav-item">
                        <a href="#" onClick={(e) => { e.preventDefault(); onShowTrips(); }} className={!selectedTripId ? 'active' : ''}>
                           Utazásaink
                        </a>
                    </li>
                    {trips.map(trip => (
                        <li key={trip.id} className={`trip-item ${trip.id === selectedTripId ? 'active' : ''}`}>
                            <a href="#" onClick={(e) => { e.preventDefault(); onSelectTrip(trip.id); }}>
                                {trip.name}
                            </a>
                            {trip.id === selectedTripId && (
                                <ul className="trip-submenu">
                                    {tripNavItems.map(item => (
                                        <li key={item.key}>
                                            <a 
                                                href="#" 
                                                onClick={(e) => { e.preventDefault(); onSelectView(item.key); }} 
                                                className={activeView === item.key ? 'active' : ''}
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};


const Dashboard = ({ 
    user, trips, onLogout, onCreateTrip, 
    financialRecords, onAddFinancialRecord, 
    documents, onAddDocument, 
    personalDataConfigs, personalDataRecords, onUpdatePersonalData, onTogglePersonalDataLock,
    itineraryItems, onAddItineraryItem, onRemoveItineraryItem,
    theme, onThemeChange 
}: { 
    user: User, 
    trips: Trip[], 
    onLogout: () => void, 
    onCreateTrip: (trip: Trip) => void,
    financialRecords: FinancialRecord[],
    onAddFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => void,
    documents: Document[],
    onAddDocument: (doc: Omit<Document, 'id'>) => void,
    personalDataConfigs: PersonalDataFieldConfig[],
    personalDataRecords: PersonalDataRecord[],
    onUpdatePersonalData: (record: Omit<PersonalDataRecord, 'isLocked'>) => void,
    onTogglePersonalDataLock: (userId: number, fieldId: string, tripId: number) => void,
    itineraryItems: ItineraryItem[],
    onAddItineraryItem: (item: Omit<ItineraryItem, 'id'>) => void,
    onRemoveItineraryItem: (id: number) => void,
    theme: Theme,
    onThemeChange: (theme: Theme) => void
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [activeTripView, setActiveTripView] = useState<TripView>('summary');
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    
  const visibleTrips = useMemo<Trip[]>(() => {
    switch(user.role) {
      case 'admin':
        return trips;
      case 'organizer':
        return trips.filter((trip: Trip) => trip.organizerId === user.id);
      case 'traveler':
        return trips.filter((trip: Trip) => trip.travelerIds.includes(user.id));
      default:
        return [];
    }
  }, [user, trips]);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find(t => t.id === selectedTripId);
  }, [selectedTripId, trips]);

  const tripFinancialRecords = useMemo(() => {
      if (!selectedTripId) return [];
      return financialRecords.filter(r => r.tripId === selectedTripId);
  }, [selectedTripId, financialRecords]);
  
  const tripDocuments = useMemo(() => {
      if (!selectedTripId) return [];
      return documents.filter(d => d.tripId === selectedTripId);
  }, [selectedTripId, documents]);

  const tripPersonalDataConfigs = useMemo(() => {
      if (!selectedTripId) return [];
      return personalDataConfigs.filter(c => c.tripId === selectedTripId);
  }, [selectedTripId, personalDataConfigs]);

  const tripPersonalDataRecords = useMemo(() => {
      if (!selectedTripId) return [];
      return personalDataRecords.filter(r => r.tripId === selectedTripId);
  }, [selectedTripId, personalDataRecords]);
  
  const tripItineraryItems = useMemo(() => {
      if (!selectedTripId) return [];
      return itineraryItems.filter(i => i.tripId === selectedTripId);
  }, [selectedTripId, itineraryItems]);

  const handleCreateTrip = (newTripData: Omit<Trip, 'id'>) => {
    const newTrip: Trip = {
        ...newTripData,
        id: Date.now(), // simple unique id
    };
    onCreateTrip(newTrip);
    alert(`Meghívó link a(z) "${newTrip.name}" utazáshoz:\n/invite?trip=${newTrip.id}&token=mock_token`);
  };
  
  const handleSelectTrip = (tripId: number) => {
    setSelectedTripId(tripId);
    setActiveTripView('summary');
    setMobileSidebarOpen(false); // Close mobile menu on selection
  };

  const handleSelectView = (view: TripView) => {
    setActiveTripView(view);
    setMobileSidebarOpen(false); // Close mobile menu on selection
  };

  const handleShowTrips = () => {
    setSelectedTripId(null);
    setMobileSidebarOpen(false); // Close mobile menu on selection
  }
  
  const organizers = USERS.filter(u => u.role === 'organizer');
  
  const renderContent = () => {
    if (selectedTrip) {
        switch (activeTripView) {
            case 'summary': return <TripSummary trip={selectedTrip} />;
            case 'financials': return <TripFinancials trip={selectedTrip} user={user} records={tripFinancialRecords} users={USERS} onAddRecord={onAddFinancialRecord} />;
            case 'itinerary': return <TripItinerary trip={selectedTrip} user={user} items={tripItineraryItems} onAddItem={onAddItineraryItem} onRemoveItem={onRemoveItineraryItem} />;
            case 'documents': return <TripDocuments trip={selectedTrip} user={user} documents={tripDocuments} onAddDocument={onAddDocument} />;
            case 'personalData': return <TripPersonalData trip={selectedTrip} user={user} configs={tripPersonalDataConfigs} records={tripPersonalDataRecords} onUpdateRecord={onUpdatePersonalData} onToggleLock={onTogglePersonalDataLock} />;
            default: return <h2>Válasszon nézetet</h2>;
        }
    }
    
    return (
        <>
            <div className="dashboard-header">
                <h2>Utazásaid</h2>
                {user.role === 'admin' && (
                <button onClick={() => setModalOpen(true)} className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>Új utazás létrehozása</span>
                </button>
                )}
            </div>
            <div className="trip-list">
                {visibleTrips.length > 0 ? (
                visibleTrips.map(trip => 
                    <TripCard 
                        key={trip.id} 
                        trip={trip} 
                        onSelectTrip={() => handleSelectTrip(trip.id)}
                    />)
                ) : (
                <p className="no-trips">Nincsenek megjeleníthető utazások.</p>
                )}
            </div>
        </>
    );
  };

  return (
     <div className={`dashboard-layout with-sidebar ${isMobileSidebarOpen ? 'sidebar-is-open' : ''}`}>
        <Sidebar 
            trips={visibleTrips}
            selectedTripId={selectedTripId}
            activeView={activeTripView}
            onSelectTrip={handleSelectTrip}
            onSelectView={handleSelectView}
            onShowTrips={handleShowTrips}
            isOpen={isMobileSidebarOpen}
        />
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
        <div className="dashboard-container">
          <Header 
            user={user} 
            onLogout={onLogout} 
            onToggleSidebar={() => setMobileSidebarOpen(true)} 
            showHamburger={true}
            theme={theme}
            onThemeChange={onThemeChange}
          />
          <main className="dashboard-content">
            {renderContent()}
          </main>
          {user.role === 'admin' && (
            <CreateTripModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onCreate={handleCreateTrip}
                organizers={organizers}
            />
          )}
        </div>
    </div>
  );
};


const App = () => {
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);

  // Load trips from backend MongoDB if available
  useEffect(() => {
    fetch('/api/trips')
      .then(res => res.json())
      .then(data => setTrips(data))
      .catch(err => console.error('Failed to fetch trips', err));
  }, []);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>(INITIAL_FINANCIAL_RECORDS);
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCUMENTS);
  const [personalDataRecords, setPersonalDataRecords] = useState<PersonalDataRecord[]>(INITIAL_PERSONAL_DATA_RECORDS);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>(INITIAL_ITINERARY_ITEMS);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'auto');

  useEffect(() => {
    const applyTheme = (t: Theme) => {
        if (t === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', t);
        }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (theme === 'auto') {
            applyTheme('auto');
        }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  const handleLogin = (role: Role) => {
    setCurrentUserRole(role);
  };

  const handleLogout = () => {
    setCurrentUserRole(null);
  };
  
  const handleCreateTrip = (newTrip: Trip) => {
    setTrips(prevTrips => [...prevTrips, newTrip]);
  };

  const handleAddFinancialRecord = (newRecordData: Omit<FinancialRecord, 'id'>) => {
    const newRecord: FinancialRecord = { ...newRecordData, id: Date.now() };
    setFinancialRecords(prev => [...prev, newRecord]);
  };
  
  const handleAddDocument = (newDocData: Omit<Document, 'id'>) => {
      const newDoc: Document = { ...newDocData, id: Date.now() };
      setDocuments(prev => [...prev, newDoc]);
  }

  const handleUpdatePersonalData = (updatedRecord: Omit<PersonalDataRecord, 'isLocked'>) => {
      setPersonalDataRecords(prev => {
          const existingIndex = prev.findIndex(r => r.userId === updatedRecord.userId && r.tripId === updatedRecord.tripId && r.fieldId === updatedRecord.fieldId);
          if (existingIndex > -1) {
              const newRecords = [...prev];
              // Preserve the existing isLocked value, only update the value
              newRecords[existingIndex] = { ...newRecords[existingIndex], value: updatedRecord.value };
              return newRecords;
          } else {
              // It's a new record, so add it with isLocked defaulting to false
              return [...prev, { ...updatedRecord, isLocked: false }];
          }
      });
  };

  const handleTogglePersonalDataLock = (userId: number, fieldId: string, tripId: number) => {
      setPersonalDataRecords(prev =>
          prev.map(record => {
              if (record.userId === userId && record.fieldId === fieldId && record.tripId === tripId) {
                  return { ...record, isLocked: !record.isLocked };
              }
              return record;
          })
      );
  };

  const handleAddItineraryItem = (newItemData: Omit<ItineraryItem, 'id'>) => {
    const newItem: ItineraryItem = { ...newItemData, id: Date.now() };
    setItineraryItems(prev => [...prev, newItem]);
  };

  const handleRemoveItineraryItem = (idToRemove: number) => {
      setItineraryItems(prev => prev.filter(item => item.id !== idToRemove));
  };
  
  const currentUser = useMemo(() => {
    if (!currentUserRole) return null;
    return USERS.find(u => u.role === currentUserRole);
  }, [currentUserRole]);

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      user={currentUser}
      trips={trips}
      onLogout={handleLogout}
      onCreateTrip={handleCreateTrip}
      financialRecords={financialRecords}
      onAddFinancialRecord={handleAddFinancialRecord}
      documents={documents}
      onAddDocument={handleAddDocument}
      personalDataConfigs={PERSONAL_DATA_FIELD_CONFIGS}
      personalDataRecords={personalDataRecords}
      onUpdatePersonalData={handleUpdatePersonalData}
      onTogglePersonalDataLock={handleTogglePersonalDataLock}
      itineraryItems={itineraryItems}
      onAddItineraryItem={handleAddItineraryItem}
      onRemoveItineraryItem={handleRemoveItineraryItem}
      theme={theme}
      onThemeChange={setTheme}
    />
  );
};


const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
