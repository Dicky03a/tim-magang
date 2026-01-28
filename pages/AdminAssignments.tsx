
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Assignment, TaskCategory, Course, Semester, Class } from '../types';
// Added 'X' to imports to fix the error on line 165
import { Plus, Search, FileText, ChevronRight, Filter, Eye, Trash2, X } from 'lucide-react';

const AdminAssignments: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    course_id: '',
    semester_id: '',
    class_id: '',
    deadline: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const [
      { data: assignData },
      { data: catData },
      { data: courseData },
      { data: semData },
      { data: classData }
    ] = await Promise.all([
      supabase.from('assignments').select('*, category:task_categories(name), course:courses(name), class:classes(name)').order('created_at', { ascending: false }),
      supabase.from('task_categories').select('*'),
      supabase.from('courses').select('*'),
      supabase.from('semesters').select('*'),
      supabase.from('classes').select('*')
    ]);

    if (assignData) setAssignments(assignData);
    if (catData) setCategories(catData);
    if (courseData) setCourses(courseData);
    if (semData) setSemesters(semData);
    if (classData) setClasses(classData);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from('assignments')
      .insert([formData])
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else {
      setShowModal(false);
      navigate(`/admin/assignments/${data.id}`);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus tugas ini beserta seluruh soalnya?')) return;
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchInitialData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tugas & Kuis</h1>
          <p className="text-slate-500 text-sm">Kelola semua penugasan akademik di sini.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
        >
          <Plus size={20} /> Tugas Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari tugas berdasarkan judul..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
            <Filter size={20} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {assignments.map((assign) => (
            <div key={assign.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{assign.title}</h4>
                  <p className="text-xs text-slate-500">
                    {assign.course?.name} • {assign.class?.name} • {assign.category?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-slate-700">Deadline</p>
                  <p className="text-xs text-slate-500">{new Date(assign.deadline).toLocaleDateString('id-ID')}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${assign.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                  {assign.is_published ? 'Published' : 'Draft'}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => navigate(`/admin/assignments/${assign.id}`)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(assign.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="p-12 text-center text-slate-400 italic">Belum ada tugas yang dibuat.</div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Buat Tugas Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Judul Tugas</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Kuis Pertemuan 1..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori</label>
                  <select 
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">Pilih...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mata Kuliah</label>
                  <select 
                    required
                    value={formData.course_id}
                    onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">Pilih...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Semester</label>
                  <select 
                    required
                    value={formData.semester_id}
                    onChange={(e) => setFormData({...formData, semester_id: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">Pilih...</option>
                    {semesters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Target Kelas</label>
                  <select 
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">Pilih...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Batas Waktu (Deadline)</label>
                <input 
                  type="datetime-local" 
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
              >
                Buat Tugas & Tambah Soal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignments;
