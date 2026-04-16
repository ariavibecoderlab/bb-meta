import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardCheck, Users, MessageCircle } from 'lucide-react';

export default function TeacherDashboard({ profile }: { profile: any }) {
  const [myClass, setMyClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchClassAndStudents();
  }, []);

  const fetchClassAndStudents = async () => {
    const { data: cls } = await supabase
      .from('classes')
      .select('*, campuses(name)')
      .eq('teacher_id', profile.id)
      .eq('is_active', true)
      .single();
    if (cls) {
      setMyClass(cls);
      const { data: studs } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', cls.id)
        .eq('is_active', true);
      setStudents(studs || []);

      // Fetch today's attendance
      if (studs && studs.length > 0) {
        const { data: att } = await supabase
          .from('attendance')
          .select('*')
          .in('student_id', studs.map((s: any) => s.id))
          .eq('date', new Date().toISOString().split('T')[0]);
        if (att) {
          const map: Record<string, any> = {};
          att.forEach((a: any) => { map[a.student_id] = a; });
          setTodayAttendance(map);
        }
      }
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    const today = new Date().toISOString().split('T')[0];
    const existing = todayAttendance[studentId];

    if (existing) {
      // Update
      await supabase
        .from('attendance')
        .update({ status, check_in_time: status !== 'absent' ? new Date().toISOString() : null })
        .eq('id', existing.id);
    } else {
      // Insert
      await supabase
        .from('attendance')
        .insert({ student_id: studentId, date: today, status, check_in_time: status !== 'absent' ? new Date().toISOString() : null, marked_by: profile.id });
    }
    fetchClassAndStudents();
  };

  const markCheckout = async (studentId: string) => {
    const existing = todayAttendance[studentId];
    if (existing) {
      await supabase
        .from('attendance')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', existing.id);
      fetchClassAndStudents();
    }
  };

  const presentCount = Object.values(todayAttendance).filter((a: any) => a?.status === 'present').length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold">Good morning, {profile.full_name}! 📚</h1>
        <p className="text-blue-100 mt-1">{myClass?.name || 'Loading class...'} • {myClass?.campuses?.name || ''}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <Users className="mx-auto text-blue-500" size={24} />
          <p className="text-2xl font-bold mt-1">{students.length}</p>
          <p className="text-xs text-gray-500">Total Students</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <ClipboardCheck className="mx-auto text-green-500" size={24} />
          <p className="text-2xl font-bold mt-1">{presentCount}</p>
          <p className="text-xs text-gray-500">Present Today</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <MessageCircle className="mx-auto text-purple-500" size={24} />
          <p className="text-2xl font-bold mt-1">0</p>
          <p className="text-xs text-gray-500">Messages</p>
        </div>
      </div>

      {/* Attendance Marking */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">📋 Mark Attendance</h2>
        <div className="space-y-2">
          {students.map(s => {
            const att = todayAttendance[s.id];
            const status = att?.status;
            return (
              <div key={s.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                    {s.gender === 'male' ? '👦' : '👧'}
                  </div>
                  <span className="font-medium text-sm">{s.full_name}</span>
                </div>
                <div className="flex gap-1">
                  {!status ? (
                    <>
                      <button onClick={() => markAttendance(s.id, 'present')} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">✓ Present</button>
                      <button onClick={() => markAttendance(s.id, 'absent')} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">✗ Absent</button>
                      <button onClick={() => markAttendance(s.id, 'late')} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200">⏰ Late</button>
                    </>
                  ) : (
                    <>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${status === 'present' ? 'bg-green-100 text-green-700' : status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : '⏰ Late'}
                      </span>
                      {status !== 'absent' && !att.check_out_time && (
                        <button onClick={() => markCheckout(s.id)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">Checkout</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
