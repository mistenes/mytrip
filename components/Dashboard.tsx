import React, { useState, useEffect, useMemo } from "react";
import { API_BASE } from "../api";
import { User, Trip, FinancialRecord, Document, PersonalDataFieldConfig, PersonalDataRecord, ItineraryItem, Role, TripView, Theme } from "../types";
import "../styles/dashboard.css";
import "../styles/user-management.css";

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
         <h1 className="logo">myTrip</h1>
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
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (trip: Trip) => void;
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [organizerId, setOrganizerId] = useState('');
  const [organizers, setOrganizers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_BASE}/api/users`)
        .then(res => res.json())
        .then(users => setOrganizers(users.filter((u: any) => u.role === 'organizer')));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate || !organizerId) {
      alert('Kérjük, töltsön ki minden mezőt.');
      return;
    }
    const tripRes = await fetch(`${API_BASE}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate, organizerIds: [organizerId], travelerIds: [] })
    });
    const trip = await tripRes.json();
    const selectedOrganizer = organizers.find(o => o._id === organizerId);
    onCreated({ id: trip._id, name: trip.name, startDate: trip.startDate, endDate: trip.endDate, organizerIds: [organizerId], organizerNames: selectedOrganizer ? [selectedOrganizer.name] : [], travelerIds: trip.travelerIds || [] });
    onClose();
    setName(''); setStartDate(''); setEndDate(''); setOrganizerId('');
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
            <select id="organizer" value={organizerId} onChange={e => setOrganizerId(e.target.value)} required>
              <option value="">Válasszon szervezőt</option>
              {organizers.map(o => (
                <option key={o._id} value={o._id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Mégse</button>
            <button type="submit" className="btn btn-primary">Létrehozás</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TripUserManagement = ({ trip, users, currentUser, onChange }: { trip: Trip; users: User[]; currentUser: User; onChange: () => void }) => {
  const organizers = users.filter(u => trip.organizerIds.includes(u.id));
  const travelers = users.filter(u => trip.travelerIds.includes(u.id));
  const availableOrganizers = users.filter(u => u.role === 'organizer' && !trip.organizerIds.includes(u.id));
  const availableTravelers = users.filter(u => u.role === 'traveler' && !trip.travelerIds.includes(u.id));
  const [newOrganizer, setNewOrganizer] = useState('');
  const [newTraveler, setNewTraveler] = useState('');

  const canManageOrganizers = currentUser.role === 'admin';
  const isOrganizerOfTrip = trip.organizerIds.includes(currentUser.id);
  const canManageTravelers = currentUser.role === 'admin' || (currentUser.role === 'organizer' && isOrganizerOfTrip);

  const addOrganizer = async () => {
    if (!newOrganizer) return;
    await fetch(`${API_BASE}/api/trips/${trip.id}/organizers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newOrganizer })
    });
    setNewOrganizer('');
    onChange();
  };

  const removeOrganizer = async (id: string) => {
    await fetch(`${API_BASE}/api/trips/${trip.id}/organizers/${id}`, { method: 'DELETE' });
    onChange();
  };

  const addTraveler = async () => {
    if (!newTraveler) return;
    await fetch(`${API_BASE}/api/trips/${trip.id}/travelers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: newTraveler })
    });
    setNewTraveler('');
    onChange();
  };

  const removeTraveler = async (id: string) => {
    await fetch(`${API_BASE}/api/trips/${trip.id}/travelers/${id}`, { method: 'DELETE' });
    onChange();
  };

  return (
    <div className="trip-user-management">
      <h2>Felhasználók: {trip.name}</h2>
      <div className="trip-users-section">
        <h3>Szervezők</h3>
        <ul>
          {organizers.map(o => (
            <li key={o.id}>
              {o.name}
              {canManageOrganizers && o.id !== currentUser.id && organizers.length > 1 && (
                <button className="btn btn-danger btn-small" onClick={() => removeOrganizer(o.id)}>Eltávolítás</button>
              )}
            </li>
          ))}
        </ul>
        {canManageOrganizers && (
          <div className="assign-row">
            <select value={newOrganizer} onChange={e => setNewOrganizer(e.target.value)}>
              <option value="">Szervező hozzáadása</option>
              {availableOrganizers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <button className="btn btn-secondary btn-small" onClick={addOrganizer}>Hozzáadás</button>
          </div>
        )}
      </div>
      <div className="trip-users-section">
        <h3>Utazók</h3>
        <ul>
          {travelers.map(t => (
            <li key={t.id}>
              {t.name}
              {canManageTravelers && (
                <button className="btn btn-danger btn-small" onClick={() => removeTraveler(t.id)}>Eltávolítás</button>
              )}
            </li>
          ))}
        </ul>
        {canManageTravelers && (
          <div className="assign-row">
            <select value={newTraveler} onChange={e => setNewTraveler(e.target.value)}>
              <option value="">Utazó hozzáadása</option>
              {availableTravelers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button className="btn btn-secondary btn-small" onClick={addTraveler}>Hozzáadás</button>
          </div>
        )}
      </div>
    </div>
  );
};

const TripSettings = ({ trip, user, onDeleted }: { trip: Trip; user: User; onDeleted: () => void }) => {
  const canDelete = user.role === 'admin' || (user.role === 'organizer' && trip.organizerIds.includes(String(user.id)));
  if (!canDelete) {
    return <p>Nincs jogosultsága a beállításokhoz.</p>;
  }
  const handleDelete = async () => {
    if (!window.confirm('Biztosan törli az utazást?')) return;
    if (!window.confirm('A művelet nem vonható vissza. Folytatja?')) return;
    await fetch(`${API_BASE}/api/trips/${trip.id}`, { method: 'DELETE' });
    onDeleted();
  };
  return (
    <div className="trip-settings">
      <h2>Beállítások: {trip.name}</h2>
      <button className="btn btn-danger" onClick={handleDelete}>Utazás törlése</button>
    </div>
  );
};

const InviteUserModal = ({
  isOpen,
  onClose,
  trips,
  onSent,
  currentUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  onSent: () => void;
  currentUser: User;
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('traveler');
  const [tripId, setTripId] = useState<string>('');
  const [invites, setInvites] = useState<any[]>([]);

  const isOrganizer = currentUser.role === 'organizer';
  const availableTrips = isOrganizer ? trips.filter(t => t.organizerIds.includes(currentUser.id)) : trips;

  const loadInvites = () => {
    fetch(`${API_BASE}/api/invitations`).then(res => res.json()).then(setInvites);
  };

  useEffect(() => {
    if (isOpen) {
      loadInvites();
      if (isOrganizer) {
        setRole('traveler');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: isOrganizer ? 'traveler' : role, tripId: tripId || undefined })
    });
    if (res.status === 409) {
      alert('Ehhez az e-mailhez már van meghívó. Küldje újra a Felhasználók oldalon.');
      return;
    }
    if (!res.ok) {
      alert('Hiba történt a meghívó küldésekor.');
      return;
    }
    alert('Meghívó elküldve');
    onSent();
    loadInvites();
    onClose();
    setEmail('');
    setTripId('');
    setRole('traveler');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Meghívó küldése</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="inviteEmail">E-mail</label>
            <input id="inviteEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {!isOrganizer && (
            <div className="form-group">
              <label htmlFor="inviteRole">Szerep</label>
              <select id="inviteRole" value={role} onChange={e => setRole(e.target.value as Role)}>
                <option value="organizer">Szervező</option>
                <option value="traveler">Utazó</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="inviteTrip">Utazás{isOrganizer ? '' : ' (opcionális)'}</label>
            <select id="inviteTrip" value={tripId} onChange={e => setTripId(e.target.value)} required={isOrganizer}>
              {!isOrganizer && <option value="">Nincs</option>}
              {availableTrips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Mégse</button>
            <button type="submit" className="btn btn-primary">Meghívás</button>
          </div>
        </form>
        {invites.length > 0 && (
          <div className="pending-invites">
            <h3>Függő meghívók</h3>
            <table className="user-table">
              <thead>
                <tr><th>E-mail</th><th>Szerep</th><th>Utazás</th><th>Lejárat</th></tr>
              </thead>
              <tbody>
                {invites.map((inv: any) => (
                  <tr key={inv._id}>
                    <td>{inv.email}</td>
                    <td>{inv.role}</td>
                    <td>{availableTrips.find(t => t.id === inv.tripId)?.name || '-'}</td>
                    <td>{new Date(inv.expiresAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const UserManagement = ({ onInvite, trips, users, refreshKey, onUsersChanged }: { onInvite: () => void; trips: Trip[]; users: any[]; refreshKey: number; onUsersChanged: () => void; }) => {
  const [invites, setInvites] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [assignTripId, setAssignTripId] = useState('');

  const loadInvites = () => {
    fetch(`${API_BASE}/api/invitations`).then(res => res.json()).then(setInvites);
  };

  useEffect(() => {
    loadInvites();
  }, [refreshKey]);

  const handleResend = async (id: string) => {
    await fetch(`${API_BASE}/api/invitations/${id}/resend`, { method: 'POST' });
    loadInvites();
  };

  const handleDeleteInvite = async (id: string) => {
    if (!window.confirm('Biztosan törli a meghívót?')) return;
    await fetch(`${API_BASE}/api/invitations/${id}`, { method: 'DELETE' });
    loadInvites();
  };

  const organizers = users.filter(u => u.role === 'organizer');
  const others = users.filter(u => u.role !== 'organizer');

  const userTrips = selectedUser ? trips.filter(t => t.organizerIds.includes(selectedUser._id) || t.travelerIds.includes(selectedUser._id)) : [];

  const handleAssignOrganizer = async () => {
    if (!selectedUser || !assignTripId) return;
    await fetch(`${API_BASE}/api/trips/${assignTripId}/organizers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedUser._id })
    });
    setAssignTripId('');
    onUsersChanged();
  };

  const handleRemoveFromTrip = async (tripId: string) => {
    if (!selectedUser) return;
    const path = selectedUser.role === 'organizer'
      ? `/api/trips/${tripId}/organizers/${selectedUser._id}`
      : `/api/trips/${tripId}/travelers/${selectedUser._id}`;
    await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
    onUsersChanged();
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!window.confirm('Biztosan törli a felhasználót?')) return;
    await fetch(`${API_BASE}/api/users/${selectedUser._id}`, { method: 'DELETE' });
    setSelectedUser(null);
    onUsersChanged();
  };

  return (
    <div className="user-management">
      <div className="dashboard-header">
        <h2>Felhasználók</h2>
        <button onClick={onInvite} className="btn btn-secondary">Meghívó küldése</button>
      </div>

      <h3>Szervezők ({organizers.length})</h3>
      {organizers.length > 0 ? (
        <div className="user-tiles">
          {organizers.map((u: any) => (
            <div
              key={u._id}
              className={`user-tile organizer${selectedUser?._id === u._id ? ' selected' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="user-name">{u.name}</div>
              <div className="user-role">Szervező</div>
            </div>
          ))}
        </div>
      ) : <p>Nincsenek szervezők.</p>}

      <h3>Egyéb felhasználók ({others.length})</h3>
      {others.length > 0 ? (
        <div className="user-tiles">
          {others.map((u: any) => (
            <div
              key={u._id}
              className={`user-tile ${u.role}${selectedUser?._id === u._id ? ' selected' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="user-name">{u.name}</div>
              <div className="user-role">{u.role}</div>
            </div>
          ))}
        </div>
      ) : <p className="no-users">Nincsenek felhasználók.</p>}

      {selectedUser && (
        <div className="user-detail">
          <h3>{selectedUser.name}</h3>
          {userTrips.length > 0 ? (
            <ul>
              {userTrips.map(t => (
                <li key={t.id}>{t.name} <button className="btn btn-danger btn-small" onClick={() => handleRemoveFromTrip(t.id)}>Eltávolítás</button></li>
              ))}
            </ul>
          ) : <p>Nincs hozzárendelve utazáshoz.</p>}
          {selectedUser.role === 'organizer' && (
            <div className="assign-trip">
              <select value={assignTripId} onChange={e => setAssignTripId(e.target.value)}>
                <option value="">Utazás hozzárendelése</option>
                {trips.filter(t => !t.organizerIds.includes(selectedUser._id)).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button className="btn btn-secondary btn-small" onClick={handleAssignOrganizer}>Hozzárendelés</button>
            </div>
          )}
          <button className="btn btn-danger" onClick={handleDeleteUser}>Felhasználó törlése</button>
        </div>
      )}

      {invites.length > 0 && (
        <div className="pending-invites">
          <h3>Függő meghívók</h3>
          <table className="user-table">
            <thead>
              <tr><th>E-mail</th><th>Szerep</th><th>Utazás</th><th>Lejárat</th><th>Műveletek</th></tr>
            </thead>
            <tbody>
              {invites.map((inv: any) => (
                <tr key={inv._id}>
                  <td>{inv.email}</td>
                  <td>{inv.role}</td>
                  <td>{trips.find(t => t.id === inv.tripId)?.name || '-'}</td>
                  <td>{new Date(inv.expiresAt).toLocaleDateString()}</td>
                  <td>
                    <div className="invite-actions">
                      <button className="btn btn-secondary btn-small" onClick={() => handleResend(inv._id)}>Újraküldés</button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDeleteInvite(inv._id)}>Törlés</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TripCard = ({ trip, onSelectTrip }: { trip: Trip; onSelectTrip: () => void; }) => {
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
                        <span><strong>Szervező:</strong> {trip.organizerNames?.join(', ') || 'Ismeretlen'}</span>
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
    return (
        <div>
            <h2>Összegzés: {trip.name}</h2>
            <p><strong>Időpont:</strong> {trip.startDate} - {trip.endDate}</p>
            <p><strong>Szervező:</strong> {trip.organizerNames?.join(', ') || 'Ismeretlen'}</p>
            <p><strong>Utazók:</strong> {trip.travelerIds.length}</p>
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
        const participantIds = new Set([...trip.organizerIds, ...trip.travelerIds]);
        return users.filter(u => participantIds.has(u.id));
    }, [trip, users]);

    const balances = useMemo(() => {
        const userBalances = new Map<string, number>();
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

const TripDocuments = ({ trip, user, documents, onAddDocument, users }: {
    trip: Trip;
    user: User;
    documents: Document[];
    onAddDocument: (doc: Omit<Document, 'id'>) => void;
    users: User[];
}) => {
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    type SortableKeys = 'name' | 'category' | 'uploadDate';
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>({ key: 'uploadDate', direction: 'desc' });
    
    const tripParticipants = useMemo(() => {
        const participantIds = new Set([...trip.organizerIds, ...trip.travelerIds]);
        return users.filter(u => participantIds.has(u.id));
    }, [trip, users]);

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
                                visibleToText = users.filter(u => doc.visibleTo.includes(u.id)).map(u => u.name).join(', ');
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

const TripPersonalData = ({ trip, user, records, configs, onUpdateRecord, onToggleLock, onUpsertConfig, onRemoveConfig, users }: {
    trip: Trip;
    user: User;
    records: PersonalDataRecord[];
    configs: PersonalDataFieldConfig[];
    onUpdateRecord: (record: Omit<PersonalDataRecord, 'isLocked'>) => void;
    onToggleLock: (userId: string, fieldId: string) => void;
    onUpsertConfig: (config: PersonalDataFieldConfig) => void;
    onRemoveConfig: (id: string, tripId: string) => void;
    users: User[];
}) => {

    const tripParticipants = useMemo(() => {
        const participantIds = new Set(trip.travelerIds);
        return users.filter(u => participantIds.has(u.id));
    }, [trip, users]);

    // Traveler View
    if (user.role === 'traveler') {
        const [formData, setFormData] = useState<Record<string, string>>(() => {
            const data: Record<string, string> = {};
            configs.filter(c => c.enabled !== false).forEach(config => {
                const record = records.find(r => r.userId === user.id && r.fieldId === config.id);
                data[config.id] = record?.value || '';
            });
            return data;
        });

        const handleChange = (fieldId: string, value: string) => {
            setFormData(prev => ({ ...prev, [fieldId]: value }));
        };

        const handleFileChange = async (fieldId: string, file: File | null) => {
            if (file) {
                const formDataData = new FormData();
                formDataData.append('file', file);
                await fetch(`${API_BASE}/api/users/${user.id}/personal-data/${fieldId}/file`, {
                    method: 'POST',
                    body: formDataData
                }).catch(() => {});
                onUpdateRecord({ userId: user.id, fieldId, value: file.name });
            }
        };

        const handleBlur = (fieldId: string) => {
            onUpdateRecord({ userId: user.id, fieldId, value: formData[fieldId] });
        };

        const handleSave = () => {
            Object.entries(formData).forEach(([fieldId, value]) => {
                onUpdateRecord({ userId: user.id, fieldId, value });
            });
        };
        
        return (
            <div className="personal-data-page">
                <h2>Személyes adatok a(z) {trip.name} utazáshoz</h2>
                <p>Kérjük, töltse ki az alábbi mezőket a foglalások véglegesítéséhez.</p>
                <form className="personal-data-form">
                    <div className="personal-data-grid">
                        {configs.filter(c => c.enabled !== false).slice().sort((a,b)=>(a.order||0)-(b.order||0)).map(config => {
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
                    </div>
                    <div className="personal-data-actions">
                        <button type="button" className="btn btn-primary" onClick={handleSave}>Mentés</button>
                    </div>
                </form>
            </div>
        )
    }

    // Admin & Organizer View
    const [selectedTravelerId, setSelectedTravelerId] = useState<string>(() => tripParticipants[0]?.id || "");

    useEffect(() => {
        if (tripParticipants.length > 0 && !tripParticipants.find(p => p.id === selectedTravelerId)) {
            setSelectedTravelerId(tripParticipants[0].id);
        }
    }, [tripParticipants, selectedTravelerId]);

    const BASIC_FIELD_IDS = ['firstName','lastName','dateOfBirth','passportNumber','issueDate','issuingCountry','expiryDate','nationality','sex'];

    const [localConfigs, setLocalConfigs] = useState<PersonalDataFieldConfig[]>([]);
    const [availableFields, setAvailableFields] = useState<PersonalDataFieldConfig[]>([]);
    useEffect(() => {
        const relevant = configs.filter(c => c.tripId === trip.id || c.tripId === 'default');
        const map = new Map<string, PersonalDataFieldConfig>();
        relevant.forEach(c => {
            if (c.tripId === trip.id || !map.has(c.id)) {
                map.set(c.id, c);
            }
        });
        const merged = Array.from(map.values());
        setLocalConfigs(merged.filter(c => c.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0)));
        setAvailableFields(merged.filter(c => c.enabled === false && BASIC_FIELD_IDS.includes(c.id)).sort((a,b)=>(a.order||0)-(b.order||0)));
    }, [configs, trip.id]);

    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldType, setNewFieldType] = useState<'text' | 'date' | 'file'>('text');

    const handleAddField = () => {
        const id = newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (!id) return;
        fetch(`${API_BASE}/api/field-config/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: newFieldLabel, type: newFieldType, enabled: true, locked: false, tripId: trip.id, order: localConfigs.length + 1 })
        }).then(res => res.json()).then(c => {
            onUpsertConfig({ id: c.field, tripId: String(c.tripId), label: c.label, type: c.type, enabled: c.enabled, locked: c.locked, order: c.order });
            setNewFieldLabel('');
            setNewFieldType('text');
        }).catch(() => {});
    };

    const handleEnableField = (cfg: PersonalDataFieldConfig) => {
        fetch(`${API_BASE}/api/field-config/${cfg.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: cfg.label, type: cfg.type, enabled: true, locked: cfg.locked, tripId: trip.id, order: localConfigs.length + 1 })
        }).then(res => res.json()).then(c => {
            onUpsertConfig({ id: c.field, tripId: String(c.tripId), label: c.label, type: c.type, enabled: c.enabled, locked: c.locked, order: c.order });
        }).catch(() => {});
    };

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editType, setEditType] = useState<'text' | 'date' | 'file'>('text');

    const startEdit = (cfg: PersonalDataFieldConfig) => {
        setEditingId(cfg.id);
        setEditLabel(cfg.label);
        setEditType(cfg.type);
    };

    const saveEdit = (cfg: PersonalDataFieldConfig) => {
        fetch(`${API_BASE}/api/field-config/${cfg.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: editLabel, type: editType, enabled: true, locked: cfg.locked, tripId: trip.id, order: cfg.order })
        }).then(res => res.json()).then(c => {
            onUpsertConfig({ id: c.field, tripId: String(c.tripId), label: c.label, type: c.type, enabled: c.enabled, locked: c.locked, order: c.order });
            setEditingId(null);
        }).catch(() => {});
    };

    const cancelEdit = () => setEditingId(null);

    const handleDeleteField = (cfg: PersonalDataFieldConfig) => {
        if (cfg.locked) return;
        if (BASIC_FIELD_IDS.includes(cfg.id)) {
            fetch(`${API_BASE}/api/field-config/${cfg.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: cfg.label, type: cfg.type, enabled: false, locked: cfg.locked, tripId: trip.id, order: cfg.order })
            }).then(res => res.json()).then(c => {
                onUpsertConfig({ id: c.field, tripId: String(c.tripId), label: c.label, type: c.type, enabled: c.enabled, locked: c.locked, order: c.order });
            }).catch(() => {});
        } else {
            fetch(`${API_BASE}/api/field-config/${cfg.id}?tripId=${trip.id}`, { method: 'DELETE' })
                .then(() => onRemoveConfig(cfg.id, trip.id))
                .catch(() => {});
        }
    };

    const handleOrderChange = (id: string, order: number) => {
        const cfg = localConfigs.find(c => c.id === id) || availableFields.find(c => c.id === id);
        if (!cfg) return;
        fetch(`${API_BASE}/api/field-config/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: cfg.label, type: cfg.type, enabled: cfg.enabled !== false, locked: cfg.locked, tripId: trip.id, order })
        }).then(res => res.json()).then(c => {
            onUpsertConfig({ id: c.field, tripId: String(c.tripId), label: c.label, type: c.type, enabled: c.enabled, locked: c.locked, order: c.order });
        }).catch(() => {});
    };

    const [dragIndex, setDragIndex] = useState<number | null>(null);

    const onDragStart = (index: number) => {
        setDragIndex(index);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const onDrop = (index: number) => {
        if (dragIndex === null) return;
        const updated = [...localConfigs];
        const [moved] = updated.splice(dragIndex, 1);
        updated.splice(index, 0, moved);
        updated.forEach((cfg, idx) => {
            if (cfg.order !== idx + 1) {
                handleOrderChange(cfg.id, idx + 1);
            }
        });
        setLocalConfigs(updated.map((cfg, idx) => ({ ...cfg, order: idx + 1 })));
        setDragIndex(null);
    };

    const handleRemoveFile = (userId: string, fieldId: string) => {
        fetch(`${API_BASE}/api/users/${userId}/personal-data/${fieldId}/file`, { method: 'DELETE' })
            .then(() => onUpdateRecord({ userId, fieldId, value: '' }))
            .catch(() => {});
    };

    const handleTravelerFileChange = async (userId: string, fieldId: string, file: File | null) => {
        if (file) {
            const fd = new FormData();
            fd.append('file', file);
            await fetch(`${API_BASE}/api/users/${userId}/personal-data/${fieldId}/file`, {
                method: 'POST',
                body: fd
            }).catch(() => {});
            onUpdateRecord({ userId, fieldId, value: file.name });
        }
    };

    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [draftValues, setDraftValues] = useState<Record<string, string>>({});

    const startFieldEdit = (fieldId: string, value: string) => {
        setEditingFieldId(fieldId);
        setDraftValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleDraftChange = (fieldId: string, value: string) => {
        setDraftValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const saveFieldEdit = (userId: string, fieldId: string) => {
        const value = draftValues[fieldId] || '';
        onUpdateRecord({ userId, fieldId, value });
        setEditingFieldId(null);
    };

    const [remarkEditing, setRemarkEditing] = useState(false);
    const [remarkValue, setRemarkValue] = useState('');

    const startRemarkEdit = (value: string) => {
        setRemarkEditing(true);
        setRemarkValue(value);
    };

    const saveRemark = (userId: string) => {
        onUpdateRecord({ userId, fieldId: 'remark', value: remarkValue });
        setRemarkEditing(false);
    };

    const handlePrint = () => window.print();

    if (tripParticipants.length === 0) {
        return (
            <div className="personal-data-page">
                <h2>Résztvevők személyes adatai: {trip.name}</h2>
                <p>Nincsenek utazók ehhez az utazáshoz.</p>
            </div>
        );
    }

    const participant = tripParticipants.find(p => p.id === selectedTravelerId);

    return (
        <div className="personal-data-page">
            <h2>Résztvevők személyes adatai: {trip.name}</h2>
            <div className="field-manager">
                <h3>Mezők kezelése</h3>
                <div className="config-list">
                    {localConfigs.map((c, index) => (
                        <div
                            key={c.id}
                            className="config-item"
                            draggable={editingId === null}
                            onDragStart={() => onDragStart(index)}
                            onDragOver={onDragOver}
                            onDrop={() => onDrop(index)}
                        >
                            <span className="drag-handle">☰</span>
                            {editingId === c.id ? (
                                <>
                                    <input value={editLabel} onChange={e => setEditLabel(e.target.value)} />
                                    <select value={editType} onChange={e => setEditType(e.target.value as any)}>
                                        <option value="text">Szöveg</option>
                                        <option value="date">Dátum</option>
                                        <option value="file">Fájl</option>
                                    </select>
                                    <div className="config-actions">
                                        <button className="btn btn-small" onClick={() => saveEdit(c)}>Mentés</button>
                                        <button className="btn btn-small" onClick={cancelEdit}>Mégse</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="config-label">{c.label} <small>({c.type})</small></span>
                                    {!c.locked && (
                                        <div className="config-actions">
                                            <button className="btn btn-small" onClick={() => startEdit(c)}>Szerkesztés</button>
                                            <button className="btn btn-danger btn-small" onClick={() => handleDeleteField(c)}>Törlés</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
                {availableFields.length > 0 && (
                    <div className="available-fields">
                        {availableFields.map(f => (
                            <button key={f.id} className="btn btn-secondary btn-small" onClick={() => handleEnableField(f)}>+ {f.label}</button>
                        ))}
                    </div>
                )}
                <div className="add-field">
                    <input placeholder="Címke" value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} />
                    <select value={newFieldType} onChange={e => setNewFieldType(e.target.value as any)}>
                        <option value="text">Szöveg</option>
                        <option value="date">Dátum</option>
                        <option value="file">Fájl</option>
                    </select>
                    <button className="btn" onClick={handleAddField}>Hozzáadás</button>
                </div>
            </div>
            <div className="traveler-select">
                <label htmlFor="travelerSelect">Utazó</label>
                <select
                    id="travelerSelect"
                    value={selectedTravelerId}
                    onChange={e => setSelectedTravelerId(e.target.value)}
                >
                    {tripParticipants.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            {participant && (
                <div className="participant-data-card">
                    <h3>{participant.name}</h3>
                    {localConfigs.map(config => {
                        const record = records.find(r => r.userId === participant.id && r.fieldId === config.id);
                        const isEditing = editingFieldId === config.id || !record?.value;
                        const draft = draftValues[config.id] ?? record?.value ?? '';
                        return (
                            <div key={config.id} className={`data-field-group${!record?.value ? ' empty' : ''}`}>
                                <div className="data-field-header">
                                    <label>{config.label}</label>
                                    <div className="field-header-actions">
                                        <button
                                            className="lock-btn"
                                            onClick={() => onToggleLock(participant.id, config.id)}
                                            aria-label={record?.isLocked ? 'Mező feloldása' : 'Mező zárolása'}
                                        >
                                            {record?.isLocked ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                            )}
                                        </button>
                                        {config.type !== 'file' && record?.value && !record?.isLocked && (
                                            <button className="edit-btn" onClick={() => startFieldEdit(config.id, record.value)} aria-label="Szerkesztés">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {config.type === 'file' ? (
                                    <div>
                                        {record?.value && (
                                            <div>
                                                <a href={`${API_BASE}/${record.value}`} className="file-link">{record.value}</a>
                                                <button className="remove-file" onClick={() => handleRemoveFile(participant.id, config.id)}>Remove</button>
                                            </div>
                                        )}
                                        {!record?.isLocked && (
                                            <input type="file" onChange={e => handleTravelerFileChange(participant.id, config.id, e.target.files ? e.target.files[0] : null)} />
                                        )}
                                    </div>
                                ) : isEditing && !record?.isLocked ? (
                                    <div className="field-edit">
                                        <input type={config.type} value={draft} onChange={e => handleDraftChange(config.id, e.target.value)} />
                                        <button className="save-btn" onClick={() => saveFieldEdit(participant.id, config.id)} aria-label="Mentés">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="field-display">
                                        <span className={`data-value${record?.value ? '' : ' empty'}`}>{record?.value || ''}</span>
                                    </div>
                                )}
                                <div className="print-row">
                                    <span className="print-label">{config.label}:</span> <span className="print-value">{record?.value}</span>
                                </div>
                            </div>
                        );
                    })}
                    {(() => {
                        const remarkRecord = records.find(r => r.userId === participant.id && r.fieldId === 'remark');
                        return (
                            <div className="remark-section">
                                <div className="data-field-header">
                                    <label>Megjegyzés</label>
                                    {remarkEditing ? (
                                        <button className="save-btn" onClick={() => saveRemark(participant.id)} aria-label="Mentés">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        </button>
                                    ) : (
                                        <button className="edit-btn" onClick={() => startRemarkEdit(remarkRecord?.value || '')} aria-label="Szerkesztés">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>
                                        </button>
                                    )}
                                </div>
                                {remarkEditing ? (
                                    <textarea value={remarkValue} onChange={e => setRemarkValue(e.target.value)} />
                                ) : (
                                    <p className={`data-value${remarkRecord?.value ? '' : ' empty'}`}>{remarkRecord?.value || ''}</p>
                                )}
                                <div className="print-row">
                                    <span className="print-label">Megjegyzés:</span> <span className="print-value">{remarkRecord?.value}</span>
                                </div>
                            </div>
                        );
                    })()}
                    <div className="personal-data-actions">
                        <button className="btn btn-secondary" onClick={handlePrint}>Nyomtatás</button>
                        <button className="btn btn-secondary" onClick={handlePrint}>PDF mentése</button>
                    </div>
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
    onShowUsers,
    mainView,
    userRole,
    userId,
    isOpen
}: {
    trips: Trip[],
    selectedTripId: string | null,
    activeView: TripView,
    onSelectTrip: (id: string) => void,
    onSelectView: (view: TripView) => void,
    onShowTrips: () => void,
    onShowUsers: () => void,
    mainView: 'trips' | 'users',
    userRole: Role,
    userId: string,
    isOpen: boolean
}) => {

    return (
        <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
            <nav>
                <ul className="main-nav-list">
                    <li className="nav-item">
                        <a href="#" onClick={(e) => { e.preventDefault(); onShowTrips(); }} className={mainView === 'trips' ? 'active' : ''}>
                           Utazásaink
                        </a>
                        {mainView === 'trips' && (
                          <ul className="trip-list">
                            {trips.map(trip => {
                              const tripNavItems: { key: TripView; label: string }[] = [
                                { key: 'summary', label: 'Összegzés' },
                                { key: 'itinerary', label: 'Útiterv' },
                                { key: 'financials', label: 'Pénzügyek' },
                                { key: 'personalData', label: 'Személyes adatok' },
                                { key: 'documents', label: 'Dokumentumok' },
                              ];
                              if (userRole === 'admin' || (userRole === 'organizer' && trip.organizerIds.includes(userId))) {
                                tripNavItems.push({ key: 'users', label: 'Felhasználók' });
                                tripNavItems.push({ key: 'settings', label: 'Beállítások' });
                              }
                              return (
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
                              );
                            })}
                          </ul>
                        )}
                    </li>
                    {userRole === 'admin' && (
                      <li className="nav-item">
                        <a href="#" onClick={(e) => { e.preventDefault(); onShowUsers(); }} className={mainView === 'users' ? 'active' : ''}>
                          Felhasználók
                        </a>
                      </li>
                    )}
                </ul>
            </nav>
        </aside>
    );
};


const Dashboard = ({
    user, trips, refreshTrips, onLogout, onCreateTrip,
    financialRecords, onAddFinancialRecord,
    documents, onAddDocument,
    personalDataConfigs, personalDataRecords, onUpdatePersonalData, onTogglePersonalDataLock, onUpsertPersonalDataConfig, onRemovePersonalDataConfig,
    itineraryItems, onAddItineraryItem, onRemoveItineraryItem,
    theme, onThemeChange
}: {
    user: User,
    trips: Trip[],
    refreshTrips: () => void,
    onLogout: () => void,
    onCreateTrip: (trip: Trip) => void,
    financialRecords: FinancialRecord[],
    onAddFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => void,
    documents: Document[],
    onAddDocument: (doc: Omit<Document, 'id'>) => void,
    personalDataConfigs: PersonalDataFieldConfig[],
    personalDataRecords: PersonalDataRecord[],
    onUpdatePersonalData: (record: Omit<PersonalDataRecord, 'isLocked'>) => void,
    onTogglePersonalDataLock: (userId: string, fieldId: string) => void,
    onUpsertPersonalDataConfig: (config: PersonalDataFieldConfig) => void,
    onRemovePersonalDataConfig: (id: string, tripId: string) => void,
    itineraryItems: ItineraryItem[],
    onAddItineraryItem: (item: Omit<ItineraryItem, 'id'>) => void,
    onRemoveItineraryItem: (id: string) => void,
    theme: Theme,
    onThemeChange: (theme: Theme) => void
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [inviteRefresh, setInviteRefresh] = useState(0);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [mainView, setMainView] = useState<'trips' | 'users'>('trips');
  const [activeTripView, setActiveTripView] = useState<TripView>('summary');
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userRefresh, setUserRefresh] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(data => setAllUsers(data.map((u: any) => ({ id: u._id, name: u.name, role: u.role, _id: u._id }))))
      .catch(() => {});
  }, [userRefresh]);
    
  const visibleTrips = useMemo<Trip[]>(() => {
    switch(user.role) {
      case 'admin':
        return trips;
      case 'organizer':
        return trips.filter((trip: Trip) =>
          trip.organizerIds.includes(String(user.id)) || trip.travelerIds.includes(String(user.id))
        );
      case 'traveler':
        return trips.filter((trip: Trip) => trip.travelerIds.includes(String(user.id)));
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
      return personalDataRecords;
  }, [personalDataRecords]);
  
  const tripItineraryItems = useMemo(() => {
      if (!selectedTripId) return [];
      return itineraryItems.filter(i => i.tripId === selectedTripId);
  }, [selectedTripId, itineraryItems]);

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setActiveTripView('summary');
    setMobileSidebarOpen(false); // Close mobile menu on selection
  };

  const handleSelectView = (view: TripView) => {
    setActiveTripView(view);
    setMobileSidebarOpen(false); // Close mobile menu on selection
  };

  const handleShowTrips = () => {
    setMainView('trips');
    setSelectedTripId(null);
    setMobileSidebarOpen(false); // Close mobile menu on selection
  }

  const handleShowUsers = () => {
    setMainView('users');
    setSelectedTripId(null);
    setMobileSidebarOpen(false); // Close mobile menu on selection
  }

  const renderContent = () => {
    if (mainView === 'users') {
        return <UserManagement onInvite={() => setInviteOpen(true)} trips={trips} users={allUsers} refreshKey={inviteRefresh} onUsersChanged={() => { setUserRefresh(v => v + 1); refreshTrips(); }} />;
    }

    if (selectedTrip) {
        switch (activeTripView) {
            case 'summary': return <TripSummary trip={selectedTrip} />;
            case 'financials': return <TripFinancials trip={selectedTrip} user={user} records={tripFinancialRecords} users={allUsers} onAddRecord={onAddFinancialRecord} />;
            case 'itinerary': return <TripItinerary trip={selectedTrip} user={user} items={tripItineraryItems} onAddItem={onAddItineraryItem} onRemoveItem={onRemoveItineraryItem} />;
            case 'documents': return <TripDocuments trip={selectedTrip} user={user} documents={tripDocuments} onAddDocument={onAddDocument} users={allUsers} />;
            case 'personalData': return <TripPersonalData trip={selectedTrip} user={user} configs={tripPersonalDataConfigs} records={tripPersonalDataRecords} onUpdateRecord={onUpdatePersonalData} onToggleLock={onTogglePersonalDataLock} onUpsertConfig={onUpsertPersonalDataConfig} onRemoveConfig={onRemovePersonalDataConfig} users={allUsers} />;
            case 'users':
              if (user.role !== 'admin' && !selectedTrip.organizerIds.includes(String(user.id))) {
                return <p>Nincs jogosultsága a felhasználók kezeléséhez.</p>;
              }
              return <TripUserManagement trip={selectedTrip} users={allUsers} currentUser={user} onChange={() => { refreshTrips(); setUserRefresh(v => v + 1); }} />;
            case 'settings':
              return <TripSettings trip={selectedTrip} user={user} onDeleted={() => { setSelectedTripId(null); refreshTrips(); }} />;
            default: return <h2>Válasszon nézetet</h2>;
        }
    }

    return (
        <>
            <div className="dashboard-header">
                <h2>Utazásaid</h2>
                <div className="header-actions">
                {user.role === 'admin' && (
                <button onClick={() => setModalOpen(true)} className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>Új utazás létrehozása</span>
                </button>
                )}
                {(user.role === 'admin' || user.role === 'organizer') && (
                <button onClick={() => setInviteOpen(true)} className="btn btn-secondary">Meghívó küldése</button>
                )}
                </div>
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
            onShowUsers={handleShowUsers}
            mainView={mainView}
            userRole={user.role}
            userId={String(user.id)}
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
                onCreated={onCreateTrip}
            />
          )}
          {(user.role === 'admin' || user.role === 'organizer') && (
            <InviteUserModal
                isOpen={isInviteOpen}
                onClose={() => setInviteOpen(false)}
                trips={trips}
                onSent={() => setInviteRefresh(v => v + 1)}
                currentUser={user}
            />
          )}
        </div>
    </div>
  );
};



export default Dashboard;

