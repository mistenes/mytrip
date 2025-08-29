import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import Dashboard from "./components/Dashboard";
import ChangePasswordPage from "./components/ChangePasswordPage";
import { INITIAL_TRIPS, INITIAL_FINANCIAL_RECORDS, INITIAL_DOCUMENTS, DEFAULT_PERSONAL_DATA_FIELD_CONFIGS, INITIAL_PERSONAL_DATA_RECORDS, INITIAL_ITINERARY_ITEMS } from "./mockData";
import { User, Trip, FinancialRecord, Document, PersonalDataRecord, PersonalDataFieldConfig, ItineraryItem, Theme } from "./types";
import { API_BASE } from "./api";

const App = () => {
  if (window.location.pathname === '/signup') {
    return <SignupPage />;
  }
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);

  const refreshTrips = () => {
    fetch(`${API_BASE}/api/trips`)
      .then(res => res.json())
      .then(data => setTrips(data.map((t: any) => ({
        id: t._id,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        organizerIds: t.organizerIds || [],
        organizerNames: t.organizerNames || [],
        travelerIds: t.travelerIds || []
      }))))
      .catch(err => console.error('Failed to fetch trips', err));
  };

  useEffect(() => {
    refreshTrips();
  }, []);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>(INITIAL_FINANCIAL_RECORDS);
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCUMENTS);
  const [personalDataRecords, setPersonalDataRecords] = useState<PersonalDataRecord[]>(INITIAL_PERSONAL_DATA_RECORDS);
  const [personalDataConfigs, setPersonalDataConfigs] = useState<PersonalDataFieldConfig[]>(DEFAULT_PERSONAL_DATA_FIELD_CONFIGS);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>(INITIAL_ITINERARY_ITEMS);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'auto');

  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      fetch(`${API_BASE}/api/session`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => (res.ok ? res.json() : Promise.reject()))
        .then(data => setCurrentUser({ ...data, token }))
        .catch(() => localStorage.removeItem('sessionToken'));
    }
  }, []);

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

  useEffect(() => {
    fetch(`${API_BASE}/api/field-config`)
      .then(res => res.json())
      .then(data => setPersonalDataConfigs(data.map((c: any) => ({
        id: c.field,
        tripId: String(c.tripId),
        label: c.label,
        type: c.type,
        enabled: c.enabled,
        locked: c.locked,
        order: c.order
      }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(data => {
        const records: PersonalDataRecord[] = [];
        data.forEach((u: any) => {
          (u.personalData || []).forEach((pd: any) => {
            records.push({ userId: u._id, fieldId: pd.field, value: pd.value, isLocked: pd.locked });
          });
        });
        setPersonalDataRecords(records);
      })
      .catch(() => {});
  }, []);
  
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.token) {
      localStorage.setItem('sessionToken', user.token);
    }
  };

  const handleLogout = () => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      fetch(`${API_BASE}/api/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      localStorage.removeItem('sessionToken');
    }
    setCurrentUser(null);
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
          const existingIndex = prev.findIndex(r => r.userId === updatedRecord.userId && r.fieldId === updatedRecord.fieldId);
          if (existingIndex > -1) {
              const newRecords = [...prev];
              newRecords[existingIndex] = { ...newRecords[existingIndex], value: updatedRecord.value };
              return newRecords;
          } else {
              return [...prev, { ...updatedRecord, isLocked: false }];
          }
      });
      fetch(`${API_BASE}/api/users/${updatedRecord.userId}/personal-data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: updatedRecord.fieldId, value: updatedRecord.value })
      }).catch(() => {});
  };

  const handleUpsertPersonalDataConfig = (config: PersonalDataFieldConfig) => {
      setPersonalDataConfigs(prev => {
          const idx = prev.findIndex(c => c.id === config.id);
          const updated = idx > -1 ? [...prev.slice(0, idx), config, ...prev.slice(idx + 1)] : [...prev, config];
          return [...updated].sort((a,b)=>(a.order||0)-(b.order||0));
      });
  };

  const handleTogglePersonalDataLock = (userId: string, fieldId: string) => {
      setPersonalDataRecords(prev =>
          prev.map(record => {
              if (record.userId === userId && record.fieldId === fieldId) {
                  return { ...record, isLocked: !record.isLocked };
              }
              return record;
          })
      );
      const record = personalDataRecords.find(r => r.userId === userId && r.fieldId === fieldId);
      fetch(`${API_BASE}/api/users/${userId}/personal-data/${fieldId}/lock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !(record?.isLocked) })
      }).catch(() => {});
  };

  const handleAddItineraryItem = (newItemData: Omit<ItineraryItem, 'id'>) => {
    const newItem: ItineraryItem = { ...newItemData, id: Date.now().toString() };
    setItineraryItems(prev => [...prev, newItem]);
  };

  const handleRemoveItineraryItem = (idToRemove: string) => {
      setItineraryItems(prev => prev.filter(item => item.id !== idToRemove));
  };
  
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentUser.mustChangePassword) {
    return <ChangePasswordPage user={currentUser} onSuccess={() => setCurrentUser({ ...currentUser, mustChangePassword: false })} />;
  }

  return (
    <Dashboard
      user={currentUser}
      trips={trips}
      refreshTrips={refreshTrips}
      onLogout={handleLogout}
      onCreateTrip={handleCreateTrip}
      financialRecords={financialRecords}
      onAddFinancialRecord={handleAddFinancialRecord}
      documents={documents}
      onAddDocument={handleAddDocument}
      personalDataConfigs={personalDataConfigs.filter(c => c.enabled !== false)}
      personalDataRecords={personalDataRecords}
      onUpdatePersonalData={handleUpdatePersonalData}
      onTogglePersonalDataLock={handleTogglePersonalDataLock}
      onUpsertPersonalDataConfig={handleUpsertPersonalDataConfig}
      itineraryItems={itineraryItems}
      onAddItineraryItem={handleAddItineraryItem}
      onRemoveItineraryItem={handleRemoveItineraryItem}
      theme={theme}
      onThemeChange={setTheme}
    />
  );
};

export default App;

