import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthPage from './pages/AuthPage';
import ParentDashboard from './pages/ParentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChatPage from './pages/ChatPage';
import AttendancePage from './pages/AttendancePage';
import PerformancePage from './pages/PerformancePage';
import FinanceDashboard from './pages/FinanceDashboard';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-emerald-700">BB Meta</h1>
          <p className="text-sm text-emerald-600 mt-1">Powered by Vibe Coding ⚡</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return <AuthPage onAuth={() => fetchProfile(user?.id!)} />;

  const dashboards: Record<string, string> = {
    parent: '/parent',
    teacher: '/teacher',
    admin: '/admin',
    super_admin: '/admin',
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage onAuth={() => fetchProfile(user.id)} />} />
        <Route path="/" element={<Navigate to={dashboards[profile.role] || '/auth'} replace />} />
        
        <Route path="/parent" element={<Layout profile={profile}><ParentDashboard profile={profile} /></Layout>} />
        <Route path="/teacher" element={<Layout profile={profile}><TeacherDashboard profile={profile} /></Layout>} />
        <Route path="/admin" element={<Layout profile={profile}><AdminDashboard profile={profile} /></Layout>} />
        
        <Route path="/chat" element={<Layout profile={profile}><ChatPage profile={profile} /></Layout>} />
        <Route path="/attendance" element={<Layout profile={profile}><AttendancePage profile={profile} /></Layout>} />
        <Route path="/performance/:studentId" element={<Layout profile={profile}><PerformancePage profile={profile} /></Layout>} />
        <Route path="/finance" element={<Layout profile={profile}><FinanceDashboard profile={profile} /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
