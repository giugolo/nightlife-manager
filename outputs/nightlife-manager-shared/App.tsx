import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PublicListPage from './components/PublicListPage';
import { CalendarPlus, Calendar, MapPin, Users, ChevronRight, Moon, LogOut, User, Building2 } from 'lucide-react';
import { Event, ViewState } from './types';
import { firestoreService } from './services/firestoreService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import EventDetail from './components/EventDetail';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import CheckInPage from './components/CheckInPage';
import OnboardingModal from './components/OnboardingModal';
import OrganizationSettings from './components/OrganizationSettings';
import InviteAcceptPage from './components/InviteAcceptPage';
import { Button, Card, Input, Modal, Spinner } from './components/ui';

// Full-viewport centered loading indicator, reused across auth/data gates.
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <Spinner size="lg" tone="brand" />
  </div>
);

// --- Public routes (no auth) -------------------------------------------------
// Thin wrappers that read the URL via react-router and render the existing pages.

const PublicListRoute: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  return <PublicListPage token={token!} onBack={() => navigate('/')} />;
};

const CheckInRoute: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  // A door link without a token is invalid -> bounce home.
  if (!token) return <Navigate to="/" replace />;
  return <CheckInPage eventId={eventId!} token={token} />;
};

const InviteRoute: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  return <InviteAcceptPage token={token!} onBack={() => navigate('/')} />;
};

