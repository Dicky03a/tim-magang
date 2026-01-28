
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Assignment, Profile } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    activeDeadlines: 0
  });
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Fetch Counts
    const { count: assignCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true });
    const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT');
    const { count: subCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true });
    
    const now = new Date().toISOString();
    const { count: activeCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).gt('deadline', now);

    setStats({
      totalAssignments: assignCount || 0,
      totalStudents: studentCount || 0,
      totalSubmissions: subCount || 0,
      activeDeadlines: activeCount || 0
    });

    // Fetch Recent Assignments
    const { data: recent } = await supabase
      .from('assignments')
      .select('*, course:courses(name), category:task_categories(name)')
      .order('created_at', { ascending: false })
      .limit(4);
    
    if (recent) setRecentAssignments(recent as unknown as Assignment[]);

    // Fetch Average Score Per Course for Chart
    const { data: scores } = await supabase
      .from('submissions')
      .select(`
        score,
        assignment:assignments(course:courses(name))
      `);
    
    if (scores) {
      const courseAvg: Record<string, { total: number, count: number }> = {};
      scores.forEach((s: any) => {
        const name = s.assignment.course.name;
        if (!courseAvg[name]) courseAvg[name] = { total: 0, count: 0 };
        courseAvg[name].total += s.score;
        courseAvg[name].count += 1;
      });

      const data = Object.keys(courseAvg).map(key => ({
        name: key.length > 10 ? key.substring(0, 10) + '...' : key,
        score: Math.round(courseAvg[key].total / courseAvg[key].count)
      }));
      setChartData(data.length > 0 ? data : [
        { name: 'MK Contoh', score: 0 }
      ]);
    }

    setLoading(false);
  };

  const statCards = [
    { label: 'Total Tugas', value: stats.totalAssignments, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Mahasiswa', value: stats.totalStudents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Pengerjaan', value: stats.totalSubmissions, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Tugas Aktif', value: stats.activeDeadlines, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-bold">Menyiapkan Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Ringkasan Sistem.</h1>
          <p className="text-slate-500 font-medium">Data performa akademik mahasiswa diperbarui secara otomatis.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/assignments')}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Buat Tugas Baru
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`bg-white p-7 rounded-[2rem] border-2 ${card.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-6">
                <div className={`${card.bg} ${card.color} p-4 rounded-2xl`}>
                  <Icon size={24} />
                </div>
                <div className="text-slate-300">
                  <TrendingUp size={20} />
                </div>
              </div>
              <h3 className="text-4xl font-black text-slate-900 tabular-nums">{card.value}</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black flex items-center gap-3">
              <div className="bg-blue-600 w-2 h-8 rounded-full"></div>
              Rata-rata Nilai per Mata Kuliah
            </h3>
            <div className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest">
              Statistik 2024
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '15px' }}
                />
                <Bar dataKey="score" radius={[10, 10, 10, 10]} barSize={50}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black">Tugas Terbaru</h3>
            <div className="text-blue-600 bg-blue-50 p-2 rounded-lg">
              <FileText size={18} />
            </div>
          </div>
          <div className="space-y-5 flex-1">
            {recentAssignments.map((assign) => (
              <div 
                key={assign.id} 
                onClick={() => navigate(`/admin/assignments/${assign.id}`)}
                className="group cursor-pointer p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-200 group-hover:scale-125 transition-transform"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                      {assign.title}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{assign.course?.name}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {assign.category?.name}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
            {recentAssignments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-30 italic">
                <Award size={40} className="mb-2" />
                <p className="text-sm">Belum ada tugas.</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => navigate('/admin/assignments')}
            className="w-full mt-8 py-4 bg-slate-50 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest"
          >
            Semua Tugas
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
