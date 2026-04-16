import { NavLink, Outlet } from 'react-router-dom';
import { MessageCircle, ClipboardCheck, BarChart3, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ profile, children }: { profile: any; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: profile?.role === 'parent' ? '/parent' : profile?.role === 'teacher' ? '/teacher' : '/admin', label: 'Home', icon: Home },
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
    { to: profile?.role === 'parent' ? '/performance/' + (profile?.children?.[0] || '') : '/attendance', label: 'Progress', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">🎓 BB Meta</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">{profile?.full_name}</span>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-4 max-w-4xl mx-auto w-full px-4 py-4">
        {children}
      </main>

      {/* VibeCoderLab banner */}
      <div className="bg-emerald-50 border-t border-emerald-100 px-4 py-2 text-center text-xs text-emerald-600">
        Built with Vibe Coding ⚡ <a href="https://vibecoderlab.ai" className="underline font-medium">Learn how at VibeCoderLab.ai</a>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 md:hidden z-50">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
            <l.icon size={20} />
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