// Authenticated application (events list, event detail, org settings).
const AuthedApp: React.FC = () => {
  const { user, userProfile, organization, needsOnboarding, logout, loading: authLoading, refreshUserProfile } = useAuth();
  const [view, setView] = useState<ViewState>('EVENTS');
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOrgSettings, setShowOrgSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // New Event Form State
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    name: '',
    date: '',
    location: '',
    capacity: 200
  });

  // Load events from Firestore (filtered by organization)
  const loadEvents = async () => {
    try {
      setLoading(true);
      const fetchedEvents = await firestoreService.getEvents(organization?.id);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset the auth view to login whenever the user logs out, so a logout never
  // lands on the register screen (which would otherwise persist from before).
  const wasAuthedRef = useRef(false);
  useEffect(() => {
    if (user) {
      wasAuthedRef.current = true;
    } else if (wasAuthedRef.current) {
      wasAuthedRef.current = false;
      setAuthView('login');
    }
  }, [user]);

  // Track previous user to detect changes and clear stale data
  const prevUserIdRef = React.useRef<string | null>(null);
  const prevOrgIdRef = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentUserId = user?.uid ?? null;
    const currentOrgId = organization?.id;

    // Clear events immediately if user or org changed
    if (prevUserIdRef.current !== currentUserId || prevOrgIdRef.current !== currentOrgId) {
      setEvents([]); // Clear stale data immediately
      prevUserIdRef.current = currentUserId;
      prevOrgIdRef.current = currentOrgId;
    }

    // Load new events only if both user and org are present
    if (user && organization) {
      loadEvents();
    }
  }, [user, organization]);

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.date) return;

    const event: Event = {
      id: crypto.randomUUID(),
      name: newEvent.name!,
      date: newEvent.date!,
      location: newEvent.location || 'TBA',
      capacity: newEvent.capacity || 100
    };

    try {
      // Multi-tenancy: pass organizationId to tag the event
      await firestoreService.saveEvent(event, organization?.id);
      await loadEvents();
      setShowCreateModal(false);
      setNewEvent({ name: '', date: '', location: '', capacity: 200 });
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const openEvent = (id: string) => {
    setActiveEventId(id);
    setView('EVENT_DETAIL');
  };

  const goBack = () => {
    setView('EVENTS');
    setActiveEventId(null);
    loadEvents(); // Refresh list to catch updates
  };

  const handleEventUpdate = () => {
    loadEvents();
  };

  // Show loading while checking auth
  if (authLoading) {
    return <PageLoader />;
  }

  // Show login/register if not authenticated
  if (!user) {
    if (authView === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
    }
    return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
  }

  // Show onboarding if user doesn't have an organization yet
  if (needsOnboarding) {
    return <OnboardingModal onComplete={() => refreshUserProfile()} />;
  }

  // Show special message for pending users (registered via invite but not accepted)
  if (userProfile?.role === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card padding="lg" className="max-w-md text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Completa la Registrazione</h2>
          <p className="text-slate-400 mb-6">
            Hai iniziato la registrazione tramite un link di invito ma non hai ancora completato l'accettazione.
            Torna al link di invito che hai ricevuto per completare il processo.
          </p>
          <Button onClick={logout} fullWidth>
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </Card>
      </div>
    );
  }

  // Show organization settings if admin clicked the button
  if (showOrgSettings) {
    return <OrganizationSettings onBack={() => setShowOrgSettings(false)} />;
  }

  if (view === 'EVENT_DETAIL' && activeEventId) {
    const event = events.find(e => e.id === activeEventId);
    if (event) {
      return <EventDetail event={event} onBack={goBack} onUpdate={handleEventUpdate} />;
    }
  }

  // Check if user can create events (admin or staff)
  const canCreateEvents = userProfile?.role === 'admin' || userProfile?.role === 'staff';

  return (
    <div className="min-h-screen bg-ink-950 text-slate-50 font-sans">
      <header className="bg-ink-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-glow">
              <Moon className="text-white w-5 h-5" />
            </div>
            <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight text-white">Dioniso</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* User info */}
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
              <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500 font-mono hidden lg:inline-block">v{__APP_VERSION__}</span>
              <User className="w-4 h-4" />
              <span>{userProfile?.displayName || user.email}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${userProfile?.role === 'admin' ? 'bg-brand-500/20 text-brand-300' :
                'bg-blue-500/20 text-blue-400'
                }`}>
                {userProfile?.role?.toUpperCase()}
              </span>
            </div>

            {canCreateEvents && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-brand-600 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all hover:brightness-110 flex items-center gap-1 sm:gap-2 shadow-glow"
              >
                <CalendarPlus className="w-4 h-4" /><span className="hidden sm:inline"> Crea Evento</span>
              </button>
            )}

            {canCreateEvents && (
              <button
                onClick={() => setShowOrgSettings(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Impostazioni Organizzazione"
              >
                <Building2 className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">I Tuoi Eventi</h2>
          <p className="text-slate-400">Gestisci i tuoi prossimi eventi e monitora le prenotazioni.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" tone="brand" />
          </div>
        ) : events.length === 0 && !canCreateEvents ? (
          // Staff with no events yet: friendly empty state (admins get the create card below).
          <Card padding="lg" className="text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Nessun evento</h3>
            <p className="text-slate-400 text-sm">Non ci sono ancora eventi nella tua organizzazione.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => openEvent(event.id)}
                className="group bg-ink-900 ring-1 ring-white/10 hover:ring-brand-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-glow hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/5 p-3 rounded-xl group-hover:bg-brand-500/15 transition-colors">
                    <Calendar className="w-6 h-6 text-brand-300" />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${new Date(event.date) < new Date() ? 'bg-slate-800 text-slate-500' : 'bg-green-500/10 text-green-400'
                    }`}>
                    {new Date(event.date) < new Date() ? 'Passato' : 'In Programma'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>

                <div className="space-y-2 text-sm text-slate-400 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {new Date(event.date).toLocaleString('it-IT', { dateStyle: 'long', timeStyle: 'short' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    Capacità: {event.capacity}
                  </div>
                </div>

                <div className="flex items-center justify-between text-brand-300 font-medium text-sm border-t border-white/10 pt-4 group-hover:text-brand-200">
                  Gestisci Evento
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}

            {/* Empty State Card - Only for admin */}
            {canCreateEvents && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="border-2 border-dashed border-white/10 hover:border-brand-500/40 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-brand-300 transition-colors h-[300px]"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <CalendarPlus className="w-6 h-6" />
                </div>
                <span className="font-medium">Nuovo Evento</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuovo Evento"
        size="lg"
        footer={
          <div className="flex gap-4">
            <Button variant="secondary" fullWidth onClick={() => setShowCreateModal(false)}>
              Annulla
            </Button>
            <Button fullWidth onClick={handleCreateEvent}>
              Crea Evento
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome Evento"
            type="text"
            placeholder="Es. Summer Party XL"
            value={newEvent.name}
            onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data e Ora"
              type="datetime-local"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />
            <Input
              label="Capacità"
              type="number"
              value={newEvent.capacity}
              onChange={(e) => setNewEvent({ ...newEvent, capacity: parseInt(e.target.value) })}
            />
          </div>
          <Input
            label="Luogo"
            type="text"
            placeholder="Es. Main Hall"
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};

// Root App: providers + router. Public routes render without auth; everything
// else falls through to the authenticated app (which manages its own internal
// navigation between the events list and event detail).
const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/lista/:token" element={<PublicListRoute />} />
            <Route path="/checkin/:eventId" element={<CheckInRoute />} />
            <Route path="/invite/:token" element={<InviteRoute />} />
            <Route path="/*" element={<AuthedApp />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;