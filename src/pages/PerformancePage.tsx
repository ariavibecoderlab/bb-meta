import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BarChart3, BookOpen, Image, FileText } from 'lucide-react';

interface SubjectProgress {
  id: string;
  name: string;
  category: string;
  score: number;
  maxScore: number;
  status: string;
  teacherNotes: string;
}

interface WeeklyUpdate {
  id: string;
  week_start: string;
  summary: string;
  highlights: string;
  areas_for_improvement: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  media_type: string;
  media_url: string;
  created_at: string;
}

interface LearningPlan {
  id: string;
  term: string;
  goals: any[];
  overall_status: string;
}

export default function PerformancePage({ profile }: { profile: any }) {
  const { studentId } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [weeklyUpdates, setWeeklyUpdates] = useState<WeeklyUpdate[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'progress' | 'updates' | 'portfolio' | 'plan'>('progress');
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    if (profile.role === 'parent') {
      fetchChildren();
    }
    if (studentId) {
      fetchStudentData(studentId);
    }
  }, [studentId, profile]);

  const fetchChildren = async () => {
    const { data } = await supabase
      .from('parent_students')
      .select('student_id, students(id, full_name, nickname, gender)')
      .eq('parent_id', profile.id);
    if (data) {
      const kids = data.map((d: any) => d.students);
      setChildren(kids);
      if (!studentId && kids.length > 0) {
        fetchStudentData(kids[0].id);
      }
    }
  };

  const fetchStudentData = async (sId: string) => {
    // Student info
    const { data: stud } = await supabase.from('students').select('*').eq('id', sId).single();
    setStudent(stud);

    // Performance
    const { data: perf } = await supabase
      .from('student_performance')
      .select('*, subjects(name, category)')
      .eq('student_id', sId);
    if (perf) {
      setSubjects(perf.map((p: any) => ({
        id: p.id,
        name: p.subjects?.name || 'Unknown',
        category: p.subjects?.category || 'other',
        score: Number(p.score) || 0,
        maxScore: Number(p.max_score) || 100,
        status: p.status,
        teacherNotes: p.teacher_notes || '',
      })));
    }

    // Weekly updates
    const { data: updates } = await supabase
      .from('weekly_updates')
      .select('*')
      .eq('student_id', sId)
      .order('week_start', { ascending: false })
      .limit(10);
    setWeeklyUpdates(updates || []);

    // Portfolio
    const { data: port } = await supabase
      .from('student_portfolio')
      .select('*')
      .eq('student_id', sId)
      .order('created_at', { ascending: false })
      .limit(20);
    setPortfolio(port || []);

    // Learning plan
    const { data: plan } = await supabase
      .from('learning_plans')
      .select('*')
      .eq('student_id', sId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    setLearningPlan(plan || null);
  };

  const getStatusColor = (status: string) => {
    if (status === 'ahead') return 'text-blue-600 bg-blue-100';
    if (status === 'on_track') return 'text-green-600 bg-green-100';
    if (status === 'behind') return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ahead') return '⭐ Ahead';
    if (status === 'on_track') return '✅ On Track';
    if (status === 'behind') return '⚠️ Behind';
    return '🔴 Needs Attention';
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'montessori') return '🧩 Montessori';
    if (cat === 'islamic') return '🕌 Islamic Studies';
    if (cat === 'academic') return '📚 Academic';
    return '🎨 Extra';
  };

  const overallProgress = subjects.length > 0
    ? Math.round(subjects.reduce((sum, s) => sum + (s.score / s.maxScore * 100), 0) / subjects.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Student Header */}
      {student && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl">
              {student.gender === 'male' ? '👦' : '👧'}
            </div>
            <div>
              <h1 className="text-xl font-bold">{student.full_name}</h1>
              <p className="text-emerald-100">{student.nickname || ''}</p>
            </div>
            <div className="ml-auto text-center">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                  <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="6" fill="none"
                    strokeDasharray={`${overallProgress * 1.76} 176`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-bold text-sm">{overallProgress}%</span>
              </div>
              <p className="text-xs text-emerald-100 mt-1">Overall</p>
            </div>
          </div>
        </div>
      )}

      {/* Child Selector (if parent with multiple children) */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {children.map(c => (
            <button
              key={c.id}
              onClick={() => fetchStudentData(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                (studentId || children[0]?.id) === c.id ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 shadow-sm'
              }`}
            >
              {c.nickname || c.full_name}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'progress', label: 'Progress', icon: BarChart3 },
          { key: 'updates', label: 'Updates', icon: FileText },
          { key: 'portfolio', label: 'Portfolio', icon: Image },
          { key: 'plan', label: 'Plan', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium ${
              activeTab === tab.key ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'progress' && (
        <div className="space-y-3">
          {subjects.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-400">
              <BarChart3 size={40} className="mx-auto mb-2" />
              <p>No performance data yet</p>
              <p className="text-xs mt-1">Teachers will update progress throughout the term</p>
            </div>
          ) : (
            Object.entries(
              subjects.reduce((acc, s) => {
                const cat = s.category;
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(s);
                return acc;
              }, {} as Record<string, SubjectProgress[]>)
            ).map(([category, subs]) => (
              <div key={category}>
                <h3 className="font-semibold text-gray-700 text-sm mb-2">{getCategoryLabel(category)}</h3>
                <div className="space-y-2">
                  {subs.map(s => (
                    <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{s.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>
                          {getStatusLabel(s.status)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            s.score / s.maxScore >= 0.8 ? 'bg-green-500' :
                            s.score / s.maxScore >= 0.6 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(s.score / s.maxScore) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">{s.score}/{s.maxScore}</span>
                        <span className="text-xs text-gray-400">{Math.round(s.score / s.maxScore * 100)}%</span>
                      </div>
                      {s.teacherNotes && (
                        <p className="text-xs text-gray-500 mt-2 italic">📝 {s.teacherNotes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="space-y-3">
          {weeklyUpdates.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-400">
              <FileText size={40} className="mx-auto mb-2" />
              <p>No weekly updates yet</p>
              <p className="text-xs mt-1">Teachers post updates every week</p>
            </div>
          ) : (
            weeklyUpdates.map(u => (
              <div key={u.id} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-emerald-600 font-medium mb-2">
                  Week of {new Date(u.week_start).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-sm text-gray-700">{u.summary}</p>
                {u.highlights && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg">
                    <p className="text-xs font-medium text-green-700">✨ Highlights</p>
                    <p className="text-xs text-green-600">{u.highlights}</p>
                  </div>
                )}
                {u.areas_for_improvement && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-lg">
                    <p className="text-xs font-medium text-amber-700">🎯 Areas to Improve</p>
                    <p className="text-xs text-amber-600">{u.areas_for_improvement}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="space-y-3">
          {portfolio.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-400">
              <Image size={40} className="mx-auto mb-2" />
              <p>No portfolio items yet</p>
              <p className="text-xs mt-1">Photos and work samples will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {portfolio.map(p => (
                <div key={p.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {p.media_type === 'photo' ? (
                      <img src={p.media_url} alt={p.title || ''} className="w-full h-full object-cover" />
                    ) : p.media_type === 'video' ? (
                      <video src={p.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <FileText size={32} className="text-gray-300" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{p.title || 'Untitled'}</p>
                    <p className="text-[10px] text-gray-400">{new Date(p.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-3">
          {!learningPlan ? (
            <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-400">
              <BookOpen size={40} className="mx-auto mb-2" />
              <p>No learning plan yet</p>
              <p className="text-xs mt-1">Teacher will set up the learning plan for this term</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Term: {learningPlan.term}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(learningPlan.overall_status)}`}>
                  {getStatusLabel(learningPlan.overall_status)}
                </span>
              </div>
              <div className="space-y-3">
                {(Array.isArray(learningPlan.goals) ? learningPlan.goals : []).map((goal: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      goal.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {goal.completed ? '✓' : i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{goal.title || goal}</p>
                      {goal.description && <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
