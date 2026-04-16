import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardCheck, MessageCircle, BarChart3, Bell } from 'lucide-react';

export default function ParentDashboard({ profile }: { profile: any }) {
  const [children, setChildren] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    fetchChildren();
    fetchNotifications();
  }, []);

  const fetchChildren = async () => {
    const { data } = await supabase
      .from('parent_students')
      .select('student_id, relationship, students(*)')
      .eq('parent_id', profile.id);
    if (data) {
      setChildren(data.map((d: any) => ({ ...d.students, relationship: d.relationship })));
      // Fetch today's attendance for these students
      const studentIds = data.map((d: any) => d.student_id);
      if (studentIds.length > 0) {
        const { data: att } = await supabase
          .from('attendance')
          .select('*')
          .in('student_id', studentIds)
          .eq('date', new Date().toISOString().split('T')[0]);
        setTodayAttendance(att || []);
      }
    }
  };

  const fetchNotifications = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    setUnreadNotifs(count || 0);
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold">Assalamualaikum, {profile.full_name}! 👋</h1>
        <p className="text-emerald-100 mt-1">{new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <ClipboardCheck className="mx-auto text-emerald-500" size={24} />
          <p className="text-2xl font-bold mt-1">{todayAttendance.filter(a => a.status === 'present').length}</p>
          <p className="text-xs text-gray-500">Present Today</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <MessageCircle className="mx-auto text-blue-500" size={24} />
          <p className="text-2xl font-bold mt-1">0</p>
          <p className="text-xs text-gray-500">Unread Msgs</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <Bell className="mx-auto text-amber-500" size={24} />
          <p className="text-2xl font-bold mt-1">{unreadNotifs}</p>
          <p className="text-xs text-gray-500">Alerts</p>
        </div>
      </div>

      {/* Children Cards */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">My Children</h2>
        <div className="space-y-3">
          {children.length === 0 ? (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-400">
              <p>No children linked yet</p>
              <p className="text-xs mt-1">Please contact your campus admin</p>
            </div>
          ) : (
            children.map(child => {
              const att = todayAttendance.find((a: any) => a.student_id === child.id);
              return (
                <div key={child.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg">
                        {child.gender === 'male' ? '👦' : '👧'}
                      </div>
                      <div>
                        <p className="font-medium">{child.full_name}</p>
                        <p className="text-xs text-gray-500">{child.relationship} • {child.nickname || ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {att ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${att.status === 'present' ? 'bg-green-100 text-green-700' : att.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {att.status === 'present' ? '✓ Present' : att.status === 'absent' ? '✗ Absent' : '⏰ Late'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Not checked in
                        </span>
                      )}
                      {att?.check_in_time && (
                        <p className="text-xs text-gray-400 mt-1">In: {new Date(att.check_in_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    <a href={`/performance/${child.id}`} className="flex-1 text-center py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100">
                      <BarChart3 size={14} className="inline mr-1" /> Progress
                    </a>
                    <a href="/chat" className="flex-1 text-center py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">
                      <MessageCircle size={14} className="inline mr-1" /> Chat
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
