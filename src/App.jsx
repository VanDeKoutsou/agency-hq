import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { isConfigured } from './lib/supabase';
import AuthScreen from './components/AuthScreen';
import SetupNotice from './components/SetupNotice';
import Dashboard from './components/Dashboard';

export default function App() {
  const { session, loading } = useAuth();

  if (!isConfigured) return <SetupNotice />;
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-navy-300">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (!session) return <AuthScreen />;
  return <Dashboard />;
}
