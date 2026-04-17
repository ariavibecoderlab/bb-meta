import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  absence_reason: string | null;
}

export default function AttendancePage({ profile }: { profile: any }) {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [isTeacher, setIsTeacher] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Record<string, any>>({});

  useEffect(() => {
    if (profile.role === 'parent') {
      fetchChildren();
    } else if (profile.role === 'teacher' || profile.role === 'admin' || profile.role === 'super_admin') {
      setIsTeacher(true);
      fetchClassStudents();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedChild) fetchAttendanceRecords(selectedChild);
  }, [selectedChild, month]);

  const fetchChildren = async () => {
    const { data } = await supabase
      .from('parent_students')
      .select('student_id, relationship, students(id, full_name, nickname, gender)')
      .eq('parent_id', profile.id);
    if (data) {
      const kids = data.map((d: any) => ({ ...d.students, relationship: d.relationship }));
      setChildren(kids);
      if (kids.length > 0 && !selectedChild) setSelectedChild(kids[0].id);
    }
  };

  const fetchClassStudents = async () => {
    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', profile.id)
      .eq('is_active', true)
      .single();
    if (cls) {
      const { data: studs } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', cls.id)
        .eq('is_active', true);
      setStudents(studs || []);
      fetchTodayAttendance(studs || []);
    }
  };

  const fetchTodayAttendance = async (studs: any[]) => {
    const ids = studs.map(s => s.id);
    if (ids.length === 0) return;
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .in('student_id', ids)
      .eq('date', new Date().toISOString().split('T')[0]);
    if (data) {
      const map: Record<string, any> = {};
      data.forEach((a: any) => { map[a.student_id] = a; });
      setTodayAttendance(map);
    }
  };

  const fetchAttendanceRecords = async (studentId: string) => {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    setRecords(data || []);
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    const today = new Date().toISOString().split('T')[0];
    const existing = todayAttendance[studentId];
    if (existing) {
      await supabase.from('attendance').update({
        status,
        check_in_time: status !== 'absent' ? new Date().toISOString() : null,
        marked_by: profile.id,
      }).eq('id', existing.id);
    } else {
      await supabase.from('attendance').insert({
        student_id: studentId,
        date: today,
        status,
        check_in_time: status !== 'absent' ? new Date().toISOString() : null,
        marked_by: profile.id,
      });
    }
    fetchClassStudents();
  };

  const markCheckout = async (studentId: string) => {
    const existing = todayAttendance[studentId];
    if (existing) {
      await supabase.from('attendance').update({
        check_out_time: new Date().toISOString(),
      }).eq('id', existing.id);
      fetchClassStudents();
    }
  };

  const stats = {
    present: records.filter(r => r.status === 'present' || r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    total: records.length,
  };

  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  // === TEACHER VIEW ===
  if (isTeacher) {
    const presentCount = Object.values(todayAttendance).filter((a: any) => a?.status === 'present' || a?.status === 'late').length;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
          <h1 className="text-xl font-bold flex items-center gap-2"><Calendar size={24} /> Attendance</h1>
          <p className="text-blue-100 mt-1">{new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">{students.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-gray-500">Present</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-red-600">{students.length - presentCount}</p>
            <p className="text-xs text-gray-500">Absent</p>
          </div>
        </div>

        <div className="space-y-2">
          {students.map(s => {
            const att = todayAttendance[s.id];
            const status = att?.status;
            return (
              <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {s.gender === 'male' ? '👦' : '👧'}
                    </div>
                    <div>
                      <p className="font-medium">{s.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {status === 'present' ? `Checked in ${att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) : ''}` :
                         status === 'absent' ? (att.absence_reason || 'Absent') :
                         status === 'late' ? `Late - ${att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) : ''}` :
                         'Not checked in'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {!status ? (
                      <>
                        <button onClick={() => markAttendance(s.id, 'present')} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">✓ Present</button>
                        <button onClick={() => markAttendance(s.id, 'absent')} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">✗ Absent</button>
                        <button onClick={() => markAttendance(s.id, 'late')} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600">⏰ Late</button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          status === 'present' ? 'bg-green-100 text-green-700' :
                          status === 'absent' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : '⏰ Late'}
                        </span>
                        {status !== 'absent' && !att.check_out_time && (
                          <button onClick={() => markCheckout(s.id)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">🚪 Out</button>
                        )}
                        {att.check_out_time && (
                          <span className="text-xs text-gray-400">Out: {new Date(att.check_out_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // === PARENT VIEW ===
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold flex items-center gap-2"><Calendar size={24} /> Attendance</h1>
        <div className="flex items-center gap-4 mt-2">
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-white/20 rounded-lg px-3 py-1.5 text-sm outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const val = d.toISOString().slice(0, 7);
              const label = d.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
              return <option key={val} value={val} className="text-gray-800">{label}</option>;
            })}
          </select>
          {children.length > 1 && (
            <select
              value={selectedChild || ''}
              onChange={e => setSelectedChild(e.target.value)}
              className="bg-white/20 rounded-lg px-3 py-1.5 text-sm outline-none"
            >
              {children.map(c => (
                <option key={c.id} value={c.id} className="text-gray-800">{c.full_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-emerald-600">{attendanceRate}%</p>
          <p className="text-xs text-gray-500">Rate</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <CheckCircle className="mx-auto text-green-500" size={20} />
          <p className="text-xl font-bold">{stats.present}</p>
          <p className="text-xs text-gray-500">Present</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <XCircle className="mx-auto text-red-500" size={20} />
          <p className="text-xl font-bold">{stats.absent}</p>
          <p className="text-xs text-gray-500">Absent</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <Clock className="mx-auto text-amber-500" size={20} />
          <p className="text-xl font-bold">{stats.late}</p>
          <p className="text-xs text-gray-500">Late</p>
        </div>
      </div>

      {/* Calendar-style list */}
      <div className="space-y-2">
        {records.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-400">
            <p className="text-sm">No attendance records for this month</p>
          </div>
        ) : (
          records.map(r => {
            const dayName = new Date(r.date).toLocaleDateString('en-MY', { weekday: 'short' });
            const dayNum = new Date(r.date).getDate();
            return (
              <div key={r.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-4">
                <div className="text-center w-12">
                  <p className="text-xs text-gray-400">{dayName}</p>
                  <p className="text-lg font-bold">{dayNum}</p>
                </div>
                <div className={`w-1 h-10 rounded-full ${
                  r.status === 'present' ? 'bg-green-400' :
                  r.status === 'absent' ? 'bg-red-400' :
                  'bg-amber-400'
                }`} />
                <div className="flex-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === 'present' ? 'bg-green-100 text-green-700' :
                    r.status === 'absent' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {r.status === 'present' ? '✓ Present' : r.status === 'absent' ? '✗ Absent' : '⏰ Late'}
                  </span>
                  {r.absence_reason && <p className="text-xs text-gray-500 mt-0.5">{r.absence_reason}</p>}
                </div>
                <div className="text-right text-xs text-gray-400">
                  {r.check_in_time && <p>In: {new Date(r.check_in_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</p>}
                  {r.check_out_time && <p>Out: {new Date(r.check_out_time).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
