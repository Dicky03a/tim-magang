
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Assignment, Submission, Profile } from '../types';
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  AlertCircle,
  History,
  TrendingUp
} from 'lucide-react';

interface StudentDashboardProps {
  profile: Profile;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
  }, [profile]);

  const fetchStudentData = async () => {
    setLoading(true);
    const { data: assignments } = await supabase
      .from('assignments')
      .select('*, course:courses(name), category:task_categories(name)')
      .eq('class_id', profile.class_id)
      .eq('semester_id', profile.semester_id)
      .eq('is_published', true)
      .order('deadline', { ascending: true });

    const { data: subs } = await supabase
      .from('submissions')
      .select('*, assignment:assignments(title, course:courses(name))')
      .eq('student_id', profile.id)
      .order('submitted_at', { ascending: false });

    if (assignments) setActiveAssignments(assignments);
    if (subs) setSubmissions(subs);
    setLoading(false);
  };

  const isCompleted = (assignmentId: string) => {
    return submissions.some(s => s.assignment_id === assignmentId);
  };

  if (loading) return <div className="h-full flex items-center justify-center">Loading...</div>;

  const pendingAssignments = activeAssignments.filter(a => !isCompleted(a.id));
  const avgScore = submissions.length > 0 
    ? Math.round(submissions.reduce((acc, s) => acc + (s.score || 0), 0) / submissions.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Halo, {profile.full_name}! 👋</h1>
            <p className="text-blue-100 opacity-90 max-w-xl">
              Fokus pada tugasmu hari ini. Kamu memiliki <span className="font-bold underline">{pendingAssignments.length} tugas</span> yang belum dikerjakan di kelas {(profile as any).class?.name || '-'}.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 flex items-center gap-4">
            <div className="p-3 bg-blue-500/30 rounded-xl">
              <TrendingUp size={24} className="text-blue-200" />
            </div>
            <div>
              <span className="block text-xs uppercase font-bold text-blue-200">Rata-rata Nilai</span>
              <span className="text-2xl font-black">{avgScore}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex space-x-4 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'pending' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Tugas Aktif ({pendingAssignments.length})
              {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'completed' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Riwayat Selesai ({submissions.length})
              {activeTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full"></div>}
            </button>
          </div>

          <div className="space-y-4">
            {activeTab === 'pending' ? (
              pendingAssignments.map(assign => (
                <div key={assign.id} className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600 mb-2">
                        {assign.category?.name} • {assign.course?.name}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{assign.title}</h3>
                    </div>
                    <div className="flex items-center text-xs font-medium px-3 py-1 rounded-full bg-orange-50 text-orange-600">
                      <Clock size={14} className="mr-1" />
                      Batas: {new Date(assign.deadline).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/assignment/${assign.id}`)}
                    className="w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
                  >
                    Kerjakan Sekarang <ArrowRight className="ml-2" size={18} />
                  </button>
                </div>
              ))
            ) : (
              submissions.map(sub => (
                <div key={sub.id} className="p-6 bg-white rounded-2xl border border-slate-100 flex justify-between items-center opacity-90">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{sub.assignment?.title}</h4>
                      <p className="text-xs text-slate-500">{sub.assignment?.course?.name} • Dikumpulkan: {new Date(sub.submitted_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-400 block uppercase tracking-tighter">Skor</span>
                    <span className="text-2xl font-black text-slate-900">{sub.score}</span>
                  </div>
                </div>
              ))
            )}

            {((activeTab === 'pending' && pendingAssignments.length === 0) || (activeTab === 'completed' && submissions.length === 0)) && (
              <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                  <History size={32} />
                </div>
                <p className="text-slate-500 font-medium italic">Tidak ada data untuk ditampilkan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-blue-500" />
              Status Akademik
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Program Studi</span>
                <span className="font-bold text-slate-900">Teknik Informatika</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Kelas</span>
                <span className="font-bold text-slate-900">{(profile as any).class?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Semester</span>
                <span className="font-bold text-slate-900">{(profile as any).semester?.name || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
